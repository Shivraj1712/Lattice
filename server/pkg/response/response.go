package response

import (
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
}

func SuccessResponse(ctx *gin.Context, message string, data any, statusCode int) {
	ctx.JSON(statusCode, &APIResponse{
		Message: message,
		Success: true,
		Data:    data,
	})
}

func FailureResponse(ctx *gin.Context, message string, statusCode int) {
	ctx.JSON(statusCode, &APIResponse{
		Message: message,
		Success: false,
		Data:    nil,
	})
}
