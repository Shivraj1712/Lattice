package middleware

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/gin-gonic/gin"
)

func Authenticate(TokenHandler *utils.TokenHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, err := c.Cookie("token")
		if err != nil {
			slog.Warn("Not Authorized, No Token", "error", errors.New("Unauthorized"))
			response.FailureResponse(c, "Not Authorized, No Token", http.StatusUnauthorized)
			c.Abort()
			return
		}
		user_id, err := TokenHandler.VerifyToken(c.Request.Context(), value)
		if err != nil {
			slog.Error("Failed to parse the token Value", "error", errors.New("Internal Server Error"))
			response.FailureResponse(c, "Internal Server Error", http.StatusInternalServerError)
			c.Abort()
			return
		}
		c.Set("user_id", user_id)
		c.Next()
	}
}
