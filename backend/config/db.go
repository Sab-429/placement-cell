package config

import (
	"backend/models"
	"fmt"
	"log"
	"os"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Kolkata",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		sslMode,
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	err = db.AutoMigrate(
		&models.Student{},
		&models.Recruiter{},
		&models.Admin{},
		&models.Listing{},
		&models.Application{},
	)
	if err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	DB = db
	log.Println("database connected and migrated successfully")
}
