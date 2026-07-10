package models

import (
	"time"
	"gorm.io/gorm"
)

type Application struct {
	ID             uint           `gorm:"primarykey"    json:"id"`
	CreatedAt      time.Time      `                     json:"created_at"`
	UpdatedAt      time.Time      `                     json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"         json:"-"`
	StudentID uint      `json:"student_id"`
	Student   Student   `json:"student"`   // populated by Preload("Student")
	ListingID uint      `json:"listing_id"`
	Listing   Listing   `json:"listing"`   // populated by Preload("Listing")
	Status    string    `gorm:"default:'applied'" json:"status"`
	AppliedAt time.Time `json:"applied_at"`
}