# Discord Bot Boilerplate (TypeScript)

A production-ready boilerplate for building Discord bots in TypeScript, focused on modularity and testability.

## Features

- **TypeScript** — strict typing and optimized configuration.
- **Unified Commands** — Prefix and Slash Commands handled through a common structure.
- **Components** — abstractions for Buttons, Modals, and Select Menus.
- **Service Architecture** — separation of business logic from the Discord interface.
- **Database** — Sequelize v6 integration (Postgres, MySQL, SQLite), can be disabled via config.
- **CLI (Make)** — code generators for commands, models, services, and console commands.
- **Tests** — Vitest setup ready for 100% coverage.
- **Localization** — Laravel-like i18n system with a global `__()` helper.
- **Cache** — multi-driver cache system (Memory, File) inspired by Laravel.

## Quick start with npx

The recommended way to start a new project from this template:

```bash
npx @ludoows/create-discord-bot
```

The wizard clones the template, generates a pre-filled `.env`, and runs `npm install` automatically.
See [Scaffolding](./docs/scaffold.md) for details.

## Manual installation

Requires **Node.js v22**.

```bash
nvm use 22

npm install

cp .env.example .env
# Fill in DISCORD_TOKEN and other values

npm run dev
```

## Documentation

| Topic | Description |
| :--- | :--- |
| [Scaffolding](./docs/scaffold.md) | Bootstrap a new project with `npx create-discord-bot` |
| [Architecture](./docs/architecture.md) | Project structure, `BotClient`, and centralized config |
| [Commands & Interactions](./docs/commands-interactions.md) | Slash & Prefix commands, sub-commands, callbacks |
| [Services & HTTP](./docs/services.md) | Business logic separation and external API clients |
| [Database](./docs/database.md) | Sequelize setup, models, and migrations |
| [CLI & Generators](./docs/cli.md) | Code generation with `npm run make` |
| [Testing](./docs/testing.md) | Testing commands and services without a real Discord client |
| [Cache](./docs/cache.md) | Memory and file-based cache drivers |
| [PM2](./docs/pm2.md) | Running the bot in production with process management |
| [Localization](./docs/localization.md) | Multi-language support and string variables |

---

## License

MIT

---

## Scripts

```bash
npm run dev        # Start in watch mode
npm run build      # Compile TypeScript
npm run test       # Run tests
npm run coverage   # Run tests with coverage
npm run command    # Run a console command
```
