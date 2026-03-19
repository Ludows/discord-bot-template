# Scaffolding — create-discord-bot

The fastest way to start a new project from this template is to use the official `create-discord-bot` CLI.

## Usage

```bash
npx create-discord-bot
```

No prior installation is required.

## Prompts

The interactive wizard asks 5 questions:

| Prompt | Available choices |
| :--- | :--- |
| Project name | Free text (converted to a slug) |
| Database dialect | `mysql` · `postgres` · `sqlite` · None |
| Cache driver | `file` (persistent) · `memory` (volatile) |
| Include mail system? | Yes · No |
| Default language | `fr` · `en` |

## What gets generated

Once the prompts are answered, the CLI:

1. Clones the template from GitHub (no git history)
2. Renames the project in `package.json`
3. Generates a pre-filled `.env` file based on your answers
4. Removes `src/mail/` if mail was not selected
5. Removes `src/database/` if no database was selected
6. Runs `npm install`

## Next steps

```bash
cd my-project

# Fill in the missing values in .env
# (DISCORD_TOKEN, DISCORD_CLIENT_ID, database credentials…)

npm run dev
```

## Publishing a new version

The CLI source lives in `packages/create-discord-bot/`.

```bash
cd packages/create-discord-bot
npm run build
npm publish
```
