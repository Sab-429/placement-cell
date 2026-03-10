package controllers

import (
	"backend/models"
	"backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetStudentProfile(c *gin.Context) {

	userID := c.GetUint("user_id")

	student, err := services.GetStudentProfile(userID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

func UpdateStudentProfile(c *gin.Context) {

	var student models.Student

	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err := services.UpdateStudentProfile(student)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}

func GetListings(c *gin.Context) {

	listings, err := services.GetAllListings()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch listings"})
		return
	}

	c.JSON(http.StatusOK, listings)
}

func ApplyToListing(c *gin.Context) {

	var application models.Application

	if err := c.ShouldBindJSON(&application); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err := services.ApplyToListing(application)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Application failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application submitted"})
}