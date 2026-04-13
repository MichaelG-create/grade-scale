# 🎓 GradeScale AI : Évaluation Automatisée par IA (LPU)
> **Projet de Recherche & Développement - EdTech**
> *Optimisation de la correction académique via Inférence LLM ultra-rapide et Architecture Cloud-Native.*
> 
## 📑 1. Vision du Projet
**GradeScale AI** est une infrastructure backend conçue pour automatiser l'évaluation de copies d'élèves. L'objectif est de supprimer le biais humain et la latence de correction en utilisant des modèles de langage (LLM) de pointe, tout en garantissant une précision chirurgicale grâce à des barèmes dynamiques injectés en contexte.
## 🏗️ 2. Architecture Système (High-Level)
### **A. Couche de Consommation (API)**
 * **Framework :** Fastify (Node.js)
 * **Pourquoi ?** Architecture orientée événements, performance supérieure à Express (+20% de débit), et validation native via schémas JSON.
### **B. Couche de Persistance (Cloud-Native)**
 * **ORM :** Prisma
 * **Base de Données :** Neon.tech (PostgreSQL Serverless)
 * **Innovation :** Utilisation du **Connection Pooling** pour supporter des pics de charge massifs sans saturation de ressources. Architecture découplée pour éviter l'empreinte disque locale (Contrainte : < 8Go de stockage).
### **C. Couche d'Intelligence (LPU Inférence)**
 * **Moteur :** Groq Cloud
 * **Modèle :** Llama 3-70B
 * **Spécificité :** Utilisation de puces **LPU (Language Processing Units)** permettant une analyse de texte en temps réel avec une latence quasi nulle.
## 🌊 3. Le Pipeline de Traitement (Data Flow)
 1. **Ingestion :** Réception de la copie (Plain Text/OCR) via un endpoint sécurisé.
 2. **Hydratation :** Extraction des critères de notation spécifiques depuis **Neon via Prisma** (RAG structurel).
 3. **Prompt Engineering :** Construction d'un prompt "Few-Shot" incluant :
   * Le contexte académique.
   * Le barème détaillé (critères, points, malus).
   * La copie de l'élève.
 4. **Inférence :** Analyse sémantique par **Llama 3** sur les serveurs de **Groq**.
 5. **Structuration :** Conversion de la réponse IA en JSON typé.
 6. **Persistance :** Archivage de la note finale et des feedbacks dans PostgreSQL.
 7. **Restitution :** Envoi du bulletin de note détaillé au client.
## 🛠️ 4. Choix Techniques & Optimisations
| Composant | Solution | Justification Ingénieur |
|---|---|---|
| **Réseau** | IPv4 via Pooler | Contournement des limitations IPv6 de WSL2 et compatibilité universelle. |
| **Sécurité** | SSL Enforced | Chiffrement de bout en bout des données élèves (RGPD compliant). |
| **Scalabilité** | Serverless DB | Migration de Supabase vers **Neon** pour une meilleure gestion des ressources partagées. |
| **Vitesse** | Groq API | Transition vers l'inférence matérielle pour garantir un feedback en < 1 seconde. |
## 📊 5. Modèle de Données (Schéma Prisma)
 * **GradeScale** : Le conteneur du barème (ex: "Examen Final Physique").
 * **ScaleCriterion** : Les règles unitaires (ex: "Clarté", "Raisonnement", "Unités").
 * **Evaluation** : Le résultat final liant un élève à sa performance.
## 🚀 Guide d'Installation (Quick Start)
```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les secrets (.env)
DATABASE_URL="postgresql://user:pass@ep-pooler.neon.tech/neondb"
GROQ_API_KEY="gsk_..."

# 3. Synchroniser la base de données
npx prisma migrate dev --name init_neon

# 4. Lancer le serveur
npm run dev

```
## 🧠 6. Perspectives d'Évolution
 * **Multi-Modalité :** Intégration de modèles Vision pour corriger des copies manuscrites directement.
 * **Analytics :** Tableaux de bord de progression par classe via les données consolidées dans Neon.