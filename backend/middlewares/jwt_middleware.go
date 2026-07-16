package middlewares

import (
	"fmt"
	"net/http"
	"strings"

	"backend/utils"

	"github.com/gin-gonic/gin"
)
func Auth(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := utils.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		fmt.Printf("Rec tok: %s len: %d\n", tokenStr, len(tokenStr))

		if len(allowedRoles) > 0 {
			allowed := false
			for _, r := range allowedRoles {
				if r == claims.Role {
					allowed = true
					break
				}
			}
			if !allowed {
				fmt.Println("JWT Role:", claims.Role)
				fmt.Println("Allowed Roles:", allowedRoles)
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied"})
				return
			}
		}
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
