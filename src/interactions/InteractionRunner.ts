import { Message } from "discord.js";
import { logger } from "../utils/logger";
import { Interaction } from "./Interaction";

class InteractionRunner {
  private interactions = new Map<string, Interaction>();

  public registerAll(interactions: Interaction[]) {
    for (const interaction of interactions) {
      this.interactions.set(interaction.getName(), interaction);
    }
  }

  public get(name: string): Interaction | undefined {
    return this.interactions.get(name);
  }

  public buildRawArgs(opts: {
    args: Record<string, string>;
    options: Record<string, string | boolean>;
  }): string[] {
    const raw: string[] = [];

    for (const val of Object.values(opts.args)) {
      if (val) raw.push(val);
    }

    for (const [key, val] of Object.entries(opts.options)) {
      if (val === true) {
        raw.push(`--${key}`);
      } else if (val !== false && val !== null) {
        raw.push(`--${key}=${val}`);
      }
    }
    return raw;
  }

  public async call(
    name: string,
    opts: {
      args: Record<string, string>;
      options: Record<string, string | boolean>;
    },
    message: Message,
  ): Promise<void> {
    const interaction = this.interactions.get(name);
    if (!interaction) {
      logger.warn(`InteractionRunner: Command ${name} not found`);
      return;
    }

    const rawArgs = this.buildRawArgs(opts);
    await interaction.handle(message, rawArgs);
  }

  public async callSilent(
    name: string,
    opts: {
      args: Record<string, string>;
      options: Record<string, string | boolean>;
    },
  ): Promise<void> {
    const interaction = this.interactions.get(name);
    if (!interaction) {
      logger.warn(`InteractionRunner: Command ${name} not found`);
      return;
    }

    const rawArgs = this.buildRawArgs(opts);
    const input = interaction.parseInput(rawArgs);
    try {
      await interaction.execute(null, input);
    } catch (e: any) {
      logger.error(`Error in callSilent for ${name}`, e);
    }
  }
}

export const runner = new InteractionRunner();
