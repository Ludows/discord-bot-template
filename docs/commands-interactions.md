# Commandes et Interactions

Ce boilerplate propose un système de gestion des commandes unifié.

## 1. Utilisation de `SlashInteraction`

L'utilisation de la classe **`SlashInteraction`** est recommandée pour gérer les différentes formes d'interactions au même endroit. Elle permet de répondre à :

- Aux Slash Commands Discord.
- Aux Prefix Commands (ex: `!ping`).
- Aux composants attachés (Boutons, Modals, Select Menus).

## 2. Signature des commandes

Le framework utilise un parser de signature pour définir le nom, les arguments et les flags :

\`\`\`ts
protected signature = "ban:add,remove {user} {reason?} {--silent}";
\`\`\`

| Syntaxe       | Description        | Fonctionnement                         |
| :------------ | :----------------- | :------------------------------------- |
| `ban`         | Nom principal      | Déclenché par `/ban` ou `!ban`.        |
| `:add,remove` | Sous-commandes     | Active `/ban add` ou `/ban remove`.    |
| `{user}`      | Argument Requis    | Requis pour l'exécution.               |
| `{reason?}`   | Argument Optionnel | `null` si absent.                      |
| `{--silent}`  | Flag booléen       | `false` par défaut, `true` si présent. |

Le `SlashCommandBuilder` est automatiquement généré à partir de cette signature.

## 3. Les Sous-commandes

Lorsqu'une sous-commande est mentionnée dans la signature (exemple \`:add\`), vous n'avez qu'à créer une méthode de la classe portant le même nom. Le routeur s'en occupera tout seul !

\`\`\`ts
import { SlashInteraction, ParsedInput } from '../utils';

class BanInteraction extends SlashInteraction {
protected signature = 'ban:add,remove {user}';

// Appelé si la commande est simplement `/ban` (pas de sous-commande)
public async executeSlash(interaction, input) { ... }

// Appelé si la commande est `/ban add`
public async add(interactionOrMessage: ChatInputCommandInteraction | Message, input: ParsedInput) {
const user = input.args.user;
// InteractionOrMessage permet de gérer la slash ET la prefix !
}
}
\`\`\`

## 4. Composants (Boutons, Modals, Selects)

Fini le routing complexe global. Chaque commande s'abonne à ses propres composants depuis son constructeur.

> ⚠️ Convention de nommage obligatoire : Le \`customId\` de vos composants doit toujours être préfixé par le nom de votre commande, puis séparé par deux points \`:\`. Exemple : \`ban:confirm\`.

\`\`\`ts
constructor() {
super();
// S'abonnera sur un bouton ayant l'ID "ban:confirm"
this.registerButton('ban:confirm', this.onConfirm);
}

private async onConfirm(interaction: ButtonInteraction) {
await interaction.reply({ content: 'Banni !', ephemeral: true });
}
\`\`\`

## 5. Les Permissions et le Markdown Help

Vous pouvez protéger une interaction globale ou une sous-commande très simplement en protégeant les propriétés internes :

\`\`\`ts
protected roles = ['Admin', 'Moderator']; // Accessible seulement avec ces rôles
protected permissions = ['BanMembers']; // Requis: Permission Discord native

protected subRoles = {
add: ['Admin'] // Seul "Admin" peut utiliser /ban add
};
\`\`\`

Si l'utilisateur ne passe pas le `PermissionManager`, la commande refusera silencieusement l'accès via un message éphémère qui disparait après 5 secondes.

> Ce projet intègre aussi un module d'aide "Markdown". Lors de la génération d'une commande via la CLI (`npm run make`), un fichier `.md` est créé dans `src/help/interactions/`. L'utilisateur pourra taper `!ban --help` et le bot lui retournera directement ce fichier s'il a les bonnes permissions.

## 6. Les Callbacks et l'Interception

L'architecture supporte un cycle de vie en chaîne des méthodes (chainables) très puissants :

- `beforeExecute` / `beforeSlashExecute` : Avant que la commande finale s'exécute.
- `afterExecute` / `afterSlashExecute` : Après que la commande se soit exécutée.
- `onError` / `onSlashError` : Remplace le comportement natif de crash par défaut (répondre une erreur) si implémenté.
- `onComponentInteraction` : Déclenché juste avant d'appeler n'importe quel code de bouton ou modal rattaché à cette interaction.

_Documentation Suivante : [Services et HTTP](./services.md)_
