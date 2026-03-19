import { Message, PermissionResolvable } from "discord.js";
import { config } from "../config";
import { helpLoader } from "../help/HelpLoader";
import { logger } from "../utils/logger";
import { PermissionManager } from "../utils/PermissionManager";
import { translator } from "../utils/Translator";

export interface ParsedInput {
  args: Record<string, string | null>;
  options: Record<string, string | boolean | null>;
}

export interface InteractionCallbacks {
  beforeExecute?: (message: Message, input: ParsedInput) => Promise<void>;
  afterExecute?: (message: Message, input: ParsedInput) => Promise<void>;
  onPrefixExecute?: (message: Message, input: ParsedInput) => Promise<void>;
  onError?: (message: Message, error: Error) => Promise<void>;
}

export abstract class Interaction {
  protected abstract signature: string;
  public description = "No description";

  protected permissions: PermissionResolvable[] = [];
  protected roles: string[] = [];
  protected subPermissions: Record<string, PermissionResolvable[]> = {};
  protected subRoles: Record<string, string[]> = {};

  protected callbacks: InteractionCallbacks = {};

  public beforeExecute(
    fn: (message: Message, input: ParsedInput) => Promise<void>,
  ): this {
    this.callbacks.beforeExecute = fn;
    return this;
  }

  public afterExecute(
    fn: (message: Message, input: ParsedInput) => Promise<void>,
  ): this {
    this.callbacks.afterExecute = fn;
    return this;
  }

  public onPrefixExecute(
    fn: (message: Message, input: ParsedInput) => Promise<void>,
  ): this {
    this.callbacks.onPrefixExecute = fn;
    return this;
  }

  public onError(fn: (message: Message, error: Error) => Promise<void>): this {
    this.callbacks.onError = fn;
    return this;
  }

  public getName(): string {
    const parts = this.signature.split(" ");
    const firstPart = parts[0];
    return firstPart.split(":")[0].toLowerCase();
  }

  public getSubcommandNames(): string[] {
    const parts = this.signature.split(" ");
    const firstPart = parts[0];
    if (firstPart.includes(":")) {
      return firstPart
        .split(":")[1]
        .split(",")
        .map((s) => s.toLowerCase());
    }
    return [];
  }

  public getHelp(): string {
    const name = this.getName();
    if (helpLoader.has(name)) {
      return helpLoader.get(name)!;
    }

    let help = `## ${name}\n\n${this.description}\n\n**Usage**\n${config.prefix}${this.signature.split(":")[0]}`;
    const subcommands = this.getSubcommandNames();
    if (subcommands.length > 0) {
      help += `\n\n**Sous-commandes**\n`;
      subcommands.forEach((sub) => {
        help += `- \`${sub}\`\n`;
      });
    }
    return help;
  }

  public parseInput(rawArgs: string[]): ParsedInput {
    const parts = this.signature.split(" ").slice(1);
    const input: ParsedInput = { args: {}, options: {} };

    let argIndex = 0;

    // Parse signature
    for (const part of parts) {
      if (part.startsWith("{--") && part.endsWith("=}")) {
        const optName = part.slice(3, -2);
        input.options[optName] = null;
      } else if (part.startsWith("{--") && part.endsWith("}")) {
        const flagName = part.slice(3, -1);
        input.options[flagName] = false;
      } else if (part.startsWith("{") && part.endsWith("}")) {
        let argName = part.slice(1, -1);
        let defaultVal: string | null = null;
        let optional = false;

        if (argName.includes("=")) {
          const split = argName.split("=");
          argName = split[0];
          defaultVal = split.slice(1).join("=");
          optional = true;
        }

        if (argName.endsWith("?")) {
          argName = argName.slice(0, -1);
          optional = true;
        }

        input.args[argName] = defaultVal;
      }
    }

    // Fill from rawArgs
    for (let i = 0; i < rawArgs.length; i++) {
      const arg = rawArgs[i];
      if (arg.startsWith("--")) {
        if (arg.includes("=")) {
          const [key, val] = arg.slice(2).split("=");
          if (key in input.options) {
            input.options[key] = val;
          }
        } else {
          const key = arg.slice(2);
          if (key in input.options) {
            if (input.options[key] === false || input.options[key] === true) {
              input.options[key] = true;
            } else if (
              i + 1 < rawArgs.length &&
              !rawArgs[i + 1].startsWith("--")
            ) {
              input.options[key] = rawArgs[i + 1];
              i++;
            }
          }
        }
      } else {
        const argKeys = Object.keys(input.args);
        if (argIndex < argKeys.length) {
          input.args[argKeys[argIndex]] = arg;
          argIndex++;
        }
      }
    }

    // Validate required positional args
    const argDefs = parts.filter(
      (p) => p.startsWith("{") && !p.startsWith("{--"),
    );
    for (const def of argDefs) {
      if (!def.includes("?") && !def.includes("=")) {
        const key = def.slice(1, -1);
        if (input.args[key] === null || input.args[key] === undefined) {
          throw new Error(`Missing required argument: ${key}`);
        }
      }
    }

    return input;
  }

  protected async replyEphemeral(message: Message, content: string) {
    const msg = await message.reply({ content });
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 5000);
  }

  public authorize(message: Message, subName?: string): boolean {
    let checkPerms = [...this.permissions];
    let checkRoles = [...this.roles];

    if (subName) {
      if (this.subPermissions[subName]) {
        checkPerms = checkPerms.concat(this.subPermissions[subName]);
      }
      if (this.subRoles[subName]) {
        checkRoles = checkRoles.concat(this.subRoles[subName]);
      }
    }

    const result = PermissionManager.check(message.member, {
      permissions: checkPerms,
      roles: checkRoles,
    });

    if (!result.allowed) {
      this.replyEphemeral(message, result.reason || "Accès refusé.");
      return false;
    }

    return true;
  }

  public async handle(message: Message, args: string[]): Promise<void> {
    try {
      if (args[0] === "--help") {
        await message.reply(this.getHelp());
        return;
      }

      const subcommands = this.getSubcommandNames();
      const possibleSubcmd = args[0];
      let subName: string | undefined = undefined;
      let rawArgs = args;

      if (subcommands.includes(possibleSubcmd)) {
        subName = possibleSubcmd;
        rawArgs = args.slice(1);
      }

      if (!this.authorize(message, subName)) {
        return;
      }

      const locale = message.guild?.preferredLocale || "fr";

      await translator.runWithLocale(locale, async () => {
        const input = this.parseInput(rawArgs);

        if (this.callbacks.beforeExecute) {
          await this.callbacks.beforeExecute(message, input);
        }

        if (this.callbacks.onPrefixExecute) {
          await this.callbacks.onPrefixExecute(message, input);
        }

        if (subName) {
          const method = (this as any)[subName];
          if (typeof method === "function") {
            await method.call(this, message, input);
          } else {
            throw new Error(`Subcommand method ${subName} is not implemented.`);
          }
        } else {
          await this.execute(message, input);
        }

        if (this.callbacks.afterExecute) {
          await this.callbacks.afterExecute(message, input);
        }
      });
    } catch (e: any) {
      logger.error(`Error in Interaction.handle: ${e.message}`, e);
      if (this.callbacks.onError) {
        try {
          await this.callbacks.onError(message, e);
        } catch (cbErr) {
          logger.error(cbErr);
        }
      } else {
        await this.replyEphemeral(
          message,
          `Une erreur s'est produite: ${e.message}`,
        );
      }
    }
  }

  public abstract execute(
    message: Message | null,
    input: ParsedInput,
  ): Promise<void>;
}
