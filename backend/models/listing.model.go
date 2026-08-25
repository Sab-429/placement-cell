package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)
type Listing struct {
	ID              uint            `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       gorm.DeletedAt  `gorm:"index" json:"-"`
	Title           string      `json:"title"`
	Type            string      `json:"type"`             // "remote" | "on-site"
	JobType         string      `json:"job_type"`         // "internship" | "full-time"
	IsOpen          bool        `gorm:"default:true"      json:"is_open"`
	Description     string      `json:"description"`
	Skills          datatypes.JSON `gorm:"type:text"         json:"skills"`
	RecruiterID     uint        `json:"recruiter_id"`
	Recruiter       Recruiter   `json:"recruiter"`
	Vacancies       int         `json:"vacancies"`
	ApplicationsNum int         `gorm:"default:0"         json:"applications_num"`
	SalaryMin       int         `json:"salary_min"`
	SalaryMax       int         `json:"salary_max"`
	ExperienceYears int         `json:"experience_years"`
	ExpiresAt       time.Time   `json:"expires_at"`
}