package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)
type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	b, err := json.Marshal(s)
	return string(b), err
}
func (s *StringArray) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("StringArray: type assertion to []byte failed")
	}
	return json.Unmarshal(b, s)
}

type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	b, err := json.Marshal(j)
	return string(b), err
}
func (j *JSONB) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("JSONB: type assertion to []byte failed")
	}
	return json.Unmarshal(b, j)
}

type Student struct {
	gorm.Model
	Role           string      `gorm:"default:'student'"       json:"role"`
	Name           string      `                               json:"name"`
	Email          string      `gorm:"uniqueIndex"             json:"email"`
	PasswordHash   string      `                               json:"-"` 
	About          string      `                               json:"about"`
	Branch         string      `                               json:"branch"`
	CGPA           float64     `                               json:"cgpa"`
	PassingYear    int         `                               json:"passing_year"`
	PFPFileName    string      `                               json:"pfp_file_name"`
	ResumeFileName string      `                               json:"resume_file_name"`
	ResumeReady    bool        `gorm:"default:false"           json:"resume_ready"`
	Domains        StringArray `gorm:"type:text"               json:"domains"`
	WorkExperience JSONB       `gorm:"type:jsonb"              json:"work_experience"`
	Projects       JSONB       `gorm:"type:jsonb"              json:"projects"`
	Education      JSONB       `gorm:"type:jsonb"              json:"education"`
	Certificates   JSONB       `gorm:"type:jsonb"              json:"certificates"`
}

type Recruiter struct {
	gorm.Model
	Role         string `gorm:"default:'recruiter'" json:"role"`
	Name         string `                           json:"name"`
	Email        string `gorm:"uniqueIndex"         json:"email"`
	PasswordHash string `                           json:"-"`
	Domain       string `                           json:"domain"`
	About        string `                           json:"about"`
	NumEmployees int    `                           json:"num_employees"`
	LogoFileName string `                           json:"logo_file_name"`
}

type Admin struct {
	gorm.Model
	Role         string `gorm:"default:'admin'" json:"role"`
	Email        string `gorm:"uniqueIndex"     json:"email"`
	PasswordHash string `                       json:"-"`
}