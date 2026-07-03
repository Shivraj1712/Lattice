package middleware

import (
	"time"

	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func RateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:          100,
		Expiration:   1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string { return c.IP() },
		LimitReached: func(ctx *fiber.Ctx) error {
			return response.FailureResponse(ctx, "Too Many Requests", fiber.StatusTooManyRequests)
		},
	})
}
