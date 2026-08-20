package middlewares

import (
	"net/http"
	"strings"
	"log"
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
            // Log which error it is — helps debug intermittent issues
            log.Printf("AUTH FAILED: %v | token_len=%d", err, len(tokenStr))
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "invalid or expired token: " + err.Error(),
            })
            return
        }

		if len(allowedRoles) > 0 {
			allowed := false
			for _, r := range allowedRoles {
				if r == claims.Role {
					allowed = true
					break
				}
			}
			if !allowed {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied"})
				return
			}
		}
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
