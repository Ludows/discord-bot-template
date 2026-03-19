import { Interaction as DiscordInteraction, REST, Routes } from "discord.js";
import { BotClient } from "../bot/BotClient";
import { config } from "../config";
import { logger } from "../utils/logger";
import { SlashInteraction } from "./SlashInteraction";

class SlashInteractionRegistry {
  private interactions = new Map<string, SlashInteraction>();

  public registerAll(interactions: SlashInteraction[]) {
    for (const interaction of interactions) {
      this.interactions.set(interaction.getName(), interaction);
    }
  }

  public toJSON() {
    return Array.from(this.interactions.values()).map((i) =>
      i.toSlashCommand().toJSON(),
    );
  }

  public bind(client: BotClient) {
    client.on("interactionCreate", async (interaction: DiscordInteraction) => {
      if (interaction.isChatInputCommand()) {
        const cmd = this.interactions.get(interaction.commandName);
        if (cmd) {
          await cmd.handleSlash(interaction);
        }
      } else if (interaction.isAutocomplete()) {
        const cmd = this.interactions.get(interaction.commandName);
        if (cmd) {
          await cmd.handleAutocomplete(interaction);
        }
      } else if (interaction.isButton()) {
        const cmdName = interaction.customId.split(":")[0];
        const cmd = this.interactions.get(cmdName);
        if (cmd) {
          let handler = cmd.buttons.get(interaction.customId);
          if (!handler) {
            for (const [key, h] of cmd.buttons.entries()) {
              if (interaction.customId.startsWith(key)) {
                handler = h;
                break;
              }
            }
          }
          if (handler) {
            await cmd.handleComponent(interaction, handler);
          }
        }
      } else if (interaction.isModalSubmit()) {
        const cmdName = interaction.customId.split(":")[0];
        const cmd = this.interactions.get(cmdName);
        if (cmd && cmd.modals.has(interaction.customId)) {
          await cmd.handleComponent(
            interaction,
            cmd.modals.get(interaction.customId)!,
          );
        }
      } else if (interaction.isStringSelectMenu()) {
        const cmdName = interaction.customId.split(":")[0];
        const cmd = this.interactions.get(cmdName);
        if (cmd && cmd.selectMenus.has(interaction.customId)) {
          await cmd.handleComponent(
            interaction,
            cmd.selectMenus.get(interaction.customId)!,
          );
        }
      }
    });
  }
}

export const slashRegistry = new SlashInteractionRegistry();

export async function deployCommands() {
  if (!config.token || !config.clientId) {
    logger.warn(
      "Token ou Client ID manquant, le déploiement des Slash Commands est ignoré.",
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    logger.info("Déploiement des Slash Commands...");
    const data = slashRegistry.toJSON();
    if (config.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: data },
      );
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: data,
      });
    }
    logger.info("Slash Commands déployées avec succès.");
  } catch (e) {
    logger.error("Erreur lors du déploiement des commandes", e);
  }
}
