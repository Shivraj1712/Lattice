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

// @Summary			Create Project
// @Description 	This function is used for the authenticated user to create a new project with an image
// @Tags 			Project
// @Accept			multipart/form-data
// @Produce 		json
// @Param			title formData string true "Project title"
// @Param			description formData string true "Project description"
// @Param			category formData string false "Project category"
// @Param			github_link formData string true "GitHub repository link"
// @Param			live_demo_link formData string true "Live demo link"
// @Param			image formData file true "Project image"
// @Router			/api/v1/projects [post]
// @Success			201 {object} map[string]string
// @Failure 		400 {object} map[string]string
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

// @Summary			Update Project Image
// @Description 	This function is used for the authenticated user to update the image of their own project
// @Tags 			Project
// @Accept			multipart/form-data
// @Produce 		json
// @Param			id path string true "Project ID"
// @Param			image formData file true "New project image"
// @Router			/api/v1/projects/image/{id} [put]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
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

// @Summary			Update Project Details
// @Description 	This function is used for the authenticated user to update the details of their own project
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Param			id path string true "Project ID"
// @Router			/api/v1/projects/{id} [put]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
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

// @Summary			Delete Project
// @Description 	This function is used for the authenticated user to delete their own project
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Param			id path string true "Project ID"
// @Router			/api/v1/projects/{id} [delete]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
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

// @Summary			Get All Projects
// @Description 	This function is used for getting all the projects, no login required
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Router			/api/v1/projects/all [get]
// @Success			200 {object} map[string]string
func (r *ProjectHandler) AllProjects(c *fiber.Ctx) error {
	data, err := r.Service.AllProjectsService(c.UserContext())
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}

// @Summary			Get My Projects
// @Description 	This function is used for the authenticated user to get all of their own projects
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Router			/api/v1/projects [get]
// @Success			200 {object} map[string]string
// @Failure 		401 {object} map[string]string
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

// @Summary			Get Projects By Email
// @Description 	This function is used for getting all the projects of a user by their email, no login required
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Router			/api/v1/projects/email [post]
// @Success			200 {object} map[string]string
// @Failure 		404 {object} map[string]string
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

// @Summary			Search And Filter Projects
// @Description 	This function is used for searching and filtering projects by title, description, or category
// @Tags 			Project
// @Accept			json
// @Produce 		json
// @Param			search query string false "Search term"
// @Param			category query string false "Category filter"
// @Router			/api/v1/projects/search [get]
// @Success			200 {object} map[string]string
func (r *ProjectHandler) SearchAndFilter(c *fiber.Ctx) error {
	searchTerm := c.Query("search")
	category := c.Query("category")
	data, err := r.Service.SearchAndFilterService(c.UserContext(), searchTerm, category)
	if err != nil {
		return response.FailureResponse(c, "Internal Server Error", fiber.StatusInternalServerError)
	}
	return response.SuccessResponse(c, "", data, fiber.StatusOK)
}
