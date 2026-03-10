package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {

	api := router.Group("/api")

	// Auth routes
	api.POST("/register", controllers.Register)
	api.POST("/login", controllers.Login)

	// Protected routes
	protected := api.Group("/")
	protected.Use(middlewares.AuthMiddleware())

	// Dashboards
	protected.GET("/student/dashboard", controllers.StudentDashboard)
	protected.GET("/recruiter/dashboard", controllers.RecruiterDashboard)
	protected.GET("/admin/dashboard", controllers.AdminDashboard)

	// Student routes
	protected.GET("/student/profile", controllers.GetStudentProfile)
	protected.PUT("/student/profile", controllers.UpdateStudentProfile)

	protected.GET("/student/listings", controllers.GetListings)
	protected.POST("/student/apply", controllers.ApplyToListing)
}