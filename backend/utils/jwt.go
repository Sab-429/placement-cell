package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	//custom claims
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
	//jwt.RegisteredClaims gives you standard JWT claims such as:
	//exp → expiration time
	//iat → issued at
	//iss → issuer
}

func GenerateToken(userID uint, role string) (string, error) {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        return "", errors.New("JWT_SECRET not set")
    }
    hoursStr := os.Getenv("JWT_EXPIRY_HOURS")
    expiryHours, err := strconv.ParseInt(hoursStr, 10, 64)
    if err != nil || expiryHours <= 0 {
        expiryHours = 72
    }

    now := time.Now()
    expiry := now.Add(time.Duration(expiryHours) * time.Hour)

    claims := &Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expiry),
            IssuedAt:  jwt.NewNumericDate(now),
            Issuer:    "placement-portal",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}
func ParseToken(tokenStr string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")
	claims := &Claims{}
	if secret == "" {
        return nil, errors.New("JWT_SECRET is empty")
    }
	token , err := jwt.ParseWithClaims(tokenStr , claims, func(t*jwt.Token) (interface{},error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Unexpected signing Method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		// return nil, errors.New("Er1")
		return nil, err;
	}
	if !token.Valid {
		return nil, errors.New("Expired Token")
	}
	return claims, nil
}
