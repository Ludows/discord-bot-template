# Système de Cache (Laravel-like)

Le boilerplate inclut un système de cache permettant de stocker des données temporaires en mémoire ou sur le système de fichiers.

## 1. Configuration

Dans votre `.env`, configurez le driver et le chemin de stockage :

```env
CACHE_DRIVER=memory # 'memory' ou 'file'
CACHE_PATH=./storage/cache # Requis pour le driver 'file'
```

## 2. Utilisation

Le cache est un singleton accessible via l'objet `cache`.

```ts
import { cache } from '../utils/cache/Cache';

// Stockage (TTL en secondes)
await cache.put('key', { data: true }, 3600);

// Récupération
const val = await cache.get('key');

// Vérification
if (await cache.has('key')) { ... }

// Suppression
await cache.forget('key');

// Nettoyage complet
await cache.flush();
```

## 3. Méthode `remember()`

Cette méthode permet de récupérer une valeur ou de l'initialiser via un callback si elle est absente ou expirée.

```ts
const user = await cache.remember("user:123", 3600, async () => {
  return await userService.findById("123");
});
```

## 4. Drivers disponibles

### Memory Driver (`memory`)

- **Vitesse** : Accès mémoire directs.
- **Persistance** : Aucune (perdu au redémarrage).
- **Usage** : Données volatiles, cache de session court.

### File Driver (`file`)

- **Vitesse** : E/S disque.
- **Persistance** : Oui.
- **Usage** : Données devant persister entre les redémarrages.

## 5. Tests

Le cache peut être testé sans mocking lourd en utilisant la méthode `flush()` entre chaque test.

```ts
beforeEach(async () => {
  await cache.flush();
});

it("example", async () => {
  await cache.put("test", 1);
});
```
