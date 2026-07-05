package repository

import (
	"context"
	"errors"
	"log/slog"
	"mime/multipart"
	"strings"

	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/pkg/media"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectRepository interface {
	CreateProject(ctx context.Context, project domain.Project) error
	UpdateProject(ctx context.Context, details domain.Project, project_ID uuid.UUID, user_ID uuid.UUID) error
	UpdateProjectImage(ctx context.Context, file *multipart.FileHeader, project_ID uuid.UUID, user_ID uuid.UUID) error
	DeleteProject(ctx context.Context, project_ID uuid.UUID, user_ID uuid.UUID) error
	GetAllProject(ctx context.Context) ([]domain.Project, error)
	GetUserProjectByID(ctx context.Context, user_ID uuid.UUID) ([]domain.Project, error)
	SearchAndFilter(ctx context.Context, search string, category string) ([]domain.Project, error)
}

type ProjectRepoHandler struct{}

func (r *ProjectRepoHandler) CreateProject(ctx context.Context, project domain.Project) error {
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Create(&project).Error
	if err != nil {
		slog.Error("Failed to create a new project", "error", fiber.ErrInternalServerError)
		return fiber.ErrInternalServerError
	}
	return nil
}

func (r *ProjectRepoHandler) UpdateProject(ctx context.Context, details domain.Project, project_ID uuid.UUID, user_ID uuid.UUID) error {
	var projectExists domain.Project
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Where("id = ?", project_ID).First(&projectExists).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			slog.Error("No such Project", "error", gorm.ErrRecordNotFound)
			return gorm.ErrRecordNotFound
		} else {
			slog.Error("Internal Server Error", "error", fiber.ErrInternalServerError)
			return fiber.ErrInternalServerError
		}
	}
	if projectExists.UserID != user_ID {
		return fiber.ErrUnauthorized
	}
	if details.Title != "" {
		projectExists.Title = details.Title
	}
	if details.Category != "" {
		projectExists.Category = details.Category
	}
	if details.ProjectDescription != "" {
		projectExists.ProjectDescription = details.ProjectDescription
	}
	if details.LiveDemoLink != "" {
		projectExists.LiveDemoLink = details.LiveDemoLink
	}
	if details.GithubLink != "" {
		projectExists.GithubLink = details.GithubLink
	}

	err = database.DB.WithContext(ctx).Save(&projectExists).Error
	if err != nil {
		slog.Error("Failed to update project in database", "error", err)
		return fiber.ErrInternalServerError
	}
	return nil
}

func (r *ProjectRepoHandler) UpdateProjectImage(ctx context.Context, file *multipart.FileHeader, project_ID uuid.UUID, user_ID uuid.UUID) error {
	var project domain.Project
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Where("id = ?", project_ID).First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		} else {
			return fiber.ErrInternalServerError
		}
	}
	if project.UserID != user_ID {
		return fiber.ErrUnauthorized
	}
	url, publicID, err := media.UpdateMedia(ctx, project.ProjectImagePublicID, file, "Lattice/projects")
	if err != nil {
		return fiber.ErrInternalServerError
	}
	project.ProjectImageUrl = url
	project.ProjectImagePublicID = publicID
	err = database.DB.WithContext(ctx).Model(&domain.Project{}).Save(&project).Error
	if err != nil {
		return fiber.ErrInternalServerError
	}
	return nil
}

func (r *ProjectRepoHandler) DeleteProject(ctx context.Context, project_ID uuid.UUID, user_ID uuid.UUID) error {
	var project domain.Project
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Where("id = ?", project_ID).First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		} else {
			return fiber.ErrInternalServerError
		}
	}
	if project.UserID != user_ID {
		return fiber.ErrUnauthorized
	}
	err = database.DB.WithContext(ctx).Model(&domain.Project{}).Delete(&project).Error
	if err != nil {
		return fiber.ErrInternalServerError
	}
	return nil
}

func (r *ProjectRepoHandler) GetAllProject(ctx context.Context) ([]domain.Project, error) {
	var projects []domain.Project
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Find(&projects).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return make([]domain.Project, 0), nil
		} else {
			return nil, fiber.ErrInternalServerError
		}
	}
	return projects, nil
}

func (r *ProjectRepoHandler) GetUserProjectByID(ctx context.Context, user_ID uuid.UUID) ([]domain.Project, error) {
	var projects []domain.Project
	err := database.DB.WithContext(ctx).Model(&domain.Project{}).Where("user_id = ?", user_ID).Find(&projects).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return make([]domain.Project, 0), nil
		} else {
			return nil, fiber.ErrInternalServerError
		}
	}
	return projects, nil
}

func (r *ProjectRepoHandler) SearchAndFilter(ctx context.Context, searchTerm string, category string) ([]domain.Project, error) {
	var projects []domain.Project
	query := database.DB.WithContext(ctx).Model(&domain.Project{})
	if searchTerm != "" {
		searchTerm = strings.TrimSpace(searchTerm)
		query = query.Where("title ILike ? OR project_description ILike ?", "%"+searchTerm+"%", "%"+searchTerm+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	err := query.Find(&projects).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return make([]domain.Project, 0), nil
		} else {
			return nil, fiber.ErrInternalServerError
		}
	}
	return projects, nil
}
