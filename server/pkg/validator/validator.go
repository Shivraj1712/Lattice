package validator

import (
	"github.com/go-playground/validator/v10"
)

var Validator = validator.New()

type LoginStruct struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type SignUpStruct struct {
	Name     string `json:"name" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type EmailStruct struct {
	Email string `json:"email" binding:"required,email"`
}

type UpdateDetailStruct struct {
	Name     string `json:"name" binding:"omitempty,min=3"`
	Password *string `json:"password" binding:"omitempty,min=8"`
}

func Validate(request any) error {
	return Validator.Struct(request)
}
