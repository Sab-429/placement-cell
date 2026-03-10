package services

import (
	"backend/config"
	"backend/models"
)

func GetStudentProfile(userID uint) (models.Student, error) {
	var student models.Student
	err := config.DB.Where("user_id = ?", userID).First(&student).Error
	return student, err
}

func UpdateStudentProfile(student models.Student) error {
	return config.DB.Save(&student).Error
}

func GetAllListings() ([]models.Listing, error) {
	var listings []models.Listing
	err := config.DB.Where("is_open = ?", true).Find(&listings).Error
	return listings, err
}

func ApplyToListing(application models.Application) error {
	return config.DB.Create(&application).Error
}