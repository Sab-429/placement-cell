package controllers

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var user model.User

	if err := c.ShouldBindJSON(&user); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error" : err.Error()})
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), 14)
	query := `INSERT INTO users (email,password,role) VALUES ($1, $2, $3) RETURNING id`
	err := config.DB.QueryRow(context.Background(),query,
		user.Email, string(hashedPassword), user.Role).Scan(&user.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User already exists with this email"})
		return 
	}
	c.JSON(http.StatusOk,gin.H{"message" : "User registered"})
}

func Login(c *gin.Context) {
	var input models.User
	var user models.User

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest,gin.H{"error": err.Error()})
		return 
	}
	query := `SELECT id,email,password,role FROM users WHERE email=$1`
	err := config.DB.QueryRow(context.Background(),query,input.Email).
		Scan(&user.ID, &user.Email, &user.Password , &user.Role)

	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{"error": "Invalid credentials"})
		return 
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	token, _ := utils.GenerateJWT(user.Email, user.Role)
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}