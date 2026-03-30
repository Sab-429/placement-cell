package main

import (
	"backend/config"
	"backend/controllers"
	"backend/middlewares"
	"backend/routes"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env.global"); err != nil {
		log.Println("no .env.global file found, using system environment")
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