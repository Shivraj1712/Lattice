package middleware

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/gofiber/fiber/v2"
)

func Authenticate(TokenHandler *utils.TokenHandler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		value := c.Cookies("token")
		if value == "" {
			slog.Warn("Not Authorized, No Token", "error", errors.New("Unauthorized"))
			return response.FailureResponse(c, "Not Authorized, No Token", http.StatusUnauthorized)
		}
		user_id, err := TokenHandler.VerifyToken(c.UserContext(), value)
		if err != nil {
			slog.Error("Failed to parse the token Value", "error", errors.New("Internal Server Error"))
			return response.FailureResponse(c, "Internal Server Error", http.StatusInternalServerError)
		}
		c.Locals("user_id", user_id)
		return c.Next()
	}
}
