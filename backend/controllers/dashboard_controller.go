package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func StudentDashboard(c *gin.Context) {
	role := c.GetString("role")

	if role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Welcome Student"})
}

func RecruiterDashboard(c *gin.Context) {
	role := c.GetString("role")

	if role != "recruiter" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Welcome Recruiter"})
}
func AdminDashboard(c *gin.Context) {
	role := c.GetString("role")

	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Welcome Admin"})
}