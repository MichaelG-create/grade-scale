resource "azurerm_resource_group" "prod" {
  name     = "rg-gradescale-prod"
  location = "France Central"
}

module "database" {
  source              = "../../modules/postgres"
  resource_group_name = azurerm_resource_group.prod.name
  location            = azurerm_resource_group.prod.location
  server_name         = "pg-gradescale-prod-${random_string.suffix.result}"
  admin_username      = "psqladmin"
  admin_password      = var.db_password
  db_name             = "gradescale_prod"
  # On pourrait augmenter le SKU ici pour la prod si besoin
  sku_name            = "B_Standard_B1ms" 
}

module "environment" {
  source              = "../../modules/aca_env"
  resource_group_name = azurerm_resource_group.prod.name
  location            = azurerm_resource_group.prod.location
  env_name            = "cae-gradescale-prod"
}

module "api" {
  source       = "../../modules/container_app"
  rg_name      = azurerm_resource_group.prod.name
  env_id       = module.environment.id
  app_name     = "aca-gradescale-api-prod"
  image_name   = "ghcr.io/${var.github_username}/grade-scale:latest"
  cpu          = 0.5  # Un peu plus de CPU pour la prod
  memory       = "1.0Gi"
  database_url = "postgresql://${module.database.admin_username}:${var.db_password}@${module.database.server_fqdn}:5432/${module.database.db_name}?sslmode=require"
  groq_api_key = var.groq_api_key
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}
