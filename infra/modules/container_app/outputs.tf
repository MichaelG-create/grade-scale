output "url" {
  value = azurerm_container_app.main.ingress[0].fqdn
}

output "principal_id" {
  value = azurerm_container_app.main.identity[0].principal_id
}
