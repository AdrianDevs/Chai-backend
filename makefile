# Variables
APP_NAME := chai-backend
VERSION := 0.1.0

# Build and start containers and run the application in watch mode for development
all: up

# Build and start containers and run the application in watch mode for development
up:
	@echo "Starting containers for dev..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop and remove running containers for development
down:
	@echo "Stopping running containers..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "Stopping containers complete!"

# Build and start containers and run the application for production
up-prod:
	@echo "Starting containers for prod..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Stop and remove running containers for production
down-prod:
	@echo "Stopping running containers..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down
	@echo "Stopping containers complete!"

# Start database development container
up-db-dev:
	@echo "Starting database container..."
	docker compose -f docker-compose.yml up --detach --remove-orphans
	@echo "Running migrations..."
	npx kysely migrate latest
	@echo "Database container started!"

# Stop and remove database development container
down-db-dev:
	@echo "Stopping database container..."
	docker compose -f docker-compose.yml down
	@echo "Stopping database container complete!"

# Test migrations
test-migrations:
	@echo "Starting test database container..."
	docker compose -f docker-compose.yml -f docker-compose.staging.db.yml up --build --detach
	@echo "Waiting for database to start..."
	./scripts/wait-for-it.sh localhost:5432 -- echo "...database is up"
	@echo "Running migrations..."
	npx kysely migrate latest
	@echo "Stopping test database container..."
	docker compose  -f docker-compose.yml -f docker-compose.staging.db.yml down --volumes
	@echo "Migrations complete!"

# Run tests in the test environment
test-staging:
	@echo "Starting test database container..."
	docker compose -f docker-compose.yml -f docker-compose.staging.db.yml -f docker-compose.staging.web.yml up --build --detach
	@echo "Waiting for database to start..."
	./scripts/wait-for-it.sh localhost:5432 -- echo "...database is up"
	@echo "Running migrations..."
	npx kysely migrate latest
	@echo "Running tests..."
	npx vitest --run
	@echo "Stopping test database container..."
	docker compose  -f docker-compose.yml -f docker-compose.staging.db.yml -f docker-compose.staging.web.yml down --volumes
	@echo "Migrations complete!"

# Tidy up docker images, volumes and networks
tidy:
	@echo "Tidying up..."
	docker image prune -f
	docker volume prune -f
	docker network prune -f
	@echo "Tidying up complete!"

# Application version
version:
	@echo "$(APP_NAME) version $(VERSION)"

# Help command to display usage of the Makefile
help:
	@echo "Usage:"
	@echo "  make                  - Build and start containers and run the application in watch mode for development"
	@echo "  make up               - Build and start containers and run the application in watch mode for development"
	@echo "  make down             - Stop and remove running containers for development"
	@echo "  make up-prod          - Build and start containers and run the application for production"
	@echo "  make down-prod        - Stop and remove running containers for production"
	@echo "  make up-db-dev        - Start database development container"
	@echo "  make down-db-dev      - Stop and remove database development container"
	@echo "  make test-migrations  - Test migrations"
	@echo "  make test-staging     - Run tests in the test environment"
	@echo "  make tidy             - Tidy up docker images, volumes and networks"
	@echo "  make version          - Show application version"
	@echo "  make help             - Show this help message"