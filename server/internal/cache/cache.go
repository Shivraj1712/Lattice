package cache

import (
	"context"
	"log/slog"

	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client

func ConnectRedis() error {
	options, err := redis.ParseURL(config.Configuration.RedisUrl)
	if err != nil {
		options = &redis.Options{
			Addr: config.Configuration.RedisUrl,
		}
	}
	RedisClient = redis.NewClient(options)
	ctx := context.Background()
	_, err = RedisClient.Ping(ctx).Result()
	if err != nil {
		slog.Error("Failed to connect to redis", "error", err)
		return err
	}
	return nil
}
