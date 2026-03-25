package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint,role string) (string,error) {
	secret := os.Getenv("JWT_SECRET")
	expiryHours, err := strconv.Atoi(os.Getenv("JWT_EXPIRY_HOURS"))
	if err != nil {
		expiryHours = 72
	}
	claims := &Claims{
		UserID: userID,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours))),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}
	token  := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(tokenStr string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")
	claims := &Claims{}

	token , err := jwt.ParseWithClaims(tokenStr , claims, func(t*jwt.Token) (interface{},error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Unexpected signing Method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("Expired token")
	}
	return claims, nil
}
