package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
	"gorm.io/gorm"
)

type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = StringArray{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("StringArray: cannot scan type %T", value)
	}
	return json.Unmarshal(bytes, s)
}

type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	b, err := json.Marshal(j)
	return string(b), err
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = JSONB{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("JSONB: cannot scan %T", value)
	}
	return json.Unmarshal(bytes,j)
}

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
	Domains        StringArray `gorm:"type:text"               json:"domains"`
	WorkExperience JSONB       `gorm:"type:jsonb"              json:"work_experience"`
	Projects       JSONB       `gorm:"type:jsonb"              json:"projects"`
	Education      JSONB       `gorm:"type:jsonb"              json:"education"`
	Certificates   JSONB       `gorm:"type:jsonb"              json:"certificates"`
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
