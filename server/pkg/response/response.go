package response

import (
	"github.com/gofiber/fiber/v2"
)

type APIResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
}

func SuccessResponse(ctx *fiber.Ctx, message string, data any, statusCode int) error {
	return ctx.Status(statusCode).JSON(&APIResponse{
		Message: message,
		Success: true,
		Data:    data,
	})
}

func FailureResponse(ctx *fiber.Ctx, message string, statusCode int) error {
	return ctx.Status(statusCode).JSON(&APIResponse{
		Message: message,
		Success: false,
		Data:    nil,
	})
}
