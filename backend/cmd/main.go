package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/gin-contrib/cors"
	"time"
)

func main() {
	err := godotenv.Load(".env.global")
	if err != nil {
		log.Fatal("Error loading env.global file")
	}

	config.ConnectDB()

	err = config.DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Migration failed:", err)
	}

router := gin.Default()

router.Use(cors.New(cors.Config{
	AllowOrigins:     []string{"http://localhost:5173"},
	AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
	ExposeHeaders:    []string{"Content-Length"},
	AllowCredentials: true,
	MaxAge:           12 * time.Hour,
}))

routes.SetupRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Println("Server running on port", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}