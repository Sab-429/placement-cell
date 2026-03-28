package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetRecruiterProfile(c *gin.Context) {
	var recruiter models.Recruiter
	if err := config.DB.First(&recruiter, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"recruiter not found"})
		return
	}
	c.JSON(http.StatusOK, recruiter)
}

func GetAllRecruiter(c *gin.Context) {
	var recruiters []models.Recruiter
	config.DB.Find(&recruiters)
	c.JSON(http.StatusOK, recruiters)
}

func UpdateRecruiterProfile(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _ := strconv.ParseUint(c.Param("id"), 10 , 64)

	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error":"you can only edit your profile"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":err.Error()})
		return
	}
	delete(updates, "password_hash")
	delete(updates, "role")

	config.DB.Model(&models.Recruiter{}).Where("id=?",paramID).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func UploadLogo(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	paramID, _ := strconv.ParseUint(c.Param("id"), 10 , 64)
	if callerID.(uint) != uint(paramID) {
		c.JSON(http.StatusForbidden, gin.H{"error":"forbidden"})
		return
	}

	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"file not provided"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("logo_%d%s", callerID.(uint), ext)
	dir := filepath.Join(os.Getenv("STORAGE_PATH"), "logos")
	os.MkdirAll(dir, 0755)

	if err := c.SaveUploadedFile(file, filepath.Join(dir, filename)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"could not save file"})
		return
	}

	config.DB.Model(&models.Recruiter{}).Where("id = ?", callerID).Update("logo_file_name",filename)
	c.JSON(http.StatusOK, gin.H{"logo_file_name":filename})
}

func GetAllStudents(c *gin.Context) {
	var students []models.Student
	config.DB.Find(&students)
	c.JSON(http.StatusOK, students)
}