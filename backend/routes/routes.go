package routes

import (
	"backend/controllers"
	"backend/middlewares"

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
	
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOk, gin.H{
			"status" : "ok",
			"service": "placement-api",
		})
	})

	api.GET("/health/ready", func(c *gin.Context) {
		sqlDB, err := config.DB.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H {
				"status" : "not ready",
				"error" : "cannot get DB instance",
			})
			return
		}
		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H {
				"status": "not ready",
            			"error":  "DB ping failed: " + err.Error(),
			})
			return
		}
		 c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})
	//----student route
	student := api.Group("/student", middlewares.Auth("student"))
	{
		student.GET("/students/:id",                   controllers.GetStudentProfile)
		student.PUT("/students/:id",                   controllers.UpdateStudentProfile)
		student.POST("/students/:id/pfp",              controllers.UploadPFP)
		student.POST("/students/:id/resume",           controllers.UploadResume)
		student.POST("/students/:id/resume/generate",  controllers.GenerateResume)
		student.GET("/students/:id/resume/download",   controllers.DownloadResume)
		student.GET("/applications",                   controllers.GetMyApplications)
		student.GET("/listings/:id/status",            controllers.GetApplicationStatus)
		student.POST("/listings/:id/apply",            controllers.ApplyToListing)
	}

	//-----Recruiter route
	recruiter := api.Group("/recruiter", middlewares.Auth("recruiter"))
	{
		recruiter.GET("/recruiters/:id"	,					controllers.GetRecruiterProfile)
		recruiter.PUT("/recruiters/:id",                    controllers.UpdateRecruiterProfile)
		recruiter.POST("/recruiters/:id/logo",              controllers.UploadLogo)
		recruiter.GET("/students",                          controllers.GetAllStudents)
		recruiter.GET("/students/:id",                      controllers.GetStudentProfile)
		recruiter.POST("/listings",                         controllers.CreateListing)
		recruiter.PUT("/listings/:id",                      controllers.UpdateListing)
		recruiter.GET("/listings/:id/applications",         controllers.GetApplicationsForListing)
		recruiter.PUT("/applications/:id/status",           controllers.UpdateApplicationStatus)
		recruiter.GET("/students/:id/resume/download", 		controllers.DownloadResume)

	}
	//------admin route
	admin := api.Group("/admin", middlewares.Auth("admin"))
	{
		admin.GET("/students",          controllers.AdminGetStudents)
		admin.DELETE("/students/:id",   controllers.AdminDeleteStudent)
		admin.GET("/recruiters",        controllers.AdminGetRecruiters)
		admin.DELETE("/recruiters/:id", controllers.AdminDeleteRecruiter)
		admin.GET("/listings",          controllers.AdminGetListings)
		admin.DELETE("/listings/:id",   controllers.AdminDeleteListing)
		admin.GET("/metrics",           controllers.AdminGetMetrics)
		admin.GET("/health",            controllers.AdminHealthCheck)
	}
}
