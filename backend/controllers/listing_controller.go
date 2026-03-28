package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAllListing(c *gin.Context) {
	var listings []models.Listing
	query := config.DB.Preload("Recruiter").Where("is_open = true")

	if jt := c.Query("job_type"); jt != "" {
		query = query.Where("job_type = ?",jt)
	}
	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if sal := c.Query("salary_min"); sal != "" {
		query = query.Where("salary_min >= ?", sal)
	}
	if cid := c.Query("company_id"); cid != "" {
		query = query.Where("recruiter_id = ?", cid)
	}
	if exp := c.Query("experience"); exp != "" {
		query = query.Where("experience_years <= ?", exp)
	}
	order := c.DefaultQuery("order", "latest")
	if order == "oldest" {
		query = query.Order("created_at ASC")
	}else{
		query = query.Order("created_at DESC")
	}
	query.Find(&listings)
	c.JSON(http.StatusOK, listings)
}

func GetOneListing(c *gin.Context) {
	var listing models.Listing
	if err := config.DB.Preload("Recruiter").First(&listing, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"listing not found"})
		return
	}
	c.JSON(http.StatusOK, listing)
}

func CreateListing(c *gin.Context) {
	recruiterID, _ := c.Get("user_id")

	var listing models.Listing
	if err := c.ShouldBindJSON(&listing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":err.Error()})
		return
	}
	listing.RecruiterID = recruiterID.(uint)
	if err := config.DB.Create(&listing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create Listing"})
		return
	}
	c.JSON(http.StatusCreated, listing)
} 

func UpdateListing(c *gin.Context) {
	recruiterID, _ := c.Get("User_id")

	var listing models.Listing
	if err := config.DB.First(&listing, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"listing not found"})
		return
	}

	if listing.RecruiterID != recruiterID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error" : "you donot own this listing"})
		return
	}
	var updates map[string]interface{}
	c.ShouldBindJSON(&updates)
	delete(updates, "recruiter_id")
	config.DB.Model(&listing).Updates(updates)
	c.JSON(http.StatusOK, listing)
}

func DeleteListing(c *gin.Context) {
	if err := config.DB.Delete(&models.Listing{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"error" : "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message":"listing deleted"})
}

func ApplyToListing(c *gin.Context) {
	studentID, _ := c.Get("user_id")
	listingID, _ := strconv.ParseUint(c.Param("id"),10,64)

	var existing models.Application
	err := config.DB.Where("student_id = ? AND listing_id = ?", studentID, listingID).First(&existing).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "you have already applied"})
		return
	}

	var listing models.Listing
	if err := config.DB.First(&listing, listingID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"listing not available"})
		return 
	}
	
	app := models.Application {
		StudentID: studentID.(uint),
		ListingID: uint(listingID),
		Status: "applied",
	}
	if err := config.DB.Create(&app).Error; err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{"error":"failed to apply"})
	return
}
	config.DB.Create(&app)
	config.DB.Model(&listing).UpdateColumn("applications_num",listing.ApplicationsNum + 1)
	c.JSON(http.StatusCreated, app)
}