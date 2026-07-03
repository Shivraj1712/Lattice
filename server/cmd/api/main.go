package main

import (
	_ "github.com/Shivraj1712/Lattice.git/docs"
	"github.com/Shivraj1712/Lattice.git/internal/cache"
	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/handler"
	"github.com/Shivraj1712/Lattice.git/internal/middleware"
	"github.com/Shivraj1712/Lattice.git/internal/router"
	"github.com/gofiber/fiber/v2"
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
	handler.OauthInit()
	router.UserRoutes(app)
	app.Get("/swagger/*", swagger.HandlerDefault)
	app.Listen(":8080")
}
