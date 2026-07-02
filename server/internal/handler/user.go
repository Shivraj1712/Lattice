package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/internal/service"
	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/Shivraj1712/Lattice.git/pkg/validator"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"gorm.io/gorm"
)

type UserInterface interface {
	BeginOauth() gin.HandlerFunc
	CompleteOauth() gin.HandlerFunc
	Login() gin.HandlerFunc
	SignUp() gin.HandlerFunc
	Logout() gin.HandlerFunc
	GetUserProfile() gin.HandlerFunc
	GetPublicProfile() gin.HandlerFunc
	UpdateUserImage() gin.HandlerFunc
	UpdateUserDetails() gin.HandlerFunc
}

type UserHandler struct {
	service service.UserServiceInterface
	repo    repository.UserRepository
	token   utils.TokenInterface
}

// @Summary			Google Oauth function initialization
// @Description		This function call initialises the feature for google based authentication using Goth
// @Tags			Authentication
// @Accpet			json
// @Produce			json
// @Router			/ [get]
// @Success			200 {object} map[string]string
// @Failure			500 {object} map[string]string
func OauthInit(c *gin.Context) {
	goth.UseProviders(
		google.New(
			config.Configuration.GoogleClientId,
			config.Configuration.GoogleClientSecret,
			config.Configuration.GoogleCallbackUrl,
			"email",
			"profile",
		),
	)
}

// @Summary			Begin google authentication
// @Description 	This function is used to call when a user wants to start the authentication using Google auth
// @Tags			Authentication
// @Accept 			json
// @Produce			json
// @Router			/api/v1/auth/google [get]
// @Success			200 {object} map[string]string
// @Failure 		500 {object} map[string]string
func (r *UserHandler) BeginOauth() gin.HandlerFunc {
	return func(c *gin.Context) {
		gothic.BeginAuthHandler(c.Writer, c.Request)
	}
}

// @Summary			Begin google authentication
// @Description 	This function is used to call when a user wants to complete process of authentication using Google auth
// @Tags			Authentication
// @Accept 			json
// @Produce			json
// @Router			/api/v1/auth/google/callback [get]
// @Success			200 {object} map[string]string
// @Failure 		500 {object} map[string]string
func (r *UserHandler) CompleteOauth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		userDetails, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
		if err != nil {
			slog.Error("Google Oauth Completion Failed", "error", err)
			response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		user, err := r.repo.GetUserByEmail(ctx.Request.Context(), userDetails.Email)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				user.Email = userDetails.Email
				user.UserName = userDetails.Name
				user.AuthProvider = "google"
				user.AuthProviderID = &userDetails.UserID
				user.AvatarUrl = userDetails.AvatarURL
				er := r.repo.CreateUser(ctx.Request.Context(), user)
				if er != nil {
					slog.Error("Failed to create a new user", "error", er)
					response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
					return
				}
			} else {
				response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
			}
		}
		sessionToken, err := r.token.GenerateToken(ctx.Request.Context(), user.ID)
		if err != nil {
			response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		ctx.SetCookie("token", sessionToken, 72*60*60, "/", "", false, true)
		response.SuccessResponse(ctx, "Google Login Successful!", nil, http.StatusOK)
	}
}

// @Summary			User Login
// @Description 	This function is used for the user to login with email and password
// @Tags 			Auth
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/login [post]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) Login() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request validator.LoginStruct
		if err := ctx.ShouldBindJSON(&request); err != nil {
			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
			return
		}
		if err := validator.Validate(request); err != nil {
			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
			return
		}
		sessionToken, err := r.service.LocalLogin(ctx.Request.Context(), request.Email, request.Password)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				response.FailureResponse(ctx, "User with this Email Do not exists", http.StatusBadRequest)
				return
			} else if err.Error() == "Internal Server Error" {
				response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
				return
			} else {
				response.FailureResponse(ctx, "Invalid Credentials", http.StatusBadRequest)
				return
			}
		}
		ctx.SetCookie("token", sessionToken, 72*60*60, "/", "", false, true)
		response.SuccessResponse(ctx, "User Login Successful", nil, http.StatusOK)
	}
}

// @Summary			User Signup
// @Description 	This function is used for the user to sign up using name, email and password
// @Tags 			Auth
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/signup [post]
// @Success			201 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) SignUp() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request validator.SignUpStruct
		if err := ctx.ShouldBindJSON(&request); err != nil {
			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
			return
		}
		if err := validator.Validate(request); err != nil {
			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
			return
		}
		sessionToken, err := r.service.LocalSignUp(ctx.Request.Context(), request.Name, request.Email, request.Password)
		if err != nil {
			if err.Error() == "User Already Exists with this email" {
				response.FailureResponse(ctx, "User Already Exists", http.StatusBadRequest)
				return
			} else {
				response.FailureResponse(ctx, "Internal Server Error", http.StatusInternalServerError)
				return
			}
		}
		ctx.SetCookie("token", sessionToken, 72*60*60, "/", "", false, true)
		response.SuccessResponse(ctx, "Sign Up Successful", nil, http.StatusCreated)
	}
}

// @Summary			Get current user profile
// @Description 	This function is used for the getting the profile details of the authenticated user
// @Tags 			User
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/profile [get]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) GetUserProfile() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var user *domain.User
		value, err := ctx.Get("user_id")
		if err || value == nil {
			slog.Warn("User ID not found in the server", "error", errors.New("Unauthorized"))
			response.FailureResponse(ctx, "Unauthorize", http.StatusUnauthorized)
			return
		}
		user_id := value.(uuid.UUID)
		user, er := r.service.GetUserProfile(ctx.Request.Context(), user_id)
		if er != nil {
			if er.Error() == "Internal Server Error" {
				response.FailureResponse(ctx, "Internal Server", http.StatusInternalServerError)
				return
			} else {
				response.FailureResponse(ctx, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}
		response.SuccessResponse(ctx, "", user, http.StatusOK)
	}
}

func (r *UserHandler) Logout() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		value, err := ctx.Cookie("token")
		if err != nil {
			slog.Error("No Token found", "error", errors.New("Unauthorized as no token found"))
			return
		}
		err = r.service.Logout(ctx.Request.Context(), value)
		if err != nil {
			response.FailureResponse(ctx, err.Error(), http.StatusInternalServerError)
			return
		}
		ctx.SetCookie("token", "", -1, "/", "", false, true)
		response.SuccessResponse(ctx, "User logout successful", nil, http.StatusOK)
	}
}

// func (r *UserHandler) GetPublicProfile() gin.HandlerFunc {
// 	return func(ctx *gin.Context) {
// 		var request validator.EmailStruct
// 		if err := ctx.ShouldBindJSON(&request); err != nil {
// 			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
// 			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
// 			return
// 		}
// 		if err := validator.Validate(request); err != nil {
// 			slog.Warn("Invalid request", "error", errors.New("Invalid request"))
// 			response.FailureResponse(ctx, "Invalid Request", http.StatusBadRequest)
// 			return
// 		}
// 		user, err := r.repo.GetUserByEmail(ctx.Request.Context(), request.Email)
// 		if err != nil {
// 			if err.Error() == "Internal Server Error" {
// 				response.FailureResponse(ctx, "Internal Server", http.StatusInternalServerError)
// 				return
// 			} else {
// 				response.FailureResponse(ctx, "No Such User found", http.StatusNotFound)
// 			}
// 		}
// 		var data any = map[string] string {
// 			"name" : user.UserName,
// 			"email" : user.Email,
// 			"avatar" : user.AvatarUrl,
// 			""
// 		}
// 	}
// }
