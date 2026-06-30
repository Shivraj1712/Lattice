package repository

import (
	"context"
	"errors"
	"log/slog"
	"mime/multipart"

	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/pkg/media"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByID(ctx context.Context, user_id uuid.UUID) (*domain.User, error)
	DeleteUser(ctx context.Context, user_id uuid.UUID) error
	UpdateUserProfileImage(ctx context.Context, file *multipart.FileHeader, user_id uuid.UUID, folder string) error
	UpdateUserDetails(ctx context.Context, name string, password string, user_id uuid.UUID) error
}

type UserRepoHandler struct{}

func (r *UserRepoHandler) CreateUser(ctx context.Context, user *domain.User) error {
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Create(&user).Error
	if err != nil {
		slog.Error("Failed to create a new user", "error", err)
		return err
	}
	return nil
}

func (r *UserRepoHandler) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			slog.Error("No such user found", "error", gorm.ErrRecordNotFound)
			return nil, gorm.ErrRecordNotFound
		} else {
			slog.Error("Internal server error", "error", err)
			return nil, errors.New("Internal server err")
		}
	}
	return &user, err
}

func (r *UserRepoHandler) GetUserByID(ctx context.Context, user_id uuid.UUID) (*domain.User, error) {
	var user domain.User
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user_id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			slog.Error("No such user found", "error", gorm.ErrRecordNotFound)
			return nil, gorm.ErrRecordNotFound
		} else {
			slog.Error("Internal server error", "error", err)
			return nil, errors.New("Internal server error")
		}
	}
	return &user, nil
}

func (r *UserRepoHandler) DeleteUser(ctx context.Context, user_id uuid.UUID) error {
	var user domain.User
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user_id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			slog.Error("No user found", "error", err)
			return gorm.ErrRecordNotFound
		} else {
			slog.Error("Failed to fetch details from database", "error", err)
			return errors.New("Internal Server Error")
		}
	}
	if user.AvatarPublicID != nil {
		err = media.DeleteImage(ctx, *user.AvatarPublicID)
		if err != nil {
			return errors.New("Internal Server Error")
		}
	}
	err = database.DB.WithContext(ctx).Model(&domain.User{}).Delete(&user).Error
	if err != nil {
		slog.Error("Failed to delete the user from database", "error", err)
		return errors.New("Internal Server Error")
	}
	return nil
}

func (r *UserRepoHandler) UpdateUserProfileImage(ctx context.Context, file *multipart.FileHeader, user_id uuid.UUID, folder string) error {
	var user domain.User
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user_id).First(&user).Error
	if err != nil {
		slog.Error("User not found", "error", err)
		return gorm.ErrRecordNotFound
	}
	if user.AvatarPublicID == nil {
		url, publicID, err := media.UploadImage(ctx, file, folder)
		if err != nil {
			return errors.New("Internal Server Error")
		}
		user.AvatarUrl = url
		user.AvatarPublicID = &publicID
		err = database.DB.WithContext(ctx).Model(&domain.User{}).Save(&user).Error
		if err != nil {
			slog.Error("Failed to update the user profile", "error", err)
			return errors.New("Internal Server Error")
		}
	} else {
		url, publicID, err := media.UpdateMedia(ctx, *user.AvatarPublicID, file, folder)
		if err != nil {
			return errors.New("Internal Server Error")
		}
		user.AvatarUrl = url
		user.AvatarPublicID = &publicID
		err = database.DB.WithContext(ctx).Model(&domain.User{}).Save(&user).Error
		if err != nil {
			slog.Error("Failed to update the user profile", "error", err)
			return errors.New("Internal Server Error")
		}
	}
	return nil
}

func (r *UserRepoHandler) UpdateUserDetails(ctx context.Context, name string, password string, user_id uuid.UUID) error {
	var user domain.User
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user_id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			slog.Error("User not found", "error", err)
			return gorm.ErrRecordNotFound
		} else {
			slog.Error("Internal Server Error", "error", err)
			return errors.New("Internal Server Error")
		}
	}
	user.UserName = name
	user.HashPassword = &password
	err = database.DB.WithContext(ctx).Model(&domain.User{}).Save(&user).Error
	if err != nil {
		slog.Error("Failed to update the user profile", "error", err)
		return errors.New("Intenral Server Error")
	}
	return nil
}
