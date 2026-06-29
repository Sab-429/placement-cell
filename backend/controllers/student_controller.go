package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"encoding/json"
	"github.com/gin-gonic/gin"
)

func GetStudentProfile(c *gin.Context) {
	var student models.Student
	if err := config.DB.First(&student, c.Param("id")).Error;err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return 
	}
	c.JSON(http.StatusOK, student)
}

func UpdateStudentProfile(c *gin.Context) {
    callerID, _ := c.Get("user_id")
    paramID, _  := strconv.ParseUint(c.Param("id"), 10, 64)

    if callerID.(uint) != uint(paramID) {
        c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
        return
    }

    var updates map[string]interface{}
    if err := c.ShouldBindJSON(&updates); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    delete(updates, "password_hash")
    delete(updates, "role")
    delete(updates, "email")

    // Extract domains separately — handle as JSON string for Postgres
    var domainsJSON string
    if domains, ok := updates["domains"]; ok {
        delete(updates, "domains") // remove from map first

        // Convert to JSON string
        b, err := json.Marshal(domains)
        if err == nil {
            domainsJSON = string(b)
        }
    }

    // Update non-domains fields first
    if len(updates) > 0 {
        if err := config.DB.Model(&models.Student{}).
            Where("id = ?", paramID).
            Updates(updates).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    // Update domains separately using raw SQL to avoid type issue
    if domainsJSON != "" {
        if err := config.DB.Exec(
            `UPDATE students SET domains = ?::jsonb WHERE id = ?`,
            domainsJSON, paramID,
        ).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func UploadPFP(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _ := strconv.ParseUint(c. Param("id"), 10 , 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error" : "forbidden"})
		return 
	}
	file, err := c.FormFile("pfp")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error" : "file not Provided"})
		return
	}
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("pfp_%d%s", callerID.(uint),ext)
	dir := filepath.Join(os.Getenv("STORAGE_PATH"), "pfps")
	os.MkdirAll(dir, 0755)

	if err := c.SaveUploadedFile(file, filepath.Join(dir, filename)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error" : "couldnot save file"})
		return 
	}
	config.DB.Model(&models.Student{}).Where("id = ?", callerID).Update("pfp_file_name", filename)
	c.JSON(http.StatusOK, gin.H{"pfp_file_name": filename})
}
 
func UploadResume(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden , gin.H{"error" : "forbidden"})
		return
	}
	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file not provided"})
		return 
	}
	if filepath.Ext(file.Filename) != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error" : "only pdf files are accepted"})
		return
	}
	filename := fmt.Sprintf("resume_%d.pdf", callerID.(uint))
	dir := filepath.Join(os.Getenv("STORAGE_PATH"), "resumes")
	os.MkdirAll(dir, 0755)

	if err := c.SaveUploadedFile(file, filepath.Join(dir,filename)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error" : "could not save file"})
		return 
	}
	config.DB.Model(&models.Student{}).Where("id = ?", callerID).Updates(map[string]interface{}{
		"resume_file_name": filename,
		"resume_ready":     true,
	})
	c.JSON(http.StatusOK, gin.H{"resume_file_name":filename})
}

func DownloadResume(c *gin.Context) {
	var student models.Student
	if err := config.DB.First(&student, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error" : "student not found"})
		return
	}
	if !student.ResumeReady || student.ResumeFileName == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "resume not available"})
		return
	}
	path := filepath.Join(os.Getenv("STORAGE_PATH"), "resume", student.ResumeFileName)
	c.FileAttachment(path, student.ResumeFileName)
}

func GenerateResume(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error":"forbidden"})
		return 
	}
	config.DB.Model(&models.Student{}).Where("id=?",callerID).Update("resume_ready",false)
	if err := pushResumeTask(callerID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "queue unavailable"})
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "resume generation queued"})
}

func pushResumeTask(userID uint) error {
	return queueClient.Push(map[string]interface{}{
		"task":    "gen_resume",
		"user_id": userID,
	})
}
