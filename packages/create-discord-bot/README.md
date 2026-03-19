# create-discord-bot

CLI to scaffold a new project from the [discord-bot-template](https://github.com/Ludows/discord-bot-template).

## Usage

```bash
npx create-discord-bot
```

No installation required.

## Prompts

| Prompt | Choices |
| :--- | :--- |
| Project name | Free text (converted to a slug) |
| Database dialect | `mysql` · `postgres` · `sqlite` · None |
| Cache driver | `file` · `memory` |
| Include mail system? | Yes · No |
| Default language | `fr` · `en` |

## What it does

1. Clones the template from GitHub (no git history)
2. Renames the project in `package.json`
3. Generates a pre-filled `.env` based on your answers
4. Updates the default locale in `src/config.ts`
5. Runs `npm install`

## Requirements

- Node.js >= 18

## License

MIT
