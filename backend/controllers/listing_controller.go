package controllers

import (
	"backend/config"
	"backend/models"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllListing(c *gin.Context) {
	var listings []models.Listing
	query := config.DB.Preload("Recruiter")

	// Public browse: only open listings. Recruiter dashboards pass company_id
	// and must still see their closed posts.
	if cid := c.Query("company_id"); cid != "" {
		query = query.Where("recruiter_id = ?", cid)
	} else {
		query = query.Where("is_open = ?", true)
	}

	if jt := c.Query("job_type"); jt != "" {
		query = query.Where("job_type = ?",jt)
	}
	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if sal := c.Query("salary_min"); sal != "" {
		query = query.Where("salary_min >= ?", sal)
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

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	listing := models.Listing{
		RecruiterID: recruiterID.(uint),
		IsOpen:      true,
	}

	if v, ok := body["title"].(string); ok            { listing.Title = v }
	if v, ok := body["type"].(string); ok             { listing.Type = v }
	if v, ok := body["job_type"].(string); ok         { listing.JobType = v }
	if v, ok := body["description"].(string); ok      { listing.Description = v }
	if v, ok := body["salary_min"].(float64); ok      { listing.SalaryMin = int(v) }
	if v, ok := body["salary_max"].(float64); ok      { listing.SalaryMax = int(v) }
	if v, ok := body["experience_years"].(float64); ok { listing.ExperienceYears = int(v) }
	if v, ok := body["vacancies"].(float64); ok       { listing.Vacancies = int(v) }

	// Parse expires_at — handle datetime-local format from browser
	if ea, ok := body["expires_at"].(string); ok && ea != "" {
		formats := []string{
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05Z",
			"2006-01-02T15:04:05",
			"2006-01-02T15:04",
			"2006-01-02T15:04Z",
		}
		for _, f := range formats {
			if t, err := time.Parse(f, ea); err == nil {
				listing.ExpiresAt = t
				break
			}
		}
	}

	// Handle skills array
	if rawSkills, ok := body["skills"].([]interface{}); ok {
		skills := make(models.StringArray, 0, len(rawSkills))
		for _, s := range rawSkills {
			if str, ok := s.(string); ok && str != "" {
				skills = append(skills, str)
			}
		}
		listing.Skills = skills
	}

	if err := config.DB.Create(&listing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create listing"})
		return
	}
	c.JSON(http.StatusCreated, listing)
}

func UpdateListing(c *gin.Context) {
	recruiterID, _ := c.Get("user_id")

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
		c.JSON(http.StatusInternalServerError, gin.H{"error" : "delete failed"})
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
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	var listing models.Listing
	if err := config.DB.Preload("Recruiter").First(&listing, listingID).Error; err != nil || !listing.IsOpen {
		c.JSON(http.StatusBadRequest, gin.H{"error": "listing not available"})
		return
	}
	var student models.Student
	config.DB.First(&student, studentID)
	app := models.Application {
		StudentID: studentID.(uint),
		ListingID: uint(listingID),
		Status:    "applied",
		AppliedAt: time.Now(),
	}
	config.DB.Create(&app)

	// Increment applications counter
	config.DB.Model(&listing).
		UpdateColumn("applications_num", listing.ApplicationsNum+1)

	// Notify recruiter by email (async)
	if queueClient != nil && listing.Recruiter.Email != "" {
		queueClient.Push(map[string]interface{}{
			"task":             "notify_recruiter_new_application",
			"recruiter_email":  listing.Recruiter.Email,
			"recruiter_name":   listing.Recruiter.Name,
			"student_name":     student.Name,
			"student_email":    student.Email,
			"student_branch":   student.Branch,
			"student_cgpa":     student.CGPA,
			"listing_title":    listing.Title,
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "applied successfully",
		"id":         app.ID,
		"status":     app.Status,
		"listing_id": app.ListingID,
		"student_id": app.StudentID,
	})
}