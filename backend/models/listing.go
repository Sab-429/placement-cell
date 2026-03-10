package models

import "gorm.io/gorm"

type Listing struct {
	gorm.Model
	Title        string `json:"title"`
	Type         string `json:"type"`
	Description  string `json:"description"`
	Skills       string `json:"skills"`
	CompanyID    uint   `json:"company_id"`
	Vacancies    int    `json:"vacancies"`
	IsOpen       bool   `json:"is_open"`
	Salary       int    `json:"salary"`
}