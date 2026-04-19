output "resource_group_name" {
  value = azurerm_resource_group.prod.name
}

output "container_app_url" {
  value = module.api.url
}

output "static_web_app_url" {
  value = module.frontend.default_host_name
}

output "static_web_app_api_key" {
  value     = module.frontend.api_key
  sensitive = true
}

output "key_vault_name" {
  value = module.security.name
}
