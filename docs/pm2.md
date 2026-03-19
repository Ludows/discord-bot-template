# Gestion des Processus (PM2)

Pour garantir que votre bot reste en ligne 24h/24 et redémarre automatiquement en cas de crash, le projet intègre **PM2**.

## 1. Pourquoi utiliser PM2 ?

- **Auto-restart** : Si une exception non gérée fait crasher Node.js, PM2 relance le bot instantanément.
- **Monitoring** : Surveillez la consommation de RAM et de CPU.
- **Logs persistants** : Les sorties console sont sauvegardées dans des fichiers de logs.
- **Gestion au reboot** : Capacité de relancer le bot automatiquement après un redémarrage du serveur (VPS).

## 2. Commandes disponibles

Des scripts npm sont pré-configurés pour simplifier l'usage :

- `npm run start:prod` : Démarre le bot en arrière-plan via PM2.
- `npm run logs` : Affiche les logs en temps réel.

### Commandes PM2 utiles (si installé globalement) :

Si vous avez installé pm2 globalement (`npm install pm2 -g`), vous pouvez aussi utiliser :

- `pm2 status` : Liste les processus actifs.
- `pm2 stop trumpbot` : Arrête le bot.
- `pm2 restart trumpbot` : Redémarre manuellement.
- `pm2 delete trumpbot` : Supprime le processus de la liste.

## 3. Configuration (`ecosystem.config.js`)

Le fichier de configuration à la racine permet de définir :

- Le nom de l'application.
- Le chemin du script de démarrage (`./dist/index.js`).
- La limite de mémoire avant redémarrage automatique (`1G` par défaut).
- Les chemins des fichiers de logs (`./logs/`).

## 4. Recommandation Production

Il est conseillé d'utiliser PM2 conjointement avec un build propre de votre projet :

```bash
npm run build
npm run start:prod
```
