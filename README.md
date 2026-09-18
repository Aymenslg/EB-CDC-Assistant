# EB-CDC-Assistant
**Génération d'un cahier des charges structuré à partir d'une expression de besoin**

## 📖 Contexte du Projet
Ce projet a été réalisé dans le cadre d'un projet de fin d'année (4ème année en Ingénierie Informatique et Réseaux à l'EMSI), lors d'un stage au sein de l'équipe Data/IA d'Atos Maroc.
L'objectif de cette application est de préparer un premier brouillon de cahier des charges (CDC) à partir d'une expression de besoin (EB) fournie au format PDF. Le système agit comme un assistant : il propose un document structuré que l'ingénieur peut ensuite relire, corriger et valider.

## 🚀 Fonctionnalités Principales
- **Importation d'EB (PDF) :** Extraction automatique du texte et création de fragments (chunks) vectorisés.
- **Génération Structurée (IA) :** Utilisation de Llama 3.2 3B (exécuté localement via Ollama) pour générer un CDC selon 16 rubriques fixes.
- **Chat Documentaire (RAG) :** Posez des questions ciblées sur l'EB grâce à la recherche sémantique filtrée par document.
- **Workflow de Validation :** Cycle de vie du document (BROUILLON, EN_REVUE, APPROUVE, REJETE) avec historique et motif de rejet.
- **Export PDF :** Génération d'un document final mis en page et prêt à être partagé.

## 🛠️ Architecture et Technologies
L'application repose sur une architecture répartie en 3 services :
- **Frontend (Interface) :** Next.js, App Router, TypeScript, Tailwind CSS.
- **Backend Métier :** Java 21, Spring Boot, Maven (Gestion documentaire, workflow, export PDF via openhtmltopdf)
- **Moteur IA :** Python, FastAPI, LangChain, PyMuPDF (Extraction, RAG, interaction avec Ollama).
- **Base de données :** PostgreSQL 16 avec l'extension `pgvector` pour la recherche de similarité.
- **Modèles IA :** `all-MiniLM-L6-v2` pour les embeddings, et `Llama 3.2 3B` pour la génération sur CPU.

## 🔒 Confidentialité et Sécurité
Le traitement est entièrement local, garantissant qu'aucune donnée métier sensible n'est transmise à une API externe.