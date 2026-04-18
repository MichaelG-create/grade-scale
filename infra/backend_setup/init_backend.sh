#!/bin/bash

# Variables
RESOURCE_GROUP_NAME=rg-gradescale-tfstate
STORAGE_ACCOUNT_NAME=stgradescaletfstate$RANDOM
CONTAINER_NAME=tfstate
LOCATION=francecentral

# Create resource group
echo "Creating Resource Group..."
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

# Create storage account
echo "Creating Storage Account..."
az storage account create --resource-group $RESOURCE_GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob

# Create blob container
echo "Creating Storage Container..."
az storage container create --name $CONTAINER_NAME --account-name $STORAGE_ACCOUNT_NAME

echo "------------------------------------------"
echo "✅ Backend Setup Complete!"
echo "Storage Account Name: $STORAGE_ACCOUNT_NAME"
echo "Resource Group Name: $RESOURCE_GROUP_NAME"
echo "Container Name: $CONTAINER_NAME"
echo "------------------------------------------"
echo "SAVE THESE VALUES for your Terraform backend configuration."
