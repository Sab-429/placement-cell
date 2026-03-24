package models

import (
	"time"
	"gorm.io/gorm"
)

type Application struct {
	gorm.Model
	StudentID uint      `json:"student_id"`
	Student   Student   `json:"student"` 
	ListingID uint      `json:"listing_id"`
	Listing   Listing   `json:"listing"`
	Status    string    `gorm:"default:'applied'" json:"status"`
	AppliedAt time.Time `json:"applied_at"`
}