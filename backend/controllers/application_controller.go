package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyApplications(c *gin.Context) {
	studentID, _ := c.Get("user_id")

	var apps []models.Application
	config.DB.Preload("Listing.Recruiter").Where("student_id = ?", studentID).Find(&apps)
	c.JSON(http.StatusOK, apps)
}

func GetApplicationsForListing(c *gin.Context) {
	recruiterID, _ := c.Get("user_id")

	var listing models.Listing
	if err := config.DB.First(&listing, c.Param("id")).Error;err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"listing not found"})
		return
	}

	if listing.RecruiterID != recruiterID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error":"access denied"})
		return
	}

	var apps []models.Application
	config.DB.Preload("student").Where("listing_id = ?", c.Param("id")).Find(&apps)
	c.JSON(http.StatusOK, apps)
}

func UpdateApplicationStatus(c *gin.Context) {
	var body struct {
		Status string `json:"status" binding:"required,oneof=applied shortlisted, selected, rejected"` 
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"status must be one of: applied, shortlisted, selected, rejected"})
		return
	}

	validStatuses := map[string]bool{
		"applied": true, "shortlisted": true,
		"selected": true, "rejected": true,
	}
	if !validStatuses[body.Status] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "status must be one of: applied, shortlisted, selected, rejected",
		})
		return
	}

	var app models.Application
	if err := config.DB.Preload("Listing").First(&app, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"application not found"})
		return
	}
	recruiterID, _ := c.Get("user_id")
	if app.Listing.RecruiterID != recruiterID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}
	config.DB.Model(&app).Update("status",body.Status)

	if queueClient != nil && app.Student.Email != "" {
		queueClient.Push(map[string]interface{}{
			"task":          "notify_student_status_change",
			"student_email": app.Student.Email,
			"student_name":  app.Student.Name,
			"company_name":  app.Listing.Recruiter.Name,
			"listing_title": app.Listing.Title,
			"status":        body.Status,
		})
	}
	c.JSON(http.StatusOK, gin.H{"message":"status updated", "status": body.Status})
}

func GetApplicationStatus(c *gin.Context) {
	studentID, _ := c.Get("user_id")

	var app models.Application
	err := config.DB.Where("student_id = ? AND listing_id = ?", studentID, c.Param("id")).First(&app).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"no application found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status":app.Status, "applied_at": app.AppliedAt})
}