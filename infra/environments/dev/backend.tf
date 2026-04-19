terraform {
  backend "azurerm" {
    resource_group_name  = "rg-gradescale-tfstate"
    storage_account_name = "stgradescaletfstate17000"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}
