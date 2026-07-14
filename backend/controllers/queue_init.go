package controllers

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

const workerQueueKey = "tasks:worker"

type redisQueue struct {
	client *redis.Client
}

var queueClient *redisQueue

func InitQueue() {
	// Read URL from env — fallback to localhost for local dev
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}
	log.Println("Using Redis URL:", redisURL)
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("invalid REDIS_URL %q: %v", redisURL, err)
	}

	client := redis.NewClient(opt)

	// Verify connection immediately — fail fast if Redis is unreachable
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("cannot connect to Redis at %s: %v", redisURL, err)
	}

	queueClient = &redisQueue{client: client}
	log.Printf("Redis queue connected at %s", redisURL)
}

func (q *redisQueue) Push(task map[string]interface{}) error {
	data, err := json.Marshal(task)
	if err != nil {
		return err
	}

	ctx := context.Background()

	err = q.client.LPush(ctx, workerQueueKey, data).Err()
	if err != nil {
		return err
	}

	length, _ := q.client.LLen(ctx, workerQueueKey).Result()
	log.Printf("Queue length after LPUSH: %d", length)

	return nil
}