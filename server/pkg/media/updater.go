package media

import (
	"context"
	"mime/multipart"
)

func UpdateMedia(ctx context.Context, publicID string, file *multipart.FileHeader, folder string) (string, string, error) {
	SecuredUrl, PublicID, err := UploadImage(ctx, file, folder)
	if err != nil {
		return "", "", err
	}
	err = DeleteImage(ctx, publicID)
	if err != nil {
		return "", "", err
	}
	return SecuredUrl, PublicID, nil
}
