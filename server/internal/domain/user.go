package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserName       string    `json:"name" gorm:"type:varchar(50);not null"`
	Email          string    `json:"email" gorm:"type:text;not null; uniqueIndex"`
	HashPassword   *string   `json:"-" gorm:"type:text"`
	AvatarUrl      string    `json:"avatar_url" gorm:"type:text; default:''"`
	AvatarPublicID *string   `json:"-" gorm:"type:text"`
	AuthProvider   string    `json:"auth_provider" gorm:"type:varchar(15);not null;default:'local'"`
	AuthProviderID *string   `json:"-" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
