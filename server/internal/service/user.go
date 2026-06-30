package service

import (
	"context"
	"errors"
	"log/slog"
	"mime/multipart"

	"github.com/Shivraj1712/Lattice.git/internal/domain"
	"github.com/Shivraj1712/Lattice.git/internal/repository"
	"github.com/Shivraj1712/Lattice.git/internal/utils"
	"github.com/google/uuid"
)

type UserServiceInterface interface {
	LocalLogin(ctx context.Context, email string, password string) (string, error)
	LocalSignUp(ctx context.Context, name string, email string, password string) (string, error)
	Logout(ctx context.Context, sessionToken string) error
	GetUserProfile(ctx context.Context, user_ID uuid.UUID) (*domain.User, error)
	RemoveUserAccount(ctx context.Context, user_ID uuid.UUID) error
	UpdateAvatar(ctx context.Context, userid uuid.UUID, file *multipart.FileHeader) error
	UpdateDetails(ctx context.Context, name string, password string, userID uuid.UUID) error
	GetPublicProfile(ctx context.Context, email string) (*domain.User, error)
}

type UserServiceHandler struct {
	repo     repository.UserRepository
	token    utils.TokenInterface
	password utils.PasswordInterface
}

func (r *UserServiceHandler) LocalLogin(ctx context.Context, email string, password string) (string, error) {
	user, err := r.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", err
	}
	err = r.password.VerifyPassword(password, *user.HashPassword)
	if err != nil {
		return "", err
	}
	sessionToken, err := r.token.GenerateToken(ctx, user.ID)
	if err != nil {
		return "", err
	}
	return sessionToken, nil
}
func (r *UserServiceHandler) LocalSignUp(ctx context.Context, name string, email string, password string) (string, error) {
	_, err := r.repo.GetUserByEmail(ctx, email)
	if err == nil {
		slog.Error("User with this email already exists", "error", err)
		return "", errors.New("User Already Exists with this email")
	}
	hashPassword, err := r.password.GenerateHash(password)
	if err != nil {
		return "", err
	}
	user := &domain.User{
		UserName:     name,
		Email:        email,
		HashPassword: &hashPassword,
	}
	err = r.repo.CreateUser(ctx, user)
	if err != nil {
		return "", err
	}
	sessionToken, err := r.token.GenerateToken(ctx, user.ID)
	if err != nil {
		return "", err
	}
	return sessionToken, nil
}

func (r *UserServiceHandler) Logout(ctx context.Context, sessionToken string) error {
	err := r.token.DeleteToken(ctx, sessionToken)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserServiceHandler) GetUserProfile(ctx context.Context, user_ID uuid.UUID) (*domain.User, error) {
	user, err := r.repo.GetUserByID(ctx, user_ID)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserServiceHandler) RemoveUserAccount(ctx context.Context, user_ID uuid.UUID) error {
	err := r.repo.DeleteUser(ctx, user_ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserServiceHandler) UpdateAvatar(ctx context.Context, userid uuid.UUID, file *multipart.FileHeader) error {
	folder := "avatar"
	err := r.repo.UpdateUserProfileImage(ctx, file, userid, folder)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserServiceHandler) UpdateDetails(ctx context.Context, name string, password string, userID uuid.UUID) error {
	hashPassword, err := r.password.GenerateHash(password)
	if err != nil {
		return errors.New("Internal Server Error")
	}
	err = r.repo.UpdateUserDetails(ctx, name, hashPassword, userID)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserServiceHandler) GetPublicProfile(ctx context.Context, email string) (*domain.User, error) {
	user, err := r.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return user, nil
}
