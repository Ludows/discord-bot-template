# Interface en ligne de commande (CLI)

Le projet inclut un générateur de code et un dispatcher centralisé permettant d'accélérer le développement et de standardiser la création des composants.

> ⚠️ Attention : Une `ConsoleCommand` ne doit **jamais** être importée ou appelée par le bot. Ce sont des scripts s'exécutant dans votre Terminal.

## 1. Structure de Base `ConsoleCommand`

Pour tout script "One-Off" ou d'administration, il suffit de créer une classe dans `src/console/commands` héritant de `ConsoleCommand`.
Vous bénéficiez de :

- `this.getArg(index)` : Arguments positionnels.
- `this.getOption(key)` : Arguments avec clé (ex: `--user=uuid`).
- `this.hasFlag(flag)` : Flags de commande (ex: `--force`).
- `this.info(), this.success(), this.error()` : Sorties console formatées.

## 2. Le Kernel (Dispatcher Centralisé)

Toutes les commandes console sont enregistrées dans le **Kernel** (`src/console/Kernel.ts`). Vous pouvez exécuter n'importe quelle commande par sa signature :

```bash
npm run command {signature} [arguments]
```

| Commande                                | Description                              |
| :-------------------------------------- | :--------------------------------------- |
| `npm run command help`                  | Affiche la liste de toutes les commandes |
| `npm run command migrate`               | Exécute les migrations (par défaut: up)  |
| `npm run command migrate status`        | Affiche le statut des migrations         |
| `npm run command make:db:bonjourmadame` | Synchronise la base BonjourMadame        |
| `npm run command make:db:jdc`           | Synchronise la base JoieDuCode           |

### Raccourcis NPM

Quelques raccourcis sont conservés dans `package.json` :

- `npm run dev` : Lance le bot en mode développement avec rechargement automatique (`tsx watch`).
- `npm run build` : Compile le projet TypeScript.
- `npm run migrate` : Raccourci vers `npm run command migrate`.
- `npm run start:prod` : Démarre le bot via PM2.

## 3. Générateurs (`npm run make`)

L'outil **Make** permet de générer des fichiers pré-configurés à partir de templates (stubs).

```bash
npm run make <type> <Name> [champs...]
```

| Commande                   | Description                                        |
| :------------------------- | :------------------------------------------------- |
| `service [Nom]`            | Génère un Service dans `src/services/`             |
| `command [Nom]`            | Génère une commande console seule (`src/console/`) |
| `http [Nom]`               | Génère un endpoint Axios dans `src/http/endpoints` |
| `interaction [Nom]`        | Génère une interaction Prefix                      |
| `slash-interaction [Nom]`  | Génère une interaction unifiée (Slash + Prefix)    |
| `model [Nom] [champs]`     | Génère un modèle Sequelize + une migration         |
| `migration [Nom] [champs]` | Génère une migration standard                      |
| `test:interaction [Nom]`   | Génère un fichier de test Vitest mocké             |

### Auto-Enregistrement

Lorsque vous générez un composant via `npm run make`, celui-ci est **automatiquement enregistré** dans le fichier de registre correspondant :

| Type                                | Fichier de registre            |
| :---------------------------------- | :----------------------------- |
| `command`                           | `src/console/Kernel.ts`        |
| `service`                           | `src/services/index.ts`        |
| `interaction` / `slash-interaction` | `src/interactions/index.ts`    |
| `model`                             | `src/database/models/index.ts` |

Vous n'avez plus besoin d'ajouter manuellement les imports et les instances. Tout est opérationnel dès la génération.

### Analyse des options (Modèles et Migrations)

Le générateur parse les arguments pour définir les types de données :

```bash
npm run make model User name:string age:integer? email:string!unique
```

1. `name:string` : Champ requis.
2. `age:integer?` : Champ optionnel (`allowNull: true`).
3. `email:string!unique` : Champ unique obligatoire.

Le script génère automatiquement le modèle TypeScript Sequelize (avec méthode `boot()`) et le fichier de migration correspondant.

## 4. Task Scheduler (Planificateur de tâches)

Le projet intègre un planificateur de tâches inspiré de Laravel, basé sur `node-cron`. Les tâches sont définies dans la méthode `schedule()` du Kernel :

```ts
public schedule(schedule: Schedule): void {
  schedule.command("make:db:bonjourmadame").cron("5 10 * * *");   // Tous les jours à 10h05
  schedule.command("make:db:jdc").cron("30 10 * * *");            // Tous les jours à 10h30
}
```

### Fréquences disponibles

| Méthode               | Expression Cron  |
| :-------------------- | :--------------- |
| `.everyMinute()`      | `* * * * *`      |
| `.everyFiveMinutes()` | `*/5 * * * *`    |
| `.hourly()`           | `0 * * * *`      |
| `.daily()`            | `0 0 * * *`      |
| `.weekly()`           | `0 0 * * 0`      |
| `.monthly()`          | `0 0 1 * *`      |
| `.cron('...')`        | Expression libre |

Le scheduler est automatiquement démarré lors du hook `on_booted` du bot.

---

Documentation Suivante : [Tests & Couverture](./testing.md)
