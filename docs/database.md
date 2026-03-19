# Base de données (Sequelize)

Le projet utilise **Sequelize (v6)** pour la gestion des données. Ce module est optionnel et peut être désactivé par configuration.

## 1. Activer / Désactiver la base

Dans votre `.env`, vous contrôlez l'activation générale via une simple variable :

```env
DATABASE_ENABLED=true # Mettre à false pour désactiver le singleton global
DATABASE_DIALECT=postgres # Entre postgres, mysql, sqlite, mariadb, mssql.
```

Si la valeur vaut `false`, la méthode de démarrage globale fera l'impasse sur la tentative de connexion de base, et le constructeur Sequelize sera silencieusement défini sur `null`.

## 2. Structure et Modèles

Chaque table est représentée par une classe `Model` dans `src/database/models/`. L'écriture d'un modèle se fait via le générateur CLI :

```bash
npm run make model Post title:string content:text? scope:float!unique
```

### Pattern `boot()`

Les modèles utilisent une méthode statique `boot()` pour l'initialisation différée. Cela garantit que le modèle n'est instancié qu'une fois la connexion DB établie :

```ts
export class Media extends Model {
  declare id: number;
  declare source: string;

  static boot() {
    if (sequelize && !this.sequelize) {
      this.init(
        {
          /* colonnes */
        },
        { sequelize, tableName: "medias" },
      );
    }
  }
}
```

### Enregistrement centralisé

Tous les modèles sont enregistrés dans `src/database/models/index.ts` via la fonction `bootModels()`. Cette fonction est appelée automatiquement par `initDatabase()` après authentification :

```ts
// src/database/models/index.ts
export function bootModels() {
  Media.boot();
  JoieDuCode.boot();
}
```

> Lorsque vous générez un modèle via `npm run make model`, l'import et l'appel `boot()` sont ajoutés automatiquement.

## 3. Migrations

Les migrations sont gérées par **umzug** et accessibles via le Kernel :

```bash
npm run command migrate           # Exécute les migrations en attente
npm run command migrate status    # Affiche le statut des migrations
npm run command migrate rollback  # Annule la dernière migration
npm run command migrate reset     # Annule toutes les migrations
npm run command migrate refresh   # Reset + up
```

## 4. Le Singleton

Au sein des fichiers métier, le boilerplate met à disposition la variable `sequelize` singleton :

```ts
import { sequelize } from "../database";

if (sequelize !== null) {
  // Exécuter l'action requise.
}
```

Rappelez vous de la philosophie du projet : **Toute interaction modifiant la DB (UPDATE/DELETE/CREATE) ne s'effectue qu'au travers des `Service`, dans une encapsulation par transaction.**

_Documentation Suivante : [CLI & Générateurs](./cli.md)_
