# --- GradeScale Management ---

.PHONY: dev build test docker-build clean help

help:
	@echo "GradeScale Management Commands:"
	@echo "  make dev           - Start backend in dev mode"
	@echo "  make test          - Run unit and integration tests"
	@echo "  make build         - Build the production dist"
	@echo "  make docker-build  - Build the Docker image locally"
	@echo "  make seed          - Seed the database"
	@echo "  make clean         - Remove dist and node_modules"

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

seed:
	npm run seed

docker-build:
	docker build -t gradescale-backend .

clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf frontend/dist
