package utils

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/Shivraj1712/Lattice.git/internal/cache"
	"github.com/google/uuid"
)

type TokenInterface interface {
	GenerateToken(ctx context.Context, userID uuid.UUID) (string, error)
	VerifyToken(ctx context.Context, sessionToken string) (uuid.UUID, error)
	DeleteToken(ctx context.Context, sessionToken string) error
}

type TokenHandler struct{}

func (r *TokenHandler) GenerateToken(ctx context.Context, userID uuid.UUID) (string, error) {
	sessionToken := uuid.NewString()
	value := userID.String()
	err := cache.RedisClient.Set(ctx, sessionToken, value, 72*time.Hour).Err()
	if err != nil {
		slog.Error("Failed to store the session token", "error", err)
		return "", errors.New("Internal Server Error")
	}
	return sessionToken, nil
}

func (r *TokenHandler) VerifyToken(ctx context.Context, sessionToken string) (uuid.UUID, error) {
	value, err := cache.RedisClient.Get(ctx, sessionToken).Result()
	if err != nil {
		slog.Error("Failed to fetch user id from redis storage", "error", err)
		return uuid.Nil, errors.New("Internal Server Error")
	}
	userID, err := uuid.Parse(value)
	if err != nil {
		slog.Error("Failed to parse the token value to user id", "error", err)
		return uuid.Nil, errors.New("Internal Server Error")
	}
	return userID, nil
}

func (r *TokenHandler) DeleteToken(ctx context.Context, sessionToken string) error {
	err := cache.RedisClient.Del(ctx, sessionToken).Err()
	if err != nil {
		slog.Error("Failed to delete the session token", "error", err)
		return errors.New("Internal Server Error")
	}
	return nil
}
