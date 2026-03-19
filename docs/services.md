# Services et HTTP

La logique métier de l'application est centralisée dans les **Services**.

Une Interaction Discord doit uniquement gérer la requête utilisateur et retourner une réponse. Le traitement est délégué au Service.

## 1. Classe de base `Service`

Chaque service que vous créez (dans `src/services/`) se doit d'étendre la classe abstraite `Service`. Cela vous accorde immédiatement de puissantes fonctionnalités.

\`\`\`ts
// Exemple généré via `npm run make service Users`
class UsersService extends Service {
public async boot() {
// Initialisation exécutée au moment de bootler le client (facultatif)
}

public async processNewUser(userId: string) {
this.log(`Création d'un nouvel utilisateur : ${userId}`);
// Code...
if (userId.startsWith('1')) {
this.fail('Les utilisateurs 1 ne sont pas acceptés');
}
}
}
\`\`\`

- `this.log(...)` : Log préfixé par \`[SERVICE:Nom]\`.
- `this.fail(...)` : Log une erreur et lance une exception.
- `this.transaction(...)` : Encapsule la logique dans une transaction Sequelize avec rollback automatique en cas d'erreur.

### Règle des transactions

1. Opération de lecture (`findAll`, `findOne`) -> Méthode standard.
2. Écritures (`create`, `update`, `destroy`) -> Toujours enveloppées via `this.transaction()`.

## 2. Connecteurs Externes (`HttpClient`)

Si votre bot Discord a besoin de requêter une API Externe (Stripe, GitHub, etc.), **n'utilisez pas axios n'importe où.**

La façon métier propre est de créer un adaptateur étendant `HttpClient` se situant dans `src/http/endpoints/`. Le boilerplate vous fournit déjà l'intercepteur de log Request et Response pour tracker globalement toutes vos API.

\`\`\`ts
// Exemple généré via `npm run make http Github`
class GithubApi extends HttpClient {
constructor() {
// Initialise le baseURL par défaut pour tous les appels suivants
super('https://api.github.com');
}

public async fetchUser(username: string): Promise<GithubUser> {
// Fera un GET sur api.github.com/users/cointrel avec un formatage typé
return this.get<GithubUser>(`/users/${username}`);
}
}
\`\`\`

Le `HttpClient` mock très facilement la librairie interne (\`axios\`) pour vos tests, grâce à l'implémentation de `axios-mock-adapter`. Les `Interaction` n'auront jamais à se soucier de l'origine de l'API.

_Documentation Suivante : [Base de Données](./database.md)_
