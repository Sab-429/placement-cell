package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func StudentRoutes(r *gin.RouterGroup) {

	student := r.Group("/student")

	student.Use(middlewares.AuthMiddleware())

	{
		student.GET("/profile", controllers.GetStudentProfile)

		student.PUT("/profile", controllers.UpdateStudentProfile)

		student.GET("/listings", controllers.GetListings)

		student.POST("/apply", controllers.ApplyToListing)
	}
}