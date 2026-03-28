package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetUpRoutes(r *gin.Engine) {

	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/student/register",   controllers.RegisterStudent)
		auth.POST("/student/login",      controllers.LoginStudent)
		auth.POST("/recruiter/register", controllers.RegisterRecruiter)
		auth.POST("/recruiter/login",    controllers.LoginRecruiter)
		auth.POST("/admin/login",        controllers.LoginAdmin)
	}
	api.GET("/listings",    controllers.GetAllListing)
	api.GET("/listings/:id", controllers.GetOneListing)
	api.GET("/recruiters",  controllers.GetAllRecruiter)
	api.GET("/recruiters/:id", controllers.GetRecruiterProfile)
}