package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"backend/config"
	"backend/models"
)

func GetStudentProfile(c *gin.Context) {
	var student models.Student
	if err := config.DB.First(&student, c.Param("id")).Error; err != nil {
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

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Strip sensitive fields
	delete(body, "password_hash")
	delete(body, "role")
	delete(body, "email")

	// JSONB fields — must be saved with explicit cast to avoid type mismatch
	jsonbFields := []string{
		"domains",
		"work_experience",
		"projects",
		"education",
		"certificates",
	}

	for _, field := range jsonbFields {
		if val, ok := body[field]; ok {
			delete(body, field)
			b, err := json.Marshal(val)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("invalid %s format", field),
				})
				return
			}
			jsonStr := string(b)
			result := config.DB.Exec(
				fmt.Sprintf(
					`UPDATE students SET %s = ?::jsonb, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
					field,
				),
				jsonStr,
				paramID,
			)
			if result.Error != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": fmt.Sprintf("failed to save %s: %s", field, result.Error.Error()),
				})
				return
			}
		}
	}

	// Update remaining scalar fields (name, branch, cgpa, etc.)
	if len(body) > 0 {
		result := config.DB.Model(&models.Student{}).
			Where("id = ? AND deleted_at IS NULL", paramID).
			Updates(body)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update profile: " + result.Error.Error(),
			})
			return
		}
	}

	// Return updated student
	var updated models.Student
	config.DB.First(&updated, paramID)
	c.JSON(http.StatusOK, updated)
}

func UploadPFP(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _  := strconv.ParseUint(c.Param("id"), 10, 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	file, err := c.FormFile("pfp")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file not provided"})
		return
	}

	ext      := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("pfp_%d%s", callerID.(uint), ext)
	dir      := filepath.Join(os.Getenv("STORAGE_PATH"), "pfps")
	os.MkdirAll(dir, 0755)

	if err := c.SaveUploadedFile(file, filepath.Join(dir, filename)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save file"})
		return
	}

	config.DB.Model(&models.Student{}).
		Where("id = ?", callerID).
		Update("pfp_file_name", filename)

	c.JSON(http.StatusOK, gin.H{"pfp_file_name": filename})
}

func UploadResume(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _  := strconv.ParseUint(c.Param("id"), 10, 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file not provided"})
		return
	}
	if filepath.Ext(file.Filename) != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only PDF files are accepted"})
		return
	}

	filename := fmt.Sprintf("resume_%d.pdf", callerID.(uint))
	dir      := filepath.Join(os.Getenv("STORAGE_PATH"), "resumes")
	os.MkdirAll(dir, 0755)

	dest := filepath.Join(dir, filename)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save file"})
		return
	}

	config.DB.Model(&models.Student{}).
		Where("id = ?", callerID).
		Updates(map[string]interface{}{
			"resume_file_name": filename,
			"resume_ready":     true,
		})

	c.JSON(http.StatusOK, gin.H{"resume_file_name": filename})
}

func DownloadResume(c *gin.Context) {
	var student models.Student
	if err := config.DB.First(&student, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	if !student.ResumeReady || student.ResumeFileName == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "resume not available yet"})
		return
	}

	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./storage"
	}
	filePath := filepath.Join(storagePath, "gen_resumes", student.ResumeFileName)

	// Check file exists on disk
	if _, err := os.Stat(filePath); err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "generated resume file does not exist",
				"path":  filePath,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Set all headers explicitly for reliable browser download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition",
	fmt.Sprintf(`attachment; filename="%s"`, student.ResumeFileName))
	c.Header("Content-Type", "application/pdf")
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.File(filePath)
}

func GenerateResume(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _  := strconv.ParseUint(c.Param("id"), 10, 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	config.DB.Model(&models.Student{}).
		Where("id = ?", callerID).
		Update("resume_ready", false)

	if err := pushResumeTask(callerID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "queue unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "resume generation queued"})
}

func pushResumeTask(userID uint) error {
	if queueClient == nil {
		return fmt.Errorf("Redis queue not initialised")
	}
	return queueClient.Push(map[string]interface{}{
		"task":    "gen_resume",
		"user_id": userID,
	})
}
