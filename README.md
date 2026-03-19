# 🤖 Boilerplate Discord Bot (TypeScript)

Boilerplate pour la création de bots Discord en TypeScript, axé sur la modularité et la testabilité.

## 🚀 Fonctionnalités

- **TypeScript** : Typage strict et configuration optimisée.
- **Commandes Unifiées** : Gestion des _Prefix_ et _Slash Commands_ via une structure commune.
- **Composants** : Abstraction pour les Boutons, Modals et Select Menus.
- **Architecture Service** : Séparation de la logique métier et de l'interface Discord.
- **Base de données** : Intégration Sequelize v6 (Postgres, MySQL, SQLite, etc.), désactivable via config.
- **CLI (Make)** : Générateurs de code pour les commandes, modèles, services et commandes console.
- **Tests** : Configuration Vitest prête pour un coverage à 100%.
- **Localisation** : Système i18n Laravel-like avec helper global `__()`.
- **Process API** : Gestion des processus externes et commandes console autonomes.
- **Cache** : Système de cache multi-driver (Memory, File) inspiré de Laravel.

## 🛠️ Prérequis et Installation

Afin de garantir le fonctionnement optimal, l'environnement nécessite **Node.js v22**.

```bash

# S'assurer d'utiliser Node 22 avant toute utilisation de npm

nvm use 22

# Lancer le serveur de développement (watch mode)
npm run dev

# Compiler le projet
npm run build

# Lancer les tests
npm run test

# Installation des dépendances

npm install

# Copier le fichier d'environnement et le configurer

cp .env .env.dev.local
```

## 📚 Documentation détaillée

La documentation a été divisée de façon thématique pour la rendre très facilement accessible. Explorez les différentes rubriques selon vos besoins :

1.  **[Structure & Philosophie](./docs/architecture.md)**
    - _Apprenez comment le projet est organisé, comment fonctionne le `BotClient` et la configuration centralisée (`config.ts`)._
2.  **[Commandes et Interactions](./docs/commands-interactions.md)**
    - _Le cœur du système : Comment créer des commandes (Slash & Prefix), utiliser les callbacks, et structurer les sous-commandes._
3.  **[Services & HTTP](./docs/services.md)**
    - _Comment séparer votre logique métier avec la classe `Service` et communiquer avec des API externes via `HttpClient`._
4.  **[Base de données (Sequelize)](./docs/database.md)**
    - _Activer, utiliser et gérer la base de données (migrations, modèles)._
5.  **[CLI & Générateurs (Make)](./docs/cli.md)**
    - _Comment générer du code rapidement avec `npm run make` et configurer la base de données via la CLI._
6.  **[Tests & Coverage (100%)](./docs/testing.md)**
    - _Comment tester vos commandes et vos services sans instancier le vrai client Discord._
7.  **[Système de Cache (Laravel-like)](./docs/cache.md)**
    - _Utiliser le cache en mémoire ou sur fichier pour optimiser les performances._
8.  **[Gestion des Processus (PM2)](./docs/pm2.md)**
    - _Maintenir le bot en ligne et gérer les redémarrages automatiques._
9.  **[Localisation (i18n)](./docs/localization.md)**
    - _Gérer les messages multilingues et les variables dans vos chaînes._

---

## 🏃 Quickstart - Démarrage rapide

Une fois votre fichier \`.env\` configuré (via un token Discord) :

\`\`\`bash
nvm use 22

# Démarrer le bot en mode développement (watch)

npm run dev

# Packager pour la production

npm run build
npm start
\`\`\`
