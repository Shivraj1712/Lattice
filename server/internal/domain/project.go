package domain

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID                   uuid.UUID `json:"project_id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID               uuid.UUID `json:"user_id" gorm:"type:uuid;not null;"`
	ProjectUser          User      `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	ProjectImageUrl      string    `json:"image_url" gorm:"type:text;not null"`
	ProjectImagePublicID string    `json:"-" gorm:"type:text;not null"`
	Title                string    `json:"title" gorm:"type:text;not null;index"`
	ProjectDescription   string    `json:"description" gorm:"type:text;not null;index"`
	Category             string    `json:"category" gorm:"type:text;not null;index;default:'NoCategory'"`
	CreatedAt            time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
