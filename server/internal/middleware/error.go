package middleware

import (
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/gofiber/fiber/v2"
)

type AppError struct {
	code    int
	message string
}

func ErrorHandler(ctx *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"
	if newErr, ok := err.(*fiber.Error); ok {
		code = newErr.Code
		message = newErr.Message
	}
	return response.FailureResponse(ctx, message, code)
}
