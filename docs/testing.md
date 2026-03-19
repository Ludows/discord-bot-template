# Stratégies de Tests

Le projet est configuré pour viser 100% de couverture de code (Code Coverage) avec **Vitest**.

## 1. Principes de test

- Isoler les appels réseau et les accès disque.
- Utiliser le mocking par couche métier.
- **Attention au coverage** : Éviter de mocker globalement les utilitaires (comme `logger.ts`) dans `setup.ts`. Un mock global empêche Vitest de tracker l'exécution du code original, ce qui fausse le rapport de couverture.

Les mocks doivent être réinitialisés (`vi.clearAllMocks()`) dans les blocs `beforeEach`.

## 2. Configuration (`vitest.config.ts`)

L'environnement utilise le provider `v8` pour la couverture. Les rapports sont générés en format `text` (console) et HTML (`lcov`).

Commandes de test :

```bash
nvm use 22
npm run test
npm run coverage
```

## 3. Stratégie de Mocking

### A. HTTP (HttpClient)

Utilisez `axios-mock-adapter` sur l'instance Axios interne (`client.client`).

### B. Interactions (Discord)

Il est conseillé de simuler les interactions à l'aide d'objets (duck-typing) correspondant à l'interface de Discord.js.
L'objet mocké est ensuite passé à la méthode `.handle()` ou `.execute()`.

### C. Base de données (Services)

Utilisez `vi.mock()` sur les modèles Sequelize.

```ts
vi.mock("../../src/database/models/User", () => ({
  User: { create: vi.fn(), findOne: vi.fn() },
}));
```

## 4. Génération de tests via CLI

L'outil **Make** peut générer des squelettes de tests pré-configurés :

```bash
npm run make test:slash-interaction CommandeName
```
