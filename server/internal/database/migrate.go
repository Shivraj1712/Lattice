package database

import (
	"errors"
	"log/slog"
	"os"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func MigrateModels() {
	slog.Info("Migration starts")
	m, err := migrate.New("file://migrations", config.Configuration.DatabaseUrl)
	if err != nil {
		slog.Error("Failed to create migrations instance", "error", err)
		os.Exit(4)
	}
	defer m.Close()
	if err = m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		slog.Error("Migrations failed", "error", err)
		os.Exit(5)
	}
	slog.Info("Migration successful")
}
