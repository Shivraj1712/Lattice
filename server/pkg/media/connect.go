package media

import (
	"log/slog"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/cloudinary/cloudinary-go/v2"
)

var Cloudinary *cloudinary.Cloudinary

func ConnectCloudinary() error {
	Cld, err := cloudinary.NewFromURL(config.Configuration.CloudinaryUrl)
	if err != nil {
		slog.Error("Failed to connect to cloudinary", "error", err)
		return err
	}
	Cloudinary = Cld
	return nil
}
