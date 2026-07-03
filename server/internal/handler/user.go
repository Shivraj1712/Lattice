package handler

import (
	"errors"
	"log/slog"
	"time"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/internal/service"
	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/Shivraj1712/Lattice.git/pkg/validator"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/shareed2k/goth_fiber"
	"gorm.io/gorm"
)

type UserInterface interface {
	BeginOauth(ctx *fiber.Ctx) error
	CompleteOauth(ctx *fiber.Ctx) error
	Login(ctx *fiber.Ctx) error
	SignUp(ctx *fiber.Ctx) error
	Logout(ctx *fiber.Ctx) error
	GetUserProfile(ctx *fiber.Ctx) error
	GetPublicProfile(ctx *fiber.Ctx) error
	UpdateUserImage(ctx *fiber.Ctx) error
	UpdateUserDetails(ctx *fiber.Ctx) error
	DeleteUser(ctx *fiber.Ctx) error
}

type UserHandler struct {
	Service service.UserServiceInterface
	Repo    repository.UserRepository
	Token   utils.TokenInterface
}

func OauthInit() {
	googleProvider := google.New(
		config.Configuration.GoogleClientId,
		config.Configuration.GoogleClientSecret,
		config.Configuration.GoogleCallbackUrl,
		"email",
		"profile",
	)
	goth.UseProviders(googleProvider)
}

func (r *UserHandler) BeginOauth(ctx *fiber.Ctx) error {
	return goth_fiber.BeginAuthHandler(ctx)
}

func (r *UserHandler) CompleteOauth(ctx *fiber.Ctx) error {
	userDetails, err := goth_fiber.CompleteUserAuth(ctx)
	if err != nil {
		slog.Error("Google Authentication failed", "error", err)
		return response.FailureResponse(ctx, "Google Authentication Failed", fiber.StatusInternalServerError)
	}

	user, err := r.Repo.GetUserByEmail(ctx.UserContext(), userDetails.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			user = &domain.User{
				Email:          userDetails.Email,
				UserName:       userDetails.Name,
				AuthProvider:   "google",
				AuthProviderID: &userDetails.UserID,
				AvatarUrl:      userDetails.AvatarURL,
			}
			er := r.Repo.CreateUser(ctx.UserContext(), user)
			if er != nil {
				slog.Error("Failed to create a new user during Google Oauth", "error", er)
				return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
			}
		} else {
			return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	sessionToken, err := r.Token.GenerateToken(ctx.UserContext(), user.ID)
	if err != nil {
		return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    sessionToken,
		Expires:  time.Now().Add(72 * time.Hour),
		Path:     "/",
		Domain:   "",
		Secure:   false,
		HTTPOnly: true,
		SameSite: "Lax",
	})
	return response.SuccessResponse(ctx, "Google Login Successful!", nil, fiber.StatusOK)
}

// @Summary			User Login
// @Description 	This function is used for the user to login with email and password
// @Tags 			Authentication
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/login [post]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) Login(ctx *fiber.Ctx) error {
	var request validator.LoginStruct
	if err := ctx.BodyParser(&request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	sessionToken, err := r.Service.LocalLogin(ctx.UserContext(), request.Email, request.Password)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(ctx, "User with this Email Do not exists", fiber.StatusBadRequest)
		} else if err.Error() == "Internal Server Error" {
			return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
		} else {
			return response.FailureResponse(ctx, "Invalid Credentials", fiber.StatusBadRequest)
		}
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    sessionToken,
		Expires:  time.Now().Add(72 * time.Hour),
		Path:     "/",
		Domain:   "",
		Secure:   false,
		HTTPOnly: true,
	})
	return response.SuccessResponse(ctx, "User Login Successful", nil, fiber.StatusOK)
}

// @Summary			User Signup
// @Description 	This function is used for the user to sign up using name, email and password
// @Tags 			Authentication
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/signup [post]
// @Success			201 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) SignUp(ctx *fiber.Ctx) error {
	var request validator.SignUpStruct
	if err := ctx.BodyParser(&request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	sessionToken, err := r.Service.LocalSignUp(ctx.UserContext(), request.Name, request.Email, request.Password)
	if err != nil {
		if err.Error() == "User Already Exists with this email" {
			return response.FailureResponse(ctx, "User Already Exists", fiber.StatusBadRequest)
		} else {
			return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    sessionToken,
		Expires:  time.Now().Add(72 * time.Hour),
		Path:     "/",
		Domain:   "",
		Secure:   false,
		HTTPOnly: true,
	})
	return response.SuccessResponse(ctx, "Sign Up Successful", nil, fiber.StatusCreated)
}

// @Summary			Get current user profile
// @Description 	This function is used for the getting the profile details of the authenticated user
// @Tags 			User
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/profile [get]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) GetUserProfile(ctx *fiber.Ctx) error {
	var user *domain.User
	value := ctx.Locals("user_id")
	if value == nil {
		slog.Warn("User ID not found in the server", "error", errors.New("Unauthorized"))
		return response.FailureResponse(ctx, "Unauthorize", fiber.StatusUnauthorized)
	}
	user_id := value.(uuid.UUID)
	user, er := r.Service.GetUserProfile(ctx.UserContext(), user_id)
	if er != nil {
		if er.Error() == "Internal Server Error" {
			return response.FailureResponse(ctx, "Internal Server", fiber.StatusInternalServerError)
		} else {
			return response.FailureResponse(ctx, "Unauthorized", fiber.StatusUnauthorized)
		}
	}
	return response.SuccessResponse(ctx, "", user, fiber.StatusOK)
}

// @Summary			Logout User
// @Description 	This function is used logging out the user
// @Tags 			Authentication
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/logout [post]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
func (r *UserHandler) Logout(ctx *fiber.Ctx) error {
	value := ctx.Cookies("token")
	if value == "" {
		slog.Error("No Token found", "error", errors.New("Unauthorized as no token found"))
		return response.FailureResponse(ctx, "Unauthorised", fiber.StatusUnauthorized)
	}
	err := r.Service.Logout(ctx.UserContext(), value)
	if err != nil {
		return response.FailureResponse(ctx, err.Error(), fiber.StatusInternalServerError)
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-24 * time.Hour),
		Path:     "/",
		Domain:   "",
		Secure:   false,
		HTTPOnly: true,
	})
	return response.SuccessResponse(ctx, "User logout successful", nil, fiber.StatusOK)
}

// @Summary 			Update Profile Image
// @Description 		this function is used to allow authorized user to udpate his profile pic
// @Accept 				json
// @Produce				json
// @Tags				User
// @Router				/api/v1/auth/profile/pic [put]
// @Success				200 {object} map[string]string
// @Failure 			500 {object} map[string]string
func (r *UserHandler) UpdateUserImage(ctx *fiber.Ctx) error {
	request, err := ctx.FormFile("image")
	if err != nil {
		slog.Warn("Invalid Request", "error", errors.New("Invalid Request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	value := ctx.Locals("user_id")
	if value == nil {
		slog.Warn("User ID not found in the server", "error", errors.New("Unauthorized"))
		return response.FailureResponse(ctx, "Unauthorize", fiber.StatusUnauthorized)
	}
	user_id := value.(uuid.UUID)
	newERR := r.Service.UpdateAvatar(ctx.UserContext(), user_id, request)
	if newERR != nil {
		if errors.Is(newERR, gorm.ErrRecordNotFound) {
			return response.FailureResponse(ctx, "Unauthorized", fiber.StatusUnauthorized)
		} else {
			return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	return response.SuccessResponse(ctx, "User Avatar Updated", nil, fiber.StatusOK)
}

// @Summary 		Update User Details
// @Description		This functions allows the user to update the password and user name
// @Tags 			User
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/profile/update	[put]
// @Success 		200 {object} map[string]string
// @Failure			500 {object} map[string]string
func (r *UserHandler) UpdateUserDetails(ctx *fiber.Ctx) error {
	var request validator.UpdateDetailStruct
	if err := ctx.BodyParser(&request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	value := ctx.Locals("user_id")
	if value == nil {
		slog.Warn("User ID not found in the server", "error", errors.New("Unauthorized"))
		return response.FailureResponse(ctx, "Unauthorize", fiber.StatusUnauthorized)
	}
	user_id := value.(uuid.UUID)
	var password string
	if request.Password != nil {
		password = *request.Password
	} else {
		password = ""
	}
	err := r.Service.UpdateDetails(ctx.UserContext(), request.Name, password, user_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
		} else {
			return response.FailureResponse(ctx, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	return response.SuccessResponse(ctx, "Profile Updated Successfully", nil, fiber.StatusOK)
}

// @Summary			Get a user profile
// @Description 	This function is used for the getting the profile details about another user
// @Tags 			User
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/publicProfile [post]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
func (r *UserHandler) GetPublicProfile(ctx *fiber.Ctx) error {
	var request validator.EmailStruct
	if err := ctx.BodyParser(&request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Warn("Invalid request", "error", errors.New("Invalid request"))
		return response.FailureResponse(ctx, "Invalid Request", fiber.StatusBadRequest)
	}
	user, err := r.Service.GetPublicProfile(ctx.UserContext(), request.Email)
	if err != nil {
		if err.Error() == "Internal Server Error" {
			return response.FailureResponse(ctx, "Internal Server", fiber.StatusInternalServerError)
		} else {
			return response.FailureResponse(ctx, "No Such User found", fiber.StatusNotFound)
		}
	}
	var data any = map[string]string{
		"name":   user.UserName,
		"email":  user.Email,
		"avatar": user.AvatarUrl,
	}
	return response.SuccessResponse(ctx, "", data, fiber.StatusOK)
}

// @Summary			Delete User
// @Description 	This function is used for the allowing user to delete his account
// @Tags 			User
// @Accept			json
// @Produce 		json
// @Router			/api/v1/auth/profile [Delete]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
func (r *UserHandler) DeleteUser(ctx *fiber.Ctx) error {
	value := ctx.Locals("user_id")
	if value == nil {
		slog.Warn("Unauthorized", "error", errors.New("Unauthorized"))
		return response.FailureResponse(ctx, "Unauthorized", fiber.StatusUnauthorized)
	}
	user_id := value.(uuid.UUID)
	err := r.Service.RemoveUserAccount(ctx.UserContext(), user_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(ctx, "Can't Delete a non-existing account", fiber.StatusUnauthorized)
		} else {
			return response.FailureResponse(ctx, "Internal Server", fiber.StatusInternalServerError)
		}
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-24 * time.Hour),
		Path:     "/",
		Domain:   "",
		Secure:   false,
		HTTPOnly: true,
	})
	return response.SuccessResponse(ctx, "User Account Deleted", nil, fiber.StatusOK)
}
