resource "azurerm_static_site" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = "Free" # On reste sur du gratuit pour le PoC
  sku_size            = "Free"
}

output "id" {
  value = azurerm_static_site.main.id
}

output "api_key" {
  value     = azurerm_static_site.main.api_key
  sensitive = true
}

output "default_host_name" {
  value = azurerm_static_site.main.default_host_name
}
