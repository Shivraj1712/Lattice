package validator

import (
	"mime/multipart"

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

type UpdateAvatar struct {
	File multipart.FileHeader `json:"file"`
}

func Validate(request any) error {
	return Validator.Struct(request)
}
