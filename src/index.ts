import { BotClient } from "./bot/BotClient";
import { config } from "./config";
import { initDatabase } from "./database";
import { helpLoader } from "./help/HelpLoader";
import { runner } from "./interactions/InteractionRunner";
import {
  deployCommands,
  slashRegistry,
} from "./interactions/SlashInteractionRegistry";
import { logger } from "./utils/logger";
// Trigger l'enregistrement des interactions unifiées
import "./interactions/index";
// Trigger l'enregistrement des services
import "./services/index";
// Trigger la localisation
import { Kernel } from "./console/Kernel";
import "./lang/index";
import { serviceRegistry } from "./services/ServiceRegistry";

export const client = new BotClient();
const kernel = new Kernel();

async function main() {
  await client
    .on_created(async () => {
      helpLoader.boot();
    })
    .on_booting(async () => {
      await initDatabase();
    })
    .on_ready(async () => {
      logger.info(`Bot connecté en tant que ${client.user?.tag}`);
      await serviceRegistry.bootAll();
    })
    .on_messageCreate(async (message) => {
      if (!message.content.startsWith(config.prefix)) return;
      const rawArgs = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/);
      const commandName = rawArgs.shift()?.toLowerCase();

      if (!commandName) return;

      const interaction = runner.get(commandName);
      if (interaction) {
        await interaction.handle(message, rawArgs);
      }
    })
    .on_error(async (error) => {
      logger.error("Erreur attrapée par le client :", error);
    })
    .on_booted(async () => {
      kernel.startScheduler();
      logger.info("Bot totalement opérationnel.");
    })
    .triggerCreated();

  // Liaison du registre des Slash Commands
  slashRegistry.bind(client);

  client.bindHooks();

  if (config.env !== "test") {
    await client.triggerBooting();
    await client.deploy(deployCommands);
    await client.login(config.token);
    await client.triggerBooted();
  }
}

if (require.main === module) {
  main().catch((err) => {
    logger.error("Fatal Initialization Error", err);
    process.exit(1);
  });
}
