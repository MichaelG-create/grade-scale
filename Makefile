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

# --- Infrastructure ---
# Extract variables from .env and inject them as TF_VARs
GROQ_KEY = $(shell grep GROQ_API_KEY .env | cut -d '=' -f2- | tr -d '\" ' )
GH_USER  = $(shell grep GITHUB_USERNAME .env | cut -d '=' -f2- | tr -d '\" ' )
DB_PASS  = $(shell grep AZURE_DB_PASSWORD .env | cut -d '=' -f2- | tr -d '\" ' )

# Common TF_VARs to avoid repetition
TF_VARS = TF_VAR_groq_api_key="$(GROQ_KEY)" TF_VAR_github_username="$(GH_USER)" TF_VAR_db_password="$(DB_PASS)"

infra-init:
	@cd infra/environments/dev && terraform init

infra-plan:
	@echo "Running Terraform Plan (Secrets hidden)..."
	@cd infra/environments/dev && $(TF_VARS) terraform plan

infra-apply:
	@echo "Running Terraform Apply (Secrets hidden)..."
	@cd infra/environments/dev && $(TF_VARS) terraform apply
