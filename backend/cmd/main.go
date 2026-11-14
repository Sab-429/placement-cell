package main

import (
	"backend/config"
	"backend/controllers"
	"backend/middlewares"
	"backend/routes"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// .env.global is not mounted inside the container — env vars are injected
	// via Kubernetes ConfigMap and Secrets. Skip godotenv in production.
	if os.Getenv("APP_ENV") != "production" {
		if err := godotenv.Load("../.env.global"); err != nil {
			log.Println("failed to load ../.env.global:", err)
		} else {
			log.Println("loaded ../.env.global successfully")
		}
	}
	config.ConnectDB()

	controllers.InitQueue()

	r := gin.Default()

	r.Use(middlewares.CORS())

	routes.SetUpRoutes(r)

	r.Static("/files", "./storage")

	log.Println("server running on port :8080")
	r.Run(":8080")
}