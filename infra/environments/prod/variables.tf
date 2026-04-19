variable "db_password" {
  type      = string
  sensitive = true
}

variable "groq_api_key" {
  type      = string
  sensitive = true
}

variable "github_username" {
  type = string
}

variable "github_pat" {
  type      = string
  sensitive = true
}
