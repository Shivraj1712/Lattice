package config

import (
	"errors"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseUrl        string
	RedisUrl           string
	GoogleClientId     string
	GoogleClientSecret string
	GoogleCallbackUrl  string
	CloudinaryUrl      string
}

var Configuration *Config

func FetchConfig() {
	err := godotenv.Load()
	if err != nil {
		slog.Error("Failed to load env file values", "error", err)
		os.Exit(1)
	}
	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		slog.Error("No connection string for the database found in env", "error", errors.New("No connection string for the database found in env"))
		os.Exit(2)
	}
	Configuration = &Config{
		Port:               os.Getenv("PORT"),
		DatabaseUrl:        databaseUrl,
		RedisUrl:           os.Getenv("REDIS_URL"),
		GoogleClientId:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleCallbackUrl:  os.Getenv("GOOLGE_CALLBACK_URL"),
		CloudinaryUrl:      os.Getenv("CLOUDINARY_URL"),
	}
}
