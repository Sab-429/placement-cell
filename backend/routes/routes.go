package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {

	api := router.Group("/api")

	api.POST("/register", controllers.Register)
	api.POST("/login", controllers.Login)

	protected := api.Group("/")
	protected.Use(middlewares.AuthMiddleware())

	protected.GET("/student/dashboard", controllers.StudentDashboard)
	protected.GET("/recruiter/dashboard", controllers.RecruiterDashboard)
	protected.GET("/admin/dashboard", controllers.AdminDashboard)
}