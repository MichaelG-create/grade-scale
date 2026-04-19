resource "azurerm_container_app" "main" {
  name                         = var.app_name
  container_app_environment_id = var.env_id
  resource_group_name          = var.rg_name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  template {
    container {
      name   = "gradescale-api"
      image  = var.image_name
      cpu    = var.cpu
      memory = var.memory

      env {
        name  = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name  = "GROQ_API_KEY"
        secret_name = "groq-api-key"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "groq-api-key"
    value = var.groq_api_key
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
