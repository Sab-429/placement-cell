package utils

import (
	"os"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(email string , role string) (string, error) {
	claims := jwt.MapClaims{
		"email" : email,
		"role" : role,
		"exp" : time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NextWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_secret")))
}