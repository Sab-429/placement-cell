package controllers

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

const workerQueueKey = "tasks:worker"

type redisQueueKey struct {
	client *redis.Client
}

var queueClient *redisQueue

func InitQueue() {
	opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Fatalf("invalid REDIS_URL: %v", err)
	}
	queueClient = &redisQueue{client: redis.NewClient(opt)}
	log.Println("Redis queue connected")
}

func (q *redisQueue) Push(task map[string]interface{}) error {
	data, err := json.Marshal(task)
	if err != nil {
		return err
	}
	return q.client.LPush(context.Background(), workerQueueKey, data).Err()
}