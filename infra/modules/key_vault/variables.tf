variable "name" {
  type        = string
}

variable "resource_group_name" {
  type        = string
}

variable "location" {
  type        = string
}

variable "tenant_id" {
  type        = string
}

variable "admin_object_id" {
  type        = string
  description = "ID de l'objet utilisateur/service principal qui administre le vault"
}
