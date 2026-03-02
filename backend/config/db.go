package config
import (
	"context"
	"log"
	"os"
	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool
func ConnectDB() {
	dbURL := os.Getenv("DB_URL")

	pool ,err := pgxpool.New(context.Background(),dbURL)
	if err != nil {
		log.Fatal("Unable to connect to database: ",err)
	}
	DB = pool
	log.println("PostgreSQL connected")
}