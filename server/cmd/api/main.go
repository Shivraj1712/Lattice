package main

import (
	"log/slog"
	"strings"

	_ "github.com/Shivraj1712/Lattice.git/docs"
	"github.com/Shivraj1712/Lattice.git/internal/cache"
	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/handler"
	"github.com/Shivraj1712/Lattice.git/internal/middleware"
	"github.com/Shivraj1712/Lattice.git/internal/router"
	"github.com/Shivraj1712/Lattice.git/pkg/media"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/swagger"
)

// @title 			Lattice API
// @version			1.0
// @description 	API for the responding to the Client Side section of the Client Server Architecture
// @host			lattice-xd9g.onrender.com
// @BasePath		/
func main() {
	config.FetchConfig()
	database.ConnectDB()
	database.MigrateModels()
	_ = cache.ConnectRedis()
	if err := media.ConnectCloudinary(); err != nil {
		slog.Error("Failed to connect to Cloudinary", "error", err)
		panic(err)
	}
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})
	app.Get("/swagger/*", swagger.HandlerDefault)
	allowedOrigins := []string{}
	for _, origin := range strings.Split(config.Configuration.FrontendUrl, ",") {
		trimmedOrigin := strings.TrimSpace(origin)
		if trimmedOrigin != "" {
			allowedOrigins = append(allowedOrigins, trimmedOrigin)
		}
	}
	allowedOrigins = append(allowedOrigins, "http://localhost:3000", "http://127.0.0.1:3000")
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(allowedOrigins, ","),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))
	app.Use(middleware.RateLimiter())
	handler.OauthInit()
	router.ProjectRoutes(app)
	router.UserRoutes(app)
	if err := app.Listen(":8080"); err != nil {
		slog.Error("Server listen failed", "error", err)
	}
}
