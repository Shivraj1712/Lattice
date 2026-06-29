package database

import (
	"log/slog"
	"os"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	slog.Info("Starting Database Connection")
	conn, err := gorm.Open(postgres.Open(config.Configuration.DatabaseUrl), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		slog.Error("Failed to connect to the database", "error", err)
		os.Exit(3)
	}
	slog.Info("Database connection Successful")
	slog.Info("Database pooling starts")
	sqlDB, err := conn.DB()
	if err != nil {
		slog.Error("Failed to do database pooling", "error", err)
	} else {
		sqlDB.SetMaxOpenConns(40)
		sqlDB.SetMaxOpenConns(10)
		slog.Info("Database pooling Successful")
	}
	DB = conn
}
