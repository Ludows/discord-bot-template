# Structure et Architecture

Ce projet s'inspire des paterns backends classiques (Services, Controllers) adaptés à Discord.js.

## Séparation des responsabilités

1.  **`BotClient`** : Point d'entrée, gestion des événements Discord.
2.  **`Interactions`** : Validation des entrées, vérification des permissions et routage.
3.  **`Services`** : Logique métier, accès aux données et intégrations externes.

**Note :** La logique métier doit être isolée dans les `Services` plutôt que directement dans les `Interactions`.

---

## Arborescence

Voici la vue d'ensemble des dossiers principaux dans `src/` :

```
src/
├── index.ts // Point d'entrée principal appli (Boot)
├── config.ts // Source unique de vérité pour toutes les variables d'environnement
├── bot/ // Extension BotClient (wrapper du client discord.js)
├── interactions/ // Le système de commandes unifié (Prefix + Slash + Composants)
│   └── index.ts // Registre des interactions (auto-enregistrement)
├── services/ // Logique métier et requêtes base de données
│   └── index.ts // Registre des services (auto-enregistrement)
├── http/ // API Clients et requêtes axios
├── database/ // Configurations Sequelize, Modèles et Migrations
│   ├── models/
│   │   └── index.ts // Centralize bootModels() (auto-enregistrement)
│   └── migrations/ // Fichiers de migration umzug
├── help/ // Système d'aide dynamique en Markdown
├── utils/ // Outils (ex: PermissionManager, logger, Process)
├── lang/ // Fichiers de traduction (localisation)
└── console/ // Scripts CLI et dispatcher
    ├── Kernel.ts // Dispatcher centralisé + définition du scheduler
    ├── Schedule.ts // Planificateur de tâches (node-cron)
    ├── Make.ts // Générateur de code scaffolding
    ├── commands/ // Commandes console enregistrées dans le Kernel
    ├── generators/ // Générateurs avec auto-enregistrement
    └── stubs/ // Templates de code
```

---

## Le fichier `config.ts` centralisé

Le projet interdit formellement d'utiliser \`process.env\` directement dans le code métier (à l'exception de \`config.ts\`).

Le fichier \`src/config.ts\` est responsable de charger et typer toutes vos variables. Cela garantit que si une variable manque, l'erreur est identifiée à un seul et unique endroit.

### Résolution des Environnements (.env)

Les fichiers d'environnement sont lus dans cet ordre :

1.  \`.env\` : Base commune partagée.
2.  \`.env.{APP_ENV}\` : Surcharge selon l'environnement (ex: \`.env.dev\` ou \`.env.production\`).
3.  \`.env.{APP_ENV}.local\` : Surcharge strictement **locale**. Ce fichier est `.gitignored` et très fortement recommandé pour vos tokens ou mots de passes locaux.

---

## Le `BotClient` et le système de Hooks

Historiquement, les bots Discord éparpillent des dizaines de fichiers `.ts` dans un dossier \`events/\`.
Dans ce boilerplate, tout passe par le **BotClient** et son système de **Hooks chainables**.

Au lieu de gérer des événements lâches, le \`index.ts\` (fichier principal) attache toutes les actions au boot :

\`\`\`ts
// Exemple de flux de démarrage (src/index.ts)
client
.on*ready(async () => { logger.info('Je suis en ligne !'); })
.on_messageCreate(async (message) => { /* Géré par le runner de commandes \_/ })
.on_error(async (error) => { logger.error(error); })
.bindHooks(); // Attache concrètement les hooks configurés au client Discord js

await client.deploy(deployCommands); // Enregistre les Slash Commands via Discord API
await client.login(config.token);
\`\`\`

> Toutes les erreurs survenant au sein d'un de vos hooks sont automatiquement encapsulées (catch) et envoyées vers \`on_error\`. Le bot ne crashera pas de façon inattendue.

---

## Le Logger (Winston)

Jamais de \`console.log\` ! Le logger configuré permet de:

1.  Avoir une vue terminal colorisée.
2.  Sauvegarder les erreurs dans \`logs/error.log\` automatiquement.
3.  S'ajuster dynamiquement via la variable \`LOG_LEVEL=debug|info|warn|error\`.

_Documentation Suivante : [Commandes et Interactions](./commands-interactions.md)_
