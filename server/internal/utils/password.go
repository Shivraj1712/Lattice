package utils

import (
	"log/slog"

	"golang.org/x/crypto/bcrypt"
)

type PasswordInterface interface {
	GenerateHash(givenPassword string) (string, error)
	VerifyPassword(givenPassword string, userPassword string) error
}

type PasswordHandler struct{}

func (r *PasswordHandler) GenerateHash(givenPassword string) (string, error) {
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(givenPassword), 10)
	if err != nil {
		slog.Error("Failed to generated hashed version of password", "error", err)
		return "", err
	}
	return string(hashPassword), nil
}

func (r *PasswordHandler) VerifyPassword(givenPassword string, userPassword string) error {
	err := bcrypt.CompareHashAndPassword([]byte(userPassword), []byte(givenPassword))
	return err
}
