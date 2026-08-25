package models

import (
	"time"
	"gorm.io/gorm"
 	"gorm.io/datatypes"
)

//student model section

type Student struct {
	ID             uint           `gorm:"primarykey"    json:"id"`
	CreatedAt      time.Time      `                     json:"created_at"`
	UpdatedAt      time.Time      `                     json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"         json:"-"`
	Role           string      `gorm:"default:'student'"       json:"role"`
	Name           string      `                               json:"name"`
	Email          string      `gorm:"uniqueIndex"             json:"email"`
	PasswordHash   string      `                               json:"-"` // never sent in JSON responses
	About          string      `                               json:"about"`
	Branch         string      `                               json:"branch"`
	CGPA           float64     `                               json:"cgpa"`
	PassingYear    int         `                               json:"passing_year"`
	PFPFileName    string      `                               json:"pfp_file_name"`
	ResumeFileName string      `                               json:"resume_file_name"`
	ResumeReady    bool        `gorm:"default:false"           json:"resume_ready"`
	Domains      datatypes.JSON 		`gorm:"type:jsonb" 	  json:"domains"`
	WorkExperience datatypes.JSON       `gorm:"type:jsonb"    json:"work_experience"`
	Projects       datatypes.JSON       `gorm:"type:jsonb"    json:"projects"`
	Education      datatypes.JSON       `gorm:"type:jsonb"    json:"education"`
	Certificates   datatypes.JSON       `gorm:"type:jsonb"    json:"certificates"`
}

// Recruiter model section
type Recruiter struct {
	ID             uint           `gorm:"primarykey"    json:"id"`
	CreatedAt      time.Time      `                     json:"created_at"`
	UpdatedAt      time.Time      `                     json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"         json:"-"`
	Role         string `gorm:"default:'recruiter'" json:"role"`
	Name         string `                           json:"name"`
	Email        string `gorm:"uniqueIndex"         json:"email"`
	PasswordHash string `                           json:"-"`
	Domain       string `                           json:"domain"`
	About        string `                           json:"about"`
	NumEmployees int    `                           json:"num_employees"`
	LogoFileName string `                           json:"logo_file_name"`
}

//Admin section model

type Admin struct {
	ID             uint           `gorm:"primarykey"    json:"id"`
	CreatedAt      time.Time      `                     json:"created_at"`
	UpdatedAt      time.Time      `                     json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"         json:"-"`
	Role         string `gorm:"default:'admin'" json:"role"`
	Email        string `gorm:"uniqueIndex"     json:"email"`
	PasswordHash string `                       json:"-"`
}
