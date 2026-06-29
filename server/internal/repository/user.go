package repository

import (
	"context"
	"errors"
	"log/slog"

	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByID(ctx context.Context, user_id uuid.UUID) (*domain.User, error)
	UpdateUserDetails(ctx context.Context, userDetails *domain.User, user_id uuid.UUID) error
	DeleteUser(ctx context.Context, user_id uuid.UUID) error
}

type UserRepoHandler struct{}

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

func (r *UserRepoHandler) CreateUser(ctx context.Context, user *domain.User) error {
	err := database.DB.WithContext(ctx).Model(&domain.User{}).Create(&user).Error
	if err != nil {
		slog.Error("Failed to create a new user", "error", err)
		return err
	}
	return nil
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

// func (r *UserRepoHandler) UpdateUserDetails(ctx context.Context, userDetails *domain.User, user_id uuid.UUID) error {
// 	var user domain.User
// 	err := database.DB.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user_id).First(&user).Error
// 	if err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			slog.Error("No such user found", "error", gorm.ErrRecordNotFound)
// 			return gorm.ErrRecordNotFound
// 		} else {
// 			slog.Error("Internal server error", "error", err)
// 			return errors.New("Internal server error")
// 		}
// 	}

// }
