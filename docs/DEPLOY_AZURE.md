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
make infra-apply
```

> [!NOTE]
> La commande `make infra-plan` extrait automatiquement votre `GROQ_API_KEY` du fichier `.env` à la racine pour l'injecter dans Azure Key Vault via Terraform. Zéro duplication, zéro erreur.

## 📦 Phase 2 : Publication du Backend (Docker)

Le backend est hébergé sur **Azure Container Apps**. L'image doit être poussée sur le registre GitHub (GHCR).

1. **Générer l'image** :
   ```bash
   make docker-build
   ```
2. **Tag & Push** :
   ```bash
   docker tag grade-scale:latest ghcr.io/<votre-user>/grade-scale:latest
   docker push ghcr.io/<votre-user>/grade-scale:latest
   ```

## 🌐 Phase 3 : Déploiement du Frontend (Static Web Apps)

1. Récupérez le token de déploiement via Terraform ou le portail Azure.
2. Utilisez l'extension **Azure Static Web Apps** dans VS Code ou la CLI `swa` pour pousser votre dossier `frontend/dist`.

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
