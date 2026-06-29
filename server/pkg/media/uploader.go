package media

import (
	"context"
	"errors"
	"log/slog"
	"mime/multipart"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadImage(ctx context.Context, file *multipart.FileHeader, folder string) (string, string, error) {
	content_type := file.Header.Get("Content-Type")
	if !strings.HasPrefix(content_type, "Image/") {
		return "", "", errors.New("Invalid Media")
	}
	src, err := file.Open()
	if err != nil {
		slog.Error("Failed to open the file", "error", err)
		return "", "", err
	}
	defer src.Close()
	result, err := Cloudinary.Upload.Upload(ctx, src, uploader.UploadParams{
		Folder: "Lattice/" + folder,
	})
	if err != nil {
		slog.Error("Failed to upload media", "error", err)
		return "", "", err
	}
	return result.SecureURL, result.PublicID, nil
}
