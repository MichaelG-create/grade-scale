resource "azurerm_container_app" "main" {
  name                         = var.app_name
  container_app_environment_id = var.env_id
  resource_group_name          = var.rg_name
  revision_mode                = "Single"

  template {
    container {
      name   = "gradescale-api"
      image  = var.image_name
      cpu    = var.cpu
      memory = var.memory

      env {
        name  = "DATABASE_URL"
        value = var.database_url
      }
      env {
        name  = "GROQ_API_KEY"
        value = var.groq_api_key
      }
      env {
        name  = "PORT"
        value = "3000"
      }
    }
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
