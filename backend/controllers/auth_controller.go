package controllers

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func RegisterStudent(c *gin.Context) {
	var input struct {
		Name     string `json:"name"     binding:"required"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return 
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	student := models.Student{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
	}
	if err := config.DB.Create(&student).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
		return 
	}
	c.JSON(http.StatusCreated, gin.H {
		"role" : "student",
		"user_id" : student.ID,
	})
}
func RegisterRecruiter(c *gin.Context) {
	var input struct {
		Name     string `json:"name"     binding:"required"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Domain   string `json:"domain"   binding:"required,domain"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	recruiter := models.Recruiter{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
		Domain:       input.Domain,
	}
	if err := config.DB.Create(&recruiter).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"role":    "recruiter",
		"user_id": recruiter.ID,
	})
}
func LoginStudent(c *gin.Context) {
	var input struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return 
	}
	var student models.Student
	if err := config.DB.Where("email = ?", input.Email).First(&student).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		}else{
			c.JSON(http.StatusInternalServerError,gin.H{"error": err.Error()})
		}
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(student.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, _ := utils.GenerateToken(student.ID,"student")
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role": "student",
		"user_id": student.ID,
	})
}

func LoginRecruiter(c*gin.Context) {
	var input struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return 
	}
	var recruiter models.Recruiter
	if err := config.DB.Where("email=?", input.Email).First(&recruiter).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(recruiter.PasswordHash),[]byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
	}
	token, _ := utils.GenerateToken(recruiter.ID, "recruiter")
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role": "recruiter",
		"user_id": recruiter.ID,
	})
}

func LoginAdmin(c *gin.Context) {
	var input struct{
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var admin models.Admin
	if err := config.DB.Where("email=?",input.Email).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized , gin.H{"error": "invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized , gin.H{"error": "invalid credentials"})
		return
	}
	token, _ := utils.GenerateToken(admin.ID, "admin")
	c.JSON(http.StatusOK , gin.H{
		"token" : token,
		"role" : "admin",
		"user_id" : admin.ID,
	})
}