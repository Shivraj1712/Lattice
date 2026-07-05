package service

import (
	"context"
	"log/slog"
	"mime/multipart"

	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/pkg/media"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ProjectService interface {
	CreateService(ctx context.Context, title string, description string, category string, liveLink string, githubLink string, file *multipart.FileHeader, userID uuid.UUID) error
	ImageUpdateService(ctx context.Context, file *multipart.FileHeader, project_id uuid.UUID, userID uuid.UUID) error
	UpdateService(ctx context.Context, title string, description string, category string, liveLink string, githubLink string, project_ID uuid.UUID, userID uuid.UUID) error
	DeleteService(ctx context.Context, project_ID uuid.UUID, user_ID uuid.UUID) error
	AllProjectsService(ctx context.Context) ([]domain.Project, error)
	UserProjectsByIDService(ctx context.Context, user_ID uuid.UUID) ([]domain.Project, error)
	UserProjectsByEmailService(ctx context.Context, email string) ([]domain.Project, error)
	SearchAndFilterService(ctx context.Context, searchTerm string, category string) ([]domain.Project, error)
}

type ProjectServiceHandler struct {
	Repo     repository.ProjectRepository
	UserRepo repository.UserRepository
}

func (r *ProjectServiceHandler) CreateService(ctx context.Context, title string, description string, category string, liveLink string, githubLink string, file *multipart.FileHeader, userID uuid.UUID) error {
	var project = &domain.Project{
		UserID:             userID,
		Title:              title,
		ProjectDescription: description,
		Category:           category,
		LiveDemoLink:       liveLink,
		GithubLink:         githubLink,
	}
	url, publicID, err := media.UploadImage(ctx, file, "Lattice/projects")
	if err != nil {
		slog.Error("Failed to create project", "error", fiber.ErrInternalServerError)
		return fiber.ErrInternalServerError
	}
	project.ProjectImageUrl = url
	project.ProjectImagePublicID = publicID
	err = r.Repo.CreateProject(ctx, *project)
	if err != nil {
		media.DeleteImage(ctx, publicID)
		return err
	}
	return nil
}
func (r *ProjectServiceHandler) ImageUpdateService(ctx context.Context, file *multipart.FileHeader, project_id uuid.UUID, user_ID uuid.UUID) error {
	err := r.Repo.UpdateProjectImage(ctx, file, project_id, user_ID)
	return err
}
func (r *ProjectServiceHandler) UpdateService(ctx context.Context, title string, description string, category string, liveLink string, githubLink string, project_ID uuid.UUID, user_ID uuid.UUID) error {
	var project = &domain.Project{
		Title:              title,
		ProjectDescription: description,
		LiveDemoLink:       liveLink,
		GithubLink:         githubLink,
		Category:           category,
	}
	err := r.Repo.UpdateProject(ctx, *project, project_ID, user_ID)
	return err
}
func (r *ProjectServiceHandler) DeleteService(ctx context.Context, project_ID uuid.UUID, user_ID uuid.UUID) error {
	err := r.Repo.DeleteProject(ctx, project_ID, user_ID)
	return err
}
func (r *ProjectServiceHandler) AllProjectsService(ctx context.Context) ([]domain.Project, error) {
	projects, err := r.Repo.GetAllProject(ctx)
	if err != nil {
		return nil, err
	}
	return projects, nil
}
func (r *ProjectServiceHandler) UserProjectsByIDService(ctx context.Context, user_ID uuid.UUID) ([]domain.Project, error) {
	projects, err := r.Repo.GetUserProjectByID(ctx, user_ID)
	if err != nil {
		return nil, err
	}
	return projects, nil
}
func (r *ProjectServiceHandler) SearchAndFilterService(ctx context.Context, searchTerm string, category string) ([]domain.Project, error) {
	projects, err := r.Repo.SearchAndFilter(ctx, searchTerm, category)
	if err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *ProjectServiceHandler) UserProjectsByEmailService(ctx context.Context, email string) ([]domain.Project, error) {
	user, err := r.UserRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	projects, err := r.Repo.GetUserProjectByID(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	return projects, nil
}
