package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

<<<<<<< HEAD
// Generate JWT token
func GenerateJWT(userID uint, email string, role string) (string, error) {

	claims := jwt.MapClaims{
		"user_id" : userID,
		"email": email,
		"role":  role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	secret := os.Getenv("JWT_SECRET")

	return token.SignedString([]byte(secret))
}

// Validate JWT token
func ValidateJWT(tokenString string) (jwt.MapClaims, error) {

	secret := os.Getenv("JWT_SECRET")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}

		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
=======
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
>>>>>>> 09dcb07 (JWT token authentication)
