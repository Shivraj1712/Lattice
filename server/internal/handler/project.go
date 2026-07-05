package handler

import (
	"errors"
	"log/slog"

	"github.com/Shivraj1712/Lattice.git/internal/service"
	"github.com/Shivraj1712/Lattice.git/pkg/response"
	"github.com/Shivraj1712/Lattice.git/pkg/validator"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectInterface interface {
	Create(c *fiber.Ctx) error
	UpdateImage(c *fiber.Ctx) error
	Update(c *fiber.Ctx) error
	Delete(c *fiber.Ctx) error
	AllProjects(c *fiber.Ctx) error
	AuthUserProjects(c *fiber.Ctx) error
	GetAUserProjects(c *fiber.Ctx) error
	SearchAndFilter(c *fiber.Ctx) error
}

type ProjectHandler struct {
	Service service.ProjectService
}

func (r *ProjectHandler) Create(c *fiber.Ctx) error {
	var request validator.CreateProjectStruct
	file, err := c.FormFile("image")
	if err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter all required inputs", fiber.StatusBadRequest)
	}
	if err := c.BodyParser(&request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter all required inputs", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter valid inputs", fiber.StatusBadRequest)
	}
	value := c.Locals("user_id")
	user_id, exists := value.(uuid.UUID)
	if !exists {
		slog.Error("Not authorized", "error", fiber.ErrUnauthorized)
		return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
	}
	err = r.Service.CreateService(c.UserContext(), request.Title, request.Description, request.Category, request.LiveDemo, request.GithubLink, file, user_id)
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "Project Created", nil, fiber.StatusCreated)
}
func (r *ProjectHandler) UpdateImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		slog.Error("Invalid request", "error", err)
		return response.FailureResponse(c, "Invalid Request", fiber.StatusBadRequest)
	}
	id := c.Params("id")
	if id == "" {
		slog.Error("Invalid request")
		return response.FailureResponse(c, "Invalid Request", fiber.StatusBadRequest)
	}
	project_id, err := uuid.Parse(id)
	if err != nil {
		slog.Error("Failed to parse the project id from the url", "error", err)
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	value := c.Locals("user_id")
	user_id, exists := value.(uuid.UUID)
	if !exists {
		slog.Error("Not authorized", "error", fiber.ErrUnauthorized)
		return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
	}
	err = r.Service.ImageUpdateService(c.UserContext(), file, project_id, user_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(c, "No such project", fiber.StatusNotFound)
		} else if errors.Is(err, fiber.ErrUnauthorized) {
			return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
		} else {
			return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	return response.SuccessResponse(c, "Image Updated", nil, fiber.StatusOK)
}
func (r *ProjectHandler) Update(c *fiber.Ctx) error {
	var request validator.UpdateProjectStruct
	if err := c.BodyParser(&request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter all required inputs", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter valid inputs", fiber.StatusBadRequest)
	}
	id := c.Params("id")
	if id == "" {
		slog.Error("Invalid request")
		return response.FailureResponse(c, "Invalid Request", fiber.StatusBadRequest)
	}
	project_id, err := uuid.Parse(id)
	if err != nil {
		slog.Error("Failed to parse the project id from the url", "error", err)
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}

	value := c.Locals("user_id")
	user_id, exists := value.(uuid.UUID)
	if !exists {
		slog.Error("Not authorized", "error", fiber.ErrUnauthorized)
		return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
	}
	err = r.Service.UpdateService(c.UserContext(), request.Title, request.Description, request.Category, request.LiveDemo, request.GithubLink, project_id, user_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(c, "No such project", fiber.StatusNotFound)
		} else if errors.Is(err, fiber.ErrUnauthorized) {
			return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
		} else {
			return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	return response.SuccessResponse(c, "Project Details Updated", nil, fiber.StatusOK)
}
func (r *ProjectHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		slog.Error("Invalid request")
		return response.FailureResponse(c, "Invalid Request", fiber.StatusBadRequest)
	}
	project_id, err := uuid.Parse(id)
	if err != nil {
		slog.Error("Failed to parse the project id from the url", "error", err)
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}

	value := c.Locals("user_id")
	user_id, exists := value.(uuid.UUID)
	if !exists {
		slog.Error("Not authorized", "error", fiber.ErrUnauthorized)
		return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
	}
	err = r.Service.DeleteService(c.UserContext(), project_id, user_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(c, "No such project", fiber.StatusNotFound)
		} else if errors.Is(err, fiber.ErrUnauthorized) {
			return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
		} else {
			return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
		}
	}
	return response.SuccessResponse(c, "Project Deleted", nil, fiber.StatusOK)
}
func (r *ProjectHandler) AllProjects(c *fiber.Ctx) error {
	data, err := r.Service.AllProjectsService(c.UserContext())
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}
func (r *ProjectHandler) AuthUserProjects(c *fiber.Ctx) error {
	value := c.Locals("user_id")
	user_id, exists := value.(uuid.UUID)
	if !exists {
		slog.Error("Not authorized", "error", fiber.ErrUnauthorized)
		return response.FailureResponse(c, "Unauthorised", fiber.StatusUnauthorized)
	}
	data, err := r.Service.UserProjectsByIDService(c.UserContext(), user_id)
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}

func (r *ProjectHandler) GetAUserProjects(c *fiber.Ctx) error {
	var request validator.EmailStruct
	if err := c.BodyParser(&request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter all required inputs", fiber.StatusBadRequest)
	}
	if err := validator.Validate(request); err != nil {
		slog.Error("Invalid Request : Doesn't contain all the required values", "error", err)
		return response.FailureResponse(c, "Enter valid inputs", fiber.StatusBadRequest)
	}
	data, err := r.Service.UserProjectsByEmailService(c.UserContext(), request.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.FailureResponse(c, "No such user", fiber.StatusNotFound)
		}
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}

func (r *ProjectHandler) SearchAndFilter(c *fiber.Ctx) error {
	searchTerm := c.Query("search")
	category := c.Query("category")
	data, err := r.Service.SearchAndFilterService(c.UserContext(), searchTerm, category)
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}
