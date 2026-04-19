variable "app_name" { type = string }
variable "env_id" { type = string }
variable "rg_name" { type = string }
variable "image_name" { type = string }
variable "cpu" {
  type    = number
  default = 0.25
}
variable "memory" {
  type    = string
  default = "0.5Gi"
}
variable "database_url_secret_id" {
  type      = string
}
variable "groq_api_key_secret_id" {
  type      = string
}
