# 🚀 Guide de Déploiement Azure (Senior)
 
 Ce document décrit la procédure pour déployer la stack **GradeScale** sur Azure en utilisant une approche **Infrastructure as Code (Terraform)** et des services managés.
 
 ## 🛠️ Prérequis
 
 *   **Azure CLI** installé : `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
 *   **Terraform** (>= 1.5.0)
 *   **Docker** (pour l'image backend)
 *   Un compte GitHub (pour le GitHub Container Registry)
 
 ## 🏗️ Phase 1 : Initialisation de l'Infrastructure
 
 ### 1. Authentification Azure
 ```bash
 az login
 ```
 
 ### 2. Configuration du Remote State
 Terraform a besoin d'un endroit pour stocker son état (`.tfstate`) de manière partagée. Utilisez le script fourni :
 ```bash
 chmod +x infra/backend_setup/init_backend.sh
 ./infra/backend_setup/init_backend.sh
 ```
 *Ce script crée un Storage Account Azure pour héberger le fichier d'état.*
 
 ### 3. Déploiement de la Stack
 Le `Makefile` à la racine automatise l'injection de vos secrets (clé Groq) et les commandes Terraform :
 
 ```bash
 make infra-init
 make infra-plan
 make infra-apply-dev
 ```
 
 > [!NOTE]
 > La commande `make infra-plan` extrait automatiquement votre `GROQ_API_KEY` du fichier `.env` à la racine pour l'injecter dans Azure Key Vault via Terraform. Zéro duplication, zéro erreur.
 
 ## 📦 Phase 2 : Publication & Déploiement du Backend
 
 Le backend est hébergé sur **Azure Container Apps**. L'automatisation est gérée par le `Makefile`.
 
 1. **Build & Push l'image** (vers GHCR) :
    ```bash
    make api-push
    ```
 2. **Déclencher le déploiement sur Azure** :
    ```bash
    make api-rollout-dev
    ```
 
 > [!IMPORTANT]
 > Au démarrage du container, le système exécute automatiquement les migrations Prisma et le **seeding** de la base de données (exercices par défaut).
 
 ## 🌐 Phase 3 : Déploiement du Frontend (Static Web Apps)
 
 1. Le Frontend est configuré pour communiquer avec votre API Azure (CORS activé sur ACA).
 2. Pour déployer le front automatiquement :
    ```bash
    make front-push-dev
    ```
 
 > [!NOTE]
 > Cette commande automatise la récupération du token Terraform, le build (`npm run build`) et le déploiement via la CLI Azure SWA.
 
 ## 🔐 Sécurité & Secrets (Key Vault)
 
 Tous les secrets sont centralisés dans **Azure Key Vault**.
 *   Le Backend utilise une **Identité Managée** pour y accéder sans mot de passe.
 *   **Automatisation** : Votre `GROQ_API_KEY` et la `DATABASE_URL` sont injectées automatiquement dans le Vault par Terraform lors du `make infra-apply`. Aucune manipulation manuelle n'est nécessaire.
 
 ## 📊 Monitoring
 
 Les logs de l'application sont centralisés dans le **Log Analytics Workspace**.
 *   Accédez au portail Azure > Resource Group > Logs pour visualiser les sorties `console.log()` de votre API en temps réel.
 
 ---
 
 > [!TIP]
 > En production, privilégiez l'utilisation de GitHub Actions pour automatiser ces étapes (CI/CD).

## 🔄 Phase 4 : CI/CD (GitHub Actions)
 
 Le projet inclut un workflow d'intégration et de déploiement continu automatique.
 
 ### 1. Configuration des Secrets GitHub
 Dans votre repo GitHub (Settings > Secrets > Actions), ajoutez les secrets suivants :
 
 *   `AZURE_CREDENTIALS` : Le JSON généré par la commande suivante :
     ```bash
     az ad sp create-for-rbac --name "GradeScale-CI" --role contributor --scopes /subscriptions/$(az account show --query id -o tsv) --sdk-auth
     ```
 *   `AZURE_SWA_TOKEN` : Le token récupéré via `make front-push-dev`.
 *   `GROQ_API_KEY` : Votre clé d'API Groq.
 
 ### 2. Utilisation
 À chaque `git push` sur la branche `master`, GitHub va automatiquement :
 1. Builder et pousser l'image Docker sur GHCR.
 2. Déclencher un rollout sur Azure Container Apps.
 3. Compiler et déployer le Frontend sur Azure Static Web Apps.
