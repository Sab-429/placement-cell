package models

import "gorm.io/gorm"

type Student struct {
	gorm.Model
	UserID      uint   `json:"user_id"`
	Name        string `json:"name"`
	Branch      string `json:"branch"`
	CGPA        float64 `json:"cgpa"`
	PassingYear int    `json:"passing_year"`
	About       string `json:"about"`
	Domains     string `json:"domains"`
}