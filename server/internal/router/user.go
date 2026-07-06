package router

import (
	"github.com/Shivraj1712/Lattice.git/internal/handler"
	"github.com/Shivraj1712/Lattice.git/internal/middleware"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/internal/service"
	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/gofiber/fiber/v2"
)

func UserRoutes(app *fiber.App) {
	password := &utils.PasswordHandler{}
	token := &utils.TokenHandler{}
	userRepo := &repository.UserRepoHandler{}
	userService := &service.UserServiceHandler{
		Password: password,
		Token:    token,
		Repo:     userRepo,
	}
	UserHandler := &handler.UserHandler{
		Service: userService,
		Repo:    userRepo,
		Token:   token,
	}

	router := app.Group("/api/v1/auth")
	router.Post("/signup", UserHandler.SignUp)
	router.Post("/login", UserHandler.Login)
	router.Post("/publicProfile", UserHandler.GetPublicProfile)
	router.Get("/profile", middleware.Authenticate(token), UserHandler.GetUserProfile)
	router.Put("/profile/update", middleware.Authenticate(token), UserHandler.UpdateUserDetails)
	router.Put("/profile/pic", middleware.Authenticate(token), UserHandler.UpdateUserImage)
	router.Post("/logout", middleware.Authenticate(token), UserHandler.Logout)
	router.Delete("/profile", middleware.Authenticate(token), UserHandler.DeleteUser)
	router.Get("/:provider", UserHandler.BeginOauth)
	router.Get("/:provider/callback", UserHandler.CompleteOauth)
}
