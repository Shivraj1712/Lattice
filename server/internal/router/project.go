package router

import (
	"github.com/Shivraj1712/Lattice.git/internal/handler"
	"github.com/Shivraj1712/Lattice.git/internal/middleware"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/internal/service"
	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/gofiber/fiber/v2"
)

func ProjectRoutes(app *fiber.App) {
	tokenHandler := utils.TokenHandler{}
	repo := &repository.ProjectRepoHandler{}
	userRepo := &repository.UserRepoHandler{}
	service := &service.ProjectServiceHandler{
		Repo:     repo,
		UserRepo: userRepo,
	}
	projectHandler := &handler.ProjectHandler{
		Service: service,
	}
	app.Get("/api/v1/projects/all", projectHandler.AllProjects)
	app.Post("/api/v1/projects/email", projectHandler.GetAUserProjects)
	app.Get("/api/v1/projects/search", middleware.Authenticate(&tokenHandler), projectHandler.SearchAndFilter)
	app.Get("/api/v1/projects", middleware.Authenticate(&tokenHandler), projectHandler.AuthUserProjects)
	app.Put("/api/v1/projects/:id", middleware.Authenticate(&tokenHandler), projectHandler.Update)
	app.Put("/api/v1/projects/image/:id", middleware.Authenticate(&tokenHandler), projectHandler.UpdateImage)
	app.Delete("/api/v1/projects/:id", middleware.Authenticate(&tokenHandler), projectHandler.Delete)
	app.Post("/api/v1/projects", middleware.Authenticate(&tokenHandler), projectHandler.Create)
}
