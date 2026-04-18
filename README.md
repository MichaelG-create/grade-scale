# 🐧 GradeScale (PoC) : Core Grading Engine pour l'Éducation Assistée par IA

> **Technical Sandbox & Architectural Concept**
> Ce dépôt présente une preuve de concept (PoC) se concentrant sur le moteur d'évaluation backend. Il explore l'implémentation de modèles de données et structurels permettant à l'IA d'assister les enseignants dans l'analyse granulaire des apprentissages, avec un focus sur la robustesse et la scalabilité.

---

## 🎯 1. Contexte Ingénierie & Métier

La conception de ce PoC répond à un double objectif :
1. **Transposition Architecturale** : Démontrer ma capacité à projeter des compétences éprouvées en ingénierie de la donnée (Python / SQL / Data Stack moderne) sur une stack Transactionnelle et Cloud-Native cible (Node.js, TypeScript, PostgreSQL).
2. **Domain-Driven Design (DDD)** : Intégrer une expertise métier profonde (15 ans d'enseignement de la Physique-Chimie) directement dans la structure de données et la logique métier, assurant que la technologie serve des cas d'usage pédagogiques concrets.

## 🏗️ 2. Décisions d'Architecture (System Design)

Le système est construit sur des principes applicatifs robustes, conçus pour la maintenabilité et la sécurité :

*   **Validation Gérée par le Schéma (Type Safety)** : Utilisation exclusive de **Zod** à la frontière de l'API pour parser les payload entrants et contraindre les réponses du LLM (Structured Outputs), garantissant un typage strict end-to-end.
*   **Couche de Service Isolée (Separation of Concerns)** : La logique analytique et l'orchestration de l'IA (hydratation des barèmes, appels API) sont découplées des routeurs Fastify, facilitant les tests unitaires et l'isolation du code.
*   **Stratégie de Connection Pooling (Neon.tech)** : Pour sécuriser la scalabilité en environnement Serverless, la configuration Prisma sépare le flux opérationnel applicatif (`DATABASE_URL` adossée à PgBouncer) des exécutions de migrations de schéma (`DIRECT_URL`).
*   **Privacy By Design (RGPD)** : Intégration d'une couche de pseudonymisation interceptant et nettoyant les données étudiantes brutes avant leur exposition systémique à un fournisseur LLM externe.

## 🔭 3. Modélisation Pédagogique (Core Domain)

Le schéma relationnel modélise une évaluation formative granulée, au-delà du simple "score" :
*   **Rubriques et Critères** : Structuration hiérarchique dynamique pour évaluer les compétences conceptuelles transverses (Ex: Démarche d'investigation, validation des unités).
*   **Détection des *Misconceptions*** : Le moteur d'analyse sémantique est architecturé pour identifier les biais de raisonnement récurrents chez l'élève, facilitant la génération de feedbacks actionnables.

## 🛠️ 4. Stack Technique de Référence

*   **Runtime / Language** : Node.js & TypeScript (Strict Mode)
*   **API Framework** : Fastify (Haute performance, architecture orientée événements)
*   **ORM Layer** : Prisma
*   **Database** : PostgreSQL (Host: Neon.tech Serverless)
*   **Inference Engine** : API OpenAI Compatible (Groq LPU exploité ici pour la mitigation absolue de la latence)

---

## 🚀 Mise en Route (Development)
### 💻 Backend

#### 0. 📋 Prérequis
Avant de commencer, assurez-vous d'avoir **Node.js** (LTS) installé. Si vous ne l'avez pas, nous recommandons l'utilisation de **NVM** (Node Version Manager).

```bash
# Installer NVM (outil recommandé pour la gestion d'installation de version de node)
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# Recharger la configuration du shell (Bash ou Zsh)
source ~/.$(basename $SHELL)rc

# Installer la dernière version LTS de Node.js
nvm install --lts
```

---

#### 1. Installation du Projet

#### 1.1. Cloner le dépôt
```bash
git clone git@github.com:MichaelG-create/grade-scale.git
cd grade-scale
```

#### 1.2. Installation des dépendances
```bash
npm install
```

#### 1.3. Configuration des variables d'environnement
```bash
# Créer le fichier .env à partir de l'exemple
cp .env.example .env
```
> [!IMPORTANT]
> Ouvrez le fichier `.env` et remplacez les valeurs par défaut :
> * **Base de données :** Renseignez vos identifiants PostgreSQL (Neon ou autre) pour `DATABASE_URL` et `DIRECT_URL`.
> * **IA :** Ajoutez une clé API valide pour `GROQ_API_KEY` (disponible gratuitement sur le [console Groq](https://console.groq.com/)).

#### 1.4. Amorçage et Synchronisation (Database)
```bash
# Synchroniser le schéma de la base de données
npx prisma migrate dev

# Remplir la base avec des données de test
npm run seed
```

#### 2. Lancement du Serveur
```bash
npm run dev
```

---

### 💡 Astuces
* **Rechargement shell :** Si la commande `nvm` n'est pas reconnue après l'étape 1, exécutez manuellement `source ~/.bashrc` (ou `.zshrc`).
* **Prisma :** Les variables `DIRECT_URL` et `DATABASE_URL` sont toutes deux nécessaires pour fonctionner correctement avec des environnements Serverless comme Neon.

---
### 🎨 Frontend
L'interface utilisateur est construite en Vanilla JS avec Vite pour une expérience ultra-rapide.
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Déploiement & Hébergement

Ce projet est conçu pour être facilement "Cloud-Ready" :
*   **Frontend** : Peut être hébergé sur **Vercel**, **Netlify** ou **GitHub Pages**. Il suffit de pousser le dossier `frontend` (ou le repo complet) et de configurer la variable d'environnement `VITE_API_BASE_URL` pour pointer vers votre backend déployé.
*   **Backend** : Idéal pour des services de PaaS comme **Render**, **Railway** ou **Fly.io** qui supportent Node.js et les connexions aux bases de données managées (comme Neon.tech utilisé ici).
*   **Database** : Déjà hébergée sur **Neon.tech**, facilitant un déploiement global sans gestion d'infra serveur.

## 📈 Roadmap & Industrialisation

Pour élever cette fondation vers un socle de production complet, les itérations suivantes viendraient consolider l'architecture :

*   **Cloud Infrastructure (Azure)** : Bascule des charges de travail applicatives et de l'orchestration asynchrone (ex: files d'attente pour le traitement de masse) sur une infrastructure de conteneurs managée de type Azure.
*   **Pipeline Multi-Modal (OCR)** : Intégration en amont d'un service de Vision par Ordinateur pour traiter l'ingestion brute de copies physiques, automatisant le pipeline de traitement ("Paper-to-Digital").
*   **Assistant Créateur d'Évaluations (IA)** : Module permettant de générer automatiquement des sujets complexes, leurs solutions de référence et les barèmes de critères associés à partir d'un simple thème pédagogique.
*   **Monitoring & Observabilité** : Implémentation d'une télémétrie complète (Latence LLM requêtes/réponses, utilisation des tokens, détection d'anomalies de parsing) via un APM industriel.

---
*Projet conçu avec rigueur par Michael GARCIA - Ingénieur & Enseignant.*