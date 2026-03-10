package models

import "gorm.io/gorm"

type Application struct {
	gorm.Model
	StudentID uint   `json:"student_id"`
	ListingID uint   `json:"listing_id"`
	Status    string `json:"status"`
}
