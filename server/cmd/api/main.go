package main

import (
	"log/slog"

	_ "github.com/Shivraj1712/Lattice.git/docs"
	"github.com/Shivraj1712/Lattice.git/internal/cache"
	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/handler"
	"github.com/Shivraj1712/Lattice.git/internal/middleware"
	"github.com/Shivraj1712/Lattice.git/internal/router"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/swagger"
)

// @title 			Lattice API
// @version			1.0
// @description 	API for the responding to the Client Side section of the Client Server Architecture
// @host			localhost:8080
// @BasePath		/
func main() {
	config.FetchConfig()
	database.ConnectDB()
	database.MigrateModels()
	_ = cache.ConnectRedis()
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))
	app.Use(middleware.RateLimiter())
	handler.OauthInit()
	router.ProjectRoutes(app)
	router.UserRoutes(app)
	app.Get("/swagger/*", swagger.HandlerDefault)
	if err := app.Listen(":8080"); err != nil {
		slog.Error("Server listen failed", "error", err)
	}
}
