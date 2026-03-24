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
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disabled TimeZone=Asia/Kolkata",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
<<<<<<< HEAD
	log.Println("Connected to database:", dbname)
}

func Migrate(db * gorm.DB) {
	db.AutoMigrate(
		&models.User{},
		&models.Student{},
	)
}
=======
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
>>>>>>> 09dcb07 (JWT token authentication)
