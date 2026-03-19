# Localisation (i18n)

Le bot utilise un système de localisation inspiré de Laravel pour gérer les messages multilingues.

## Structure

- `src/utils/Translator.ts` : Moteur de traduction.
- `src/utils/helpers.ts` : Contient le helper global `__()`.
- `src/lang/` : Dossier contenant les fichiers de traduction (`fr.ts`, `en.ts`).

## Utilisation

Importez le helper `__` (ou assurez-vous qu'il est disponible via votre configuration d'importation) :

```typescript
import { __ } from "../utils/helpers";

// Utilisation simple
const message = __("messages.success");

// Avec remplacement de variables
const welcome = __("messages.welcome", { name: "Dayle" });
// Retourne : "Bienvenue, Dayle !" (si locale=fr)
```

## Ajouter une langue

1. Créez un fichier `src/lang/xx.ts` (en suivant le modèle `fr.ts`).
2. Enregistrez-le dans `src/lang/index.ts` :

```typescript
import { xx } from "./xx";
translator.register("xx", xx);
```

## Changer la locale

Vous pouvez changer la langue courante via le singleton `translator` :

```typescript
import { translator } from "./utils/Translator";
translator.setLocale("en");
```

## Syntaxe des fichiers

Les fichiers utilisent des objets imbriqués pour permettre la notation par points (`messages.welcome`). Les variables sont préfixées par `:` dans les chaînes de caractères.

```typescript
export const fr = {
  messages: {
    welcome: "Bonjour :name",
  },
};
```
