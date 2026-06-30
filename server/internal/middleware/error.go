package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AppError struct {
	code    int
	message string
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if len(c.Errors) > 0 {
			ginError := c.Errors.Last()
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": ginError.Error(),
				"success": false,
			})
			return
		}
	}
}
