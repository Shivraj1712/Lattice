package media

import (
	"context"
	"log/slog"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func DeleteImage(ctx context.Context, publicID string) error {
	_, err := Cloudinary.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		slog.Error("Failed to delete the image")
		return err
	}
	return nil
}
