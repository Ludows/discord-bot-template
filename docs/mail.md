# Mail (Envoi d'e-mails)

Le bot intègre un système d'envoi d'e-mails flexible et modulaire, fortement inspiré de Laravel, permettant d'utiliser des classes `Mailable` et différents chauffeurs (SMTP, Log).

## Structure

- `src/mail/Mail.ts` : Façade principale pour l'envoi.
- `src/mail/Mailable.ts` : Classe de base abstraite pour définir vos e-mails.
- `src/mail/transports/` : Contient les implémentations des différents chauffeurs (SMTP, Log).

## Configuration

La configuration se trouve dans `src/config.ts` sous la clé `mail`. Vous pouvez définir le chauffeur par défaut via la variable d'environnement `MAIL_MAILER` (valeurs possibles : `smtp`, `log`).

```typescript
mail: {
  default: process.env.MAIL_MAILER || "log",
  from: {
    address: process.env.MAIL_FROM_ADDRESS || "hello@example.com",
    name: process.env.MAIL_FROM_NAME || "TrumpBot",
  },
  // ... configuration des mailers
}
```

## Création d'un Mailable

Pour envoyer un e-mail, créez une classe qui étend `Mailable` et implémentez la méthode `build()`.

```typescript
import { Mailable } from "../mail/Mailable";

export class OrderShipped extends Mailable {
  constructor(private order: any) {
    super();
  }

  public build(): void {
    this.subject("Votre commande est en route !")
      .html(
        `<h1>Commande #${this.order.id}</h1><p>Votre colis a été expédié.</p>`,
      )
      .attach("invoice.pdf", bufferFacture);
  }
}
```

## Envoi d'e-mails

Utilisez la façade `Mail` pour envoyer vos mailables de manière fluide.

```typescript
import { Mail } from "./mail/Mail";
import { OrderShipped } from "./mail/OrderShipped";

// Envoi simple
await Mail.to("client@example.com").send(new OrderShipped(order));

// Destinataires multiples
await Mail.to(["admin@example.com", "sales@example.com"]).send(
  new OrderShipped(order),
);
```

## Chauffeurs disponibles

### Log (`log`)

Utilisé par défaut en développement. Il n'envoie pas d'e-mail réel mais affiche le contenu (sujet, destinataires, corps, pièces jointes) dans la console.

### SMTP (`smtp`)

Utilise `nodemailer` pour envoyer des e-mails via un serveur SMTP. Nécessite les variables `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` et `MAIL_PASSWORD`.

## Pièces jointes

La méthode `attach()` accepte un nom de fichier, le contenu (string ou Buffer) et optionnellement le type MIME.

```typescript
this.attach("rapport.txt", "Contenu du rapport");
```
