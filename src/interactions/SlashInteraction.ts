import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Message,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { translator } from "../utils/Translator";
import { Interaction, ParsedInput } from "./Interaction";

export interface SlashCallbacks {
  beforeExecute?: (
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ) => Promise<void>;
  afterExecute?: (
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ) => Promise<void>;
  onSlashExecute?: (
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ) => Promise<void>;
  onError?: (
    interaction: ChatInputCommandInteraction,
    error: Error,
  ) => Promise<void>;
  onComponentInteraction?: (
    interaction:
      | ButtonInteraction
      | ModalSubmitInteraction
      | StringSelectMenuInteraction,
  ) => Promise<void>;
}

export abstract class SlashInteraction extends Interaction {
  public buttons = new Map<string, (i: ButtonInteraction) => Promise<void>>();
  public modals = new Map<
    string,
    (i: ModalSubmitInteraction) => Promise<void>
  >();
  public selectMenus = new Map<
    string,
    (i: StringSelectMenuInteraction) => Promise<void>
  >();

  protected slashCallbacks: SlashCallbacks = {};

  public beforeSlashExecute(
    fn: (
      interaction: ChatInputCommandInteraction,
      input: ParsedInput,
    ) => Promise<void>,
  ): this {
    this.slashCallbacks.beforeExecute = fn;
    return this;
  }

  public afterSlashExecute(
    fn: (
      interaction: ChatInputCommandInteraction,
      input: ParsedInput,
    ) => Promise<void>,
  ): this {
    this.slashCallbacks.afterExecute = fn;
    return this;
  }

  public onSlashExecute(
    fn: (
      interaction: ChatInputCommandInteraction,
      input: ParsedInput,
    ) => Promise<void>,
  ): this {
    this.slashCallbacks.onSlashExecute = fn;
    return this;
  }

  public onSlashError(
    fn: (
      interaction: ChatInputCommandInteraction,
      error: Error,
    ) => Promise<void>,
  ): this {
    this.slashCallbacks.onError = fn;
    return this;
  }

  public onComponentInteraction(
    fn: (
      interaction:
        | ButtonInteraction
        | ModalSubmitInteraction
        | StringSelectMenuInteraction,
    ) => Promise<void>,
  ): this {
    this.slashCallbacks.onComponentInteraction = fn;
    return this;
  }

  protected registerButton(
    customId: string,
    handler: (i: ButtonInteraction) => Promise<void>,
  ) {
    this.buttons.set(customId, handler);
  }

  protected registerModal(
    customId: string,
    handler: (i: ModalSubmitInteraction) => Promise<void>,
  ) {
    this.modals.set(customId, handler);
  }

  protected registerSelectMenu(
    customId: string,
    handler: (i: StringSelectMenuInteraction) => Promise<void>,
  ) {
    this.selectMenus.set(customId, handler);
  }

  public getSubcommandDescription(subName: string): string {
    return `Sous-commande ${subName}`;
  }

  public applySubcommandOptions(sub: any, subName: string): any {
    return sub;
  }

  public toSlashCommand(): Omit<
    SlashCommandBuilder,
    "addSubcommand" | "addSubcommandGroup"
  > {
    const builder = new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(this.description);

    if (this.permissions.length > 0) {
      builder.setDefaultMemberPermissions(
        this.permissions.reduce(
          (acc: bigint, perm: any) => acc | BigInt(perm),
          0n,
        ),
      );
    }

    const subcommands = this.getSubcommandNames();

    if (subcommands.length > 0) {
      for (const sub of subcommands) {
        builder.addSubcommand((subBuilder) => {
          const desc = this.getSubcommandDescription(sub);
          subBuilder.setName(sub).setDescription(desc);
          return this.applySubcommandOptions(subBuilder, sub);
        });
      }
    } else {
      const parts = this.signature.split(" ").slice(1);
      for (const part of parts) {
        if (part.startsWith("{--") && part.endsWith("=}")) {
          const optName = part.slice(3, -2);
          builder.addStringOption((opt) =>
            opt
              .setName(optName)
              .setDescription(`Option ${optName}`)
              .setRequired(false),
          );
        } else if (part.startsWith("{--") && part.endsWith("}")) {
          const flagName = part.slice(3, -1);
          builder.addBooleanOption((opt) =>
            opt
              .setName(flagName)
              .setDescription(`Flag ${flagName}`)
              .setRequired(false),
          );
        } else if (part.startsWith("{") && part.endsWith("}")) {
          let argName = part.slice(1, -1);
          let required = true;
          if (argName.endsWith("?")) {
            argName = argName.slice(0, -1);
            required = false;
          } else if (argName.includes("=")) {
            argName = argName.split("=")[0];
            required = false;
          }
          builder.addStringOption((opt) =>
            opt
              .setName(argName)
              .setDescription(`Argument ${argName}`)
              .setRequired(required),
          );
        }
      }
    }

    return builder;
  }

  public parseSlashInput(
    interaction: ChatInputCommandInteraction,
  ): ParsedInput {
    const parts = this.signature.split(" ").slice(1);
    const input: ParsedInput = { args: {}, options: {} };

    for (const part of parts) {
      if (part.startsWith("{--") && part.endsWith("=}")) {
        const optName = part.slice(3, -2);
        input.options[optName] = interaction.options.getString(optName);
      } else if (part.startsWith("{--") && part.endsWith("}")) {
        const flagName = part.slice(3, -1);
        input.options[flagName] =
          interaction.options.getBoolean(flagName) || false;
      } else if (part.startsWith("{") && part.endsWith("}")) {
        let argName = part.slice(1, -1);
        let defaultVal: string | null = null;
        if (argName.endsWith("?")) {
          argName = argName.slice(0, -1);
        } else if (argName.includes("=")) {
          const split = argName.split("=");
          argName = split[0];
          defaultVal = split[1];
        }
        input.args[argName] =
          interaction.options.getString(argName) ?? defaultVal;
      }
    }
    return input;
  }

  public async handleSlash(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    try {
      const subName = interaction.options.getSubcommand(false);
      const locale = interaction.guildLocale || interaction.locale;

      await translator.runWithLocale(locale, async () => {
        const input = this.parseSlashInput(interaction);

        if (this.slashCallbacks.beforeExecute) {
          await this.slashCallbacks.beforeExecute(interaction, input);
        }

        if (this.slashCallbacks.onSlashExecute) {
          await this.slashCallbacks.onSlashExecute(interaction, input);
        }

        if (subName) {
          const method = (this as any)[subName];
          if (typeof method === "function") {
            await method.call(this, interaction, input);
          } else {
            throw new Error(`Subcommand method ${subName} is not implemented.`);
          }
        } else {
          await this.executeSlash(interaction, input);
        }

        if (this.slashCallbacks.afterExecute) {
          await this.slashCallbacks.afterExecute(interaction, input);
        }
      });
    } catch (e: any) {
      if (this.slashCallbacks.onError) {
        await this.slashCallbacks.onError(interaction, e);
      } else {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: `Erreur: ${e.message}`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `Erreur: ${e.message}`,
            ephemeral: true,
          });
        }
      }
    }
  }

  public async handleAutocomplete(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    const subName = interaction.options.getSubcommand(false);
    const focused = interaction.options.getFocused(true);
    const fieldName = focused.name;

    const methodName1 = subName
      ? `autocomplete_${subName}_${fieldName}`
      : `autocomplete_${fieldName}`;
    const methodName2 = `autocomplete_${fieldName}`;

    let method = (this as any)[methodName1] || (this as any)[methodName2];
    if (typeof method === "function") {
      await method.call(this, interaction);
    } else {
      await interaction.respond([]);
    }
  }

  public async handleComponent(
    interaction:
      | ButtonInteraction
      | ModalSubmitInteraction
      | StringSelectMenuInteraction,
    handler: Function,
  ): Promise<void> {
    if (this.slashCallbacks.onComponentInteraction) {
      await this.slashCallbacks.onComponentInteraction(interaction);
    }
    await handler.call(this, interaction);
  }

  public async execute(
    message: Message | null,
    input: ParsedInput,
  ): Promise<void> {
    // Stub optional support for prefix. Overridden in child if wanted
  }

  public abstract executeSlash(
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ): Promise<void>;
}
