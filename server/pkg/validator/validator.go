package validator

import (
	"github.com/go-playground/validator/v10"
)

var Validator = validator.New()

type LoginStruct struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type SignUpStruct struct {
	Name     string `json:"name" validate:"required,min=3"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type EmailStruct struct {
	Email string `json:"email" validate:"required,email"`
}

type UpdateDetailStruct struct {
	Name     string  `json:"name" validate:"omitempty,min=3"`
	Password *string `json:"password" validate:"omitempty,min=8"`
}

type CreateProjectStruct struct {
	Title       string `json:"title" form:"title" validate:"required,min=4"`
	Description string `json:"description" form:"description" validate:"required,min=8"`
	GithubLink  string `json:"github_link" form:"github_link" validate:"required,url"`
	LiveDemo    string `json:"live_demo_link" form:"live_demo_link" validate:"required,url"`
	Category    string `json:"category" form:"category" validate:"omitempty,min=3"`
}

type UpdateProjectStruct struct {
	Title       string `json:"title" form:"title" validate:"omitempty,min=4"`
	Description string `json:"description" form:"description" validate:"omitempty,min=8,max=1000"`
	GithubLink  string `json:"github_link" form:"github_link" validate:"omitempty,url"`
	LiveDemo    string `json:"live_demo_link" form:"live_demo_link" validate:"omitempty,url"`
	Category    string `json:"category" form:"category" validate:"omitempty,min=3"`
}

func Validate(request any) error {
	return Validator.Struct(request)
}
