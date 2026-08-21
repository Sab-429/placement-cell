package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminGetStudents(c *gin.Context) {
	var students []models.Student
	config.DB.Find(&students)
	c.JSON(http.StatusOK, students)
}

func AdminGetRecruiters(c *gin.Context) {
	var recruiters []models.Recruiter
	config.DB.Find(&recruiters)
	c.JSON(http.StatusOK, recruiters)
}

func AdminGetListings(c *gin.Context) {
	var listings []models.Listing
	config.DB.Preload("Recruiter").Order("created_at DESC").Find(&listings)
	c.JSON(http.StatusOK, listings)
}

func AdminDeleteStudent(c *gin.Context) {
	config.DB.Delete(&models.Student{}, c.Param("id"))
	c.JSON(http.StatusOK, gin.H{"message":"student deleted"})
}

func AdminDeleteRecruiter(c *gin.Context) {
	config.DB.Delete(&models.Recruiter{}, c.Param("id"))
	c.JSON(http.StatusOK, gin.H{"message":"recruiter deleted"})
}

func AdminDeleteListing(c *gin.Context) {
	config.DB.Delete(&models.Listing{}, c.Param("id"))
	c.JSON(http.StatusOK, gin.H{"message": "listing deleted"})
}

func AdminGetMetrics(c *gin.Context) {
	var students, recruiters, listings, applications int64

	config.DB.Model(&models.Student{}).Count(&students)
	config.DB.Model(&models.Recruiter{}).Count(&recruiters)
	config.DB.Model(&models.Listing{}).Count(&listings)
	config.DB.Model(&models.Application{}).Count(&applications)

	var selected, shortlisted, rejected int64
	config.DB.Model(&models.Application{}).Where("status = 'selected'").Count(&selected)
	config.DB.Model(&models.Application{}).Where("status = 'shortlisted'").Count(&shortlisted)
	config.DB.Model(&models.Application{}).Where("status = 'rejected'").Count(&rejected)

	c.JSON(http.StatusOK, gin.H{
		"total_students":     students,
		"total_recruiters":   recruiters,
		"total_listings":     listings,
		"total_applications": applications,
		"selected":           selected,
		"shortlisted":        shortlisted,
		"rejected":           rejected,
	})
}

func AdminHealthCheck(c *gin.Context) {
	sqlDB, err := config.DB.DB()
	dbStatus := "ok"
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "error"
	}
	c.JSON(http.StatusOK, gin.H{
		"api":      "ok",
		"database": dbStatus,
	})
}