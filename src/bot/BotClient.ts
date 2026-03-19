import {
  Client,
  ClientOptions,
  Events,
  GuildMember,
  Message,
} from "discord.js";
import { logger } from "../utils/logger";

export class BotClient extends Client {
  private hooks: {
    onReady: ((client: BotClient) => Promise<void>)[];
    onMessageCreate: ((message: Message) => Promise<void>)[];
    onMemberJoin: ((member: GuildMember) => Promise<void>)[];
    onMemberLeave: ((member: GuildMember) => Promise<void>)[];
    onError: ((error: Error) => Promise<void>)[];
    onBeforeDeploy: (() => Promise<void>)[];
    onAfterDeploy: (() => Promise<void>)[];
    onCreated: ((client: BotClient) => Promise<void>)[];
    onBooting: ((client: BotClient) => Promise<void>)[];
    onBooted: ((client: BotClient) => Promise<void>)[];
  } = {
    onReady: [],
    onMessageCreate: [],
    onMemberJoin: [],
    onMemberLeave: [],
    onError: [],
    onBeforeDeploy: [],
    onAfterDeploy: [],
    onCreated: [],
    onBooting: [],
    onBooted: [],
  };

  constructor(options?: ClientOptions) {
    super(
      options || {
        intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
      },
    );
  }

  public on_ready(fn: (client: BotClient) => Promise<void>): this {
    this.hooks.onReady.push(fn);
    return this;
  }

  public on_messageCreate(fn: (message: Message) => Promise<void>): this {
    this.hooks.onMessageCreate.push(fn);
    return this;
  }

  public on_memberJoin(fn: (member: GuildMember) => Promise<void>): this {
    this.hooks.onMemberJoin.push(fn);
    return this;
  }

  public on_memberLeave(fn: (member: GuildMember) => Promise<void>): this {
    this.hooks.onMemberLeave.push(fn);
    return this;
  }

  public on_error(fn: (error: Error) => Promise<void>): this {
    this.hooks.onError.push(fn);
    return this;
  }

  public on_beforeDeploy(fn: () => Promise<void>): this {
    this.hooks.onBeforeDeploy.push(fn);
    return this;
  }

  public on_afterDeploy(fn: () => Promise<void>): this {
    this.hooks.onAfterDeploy.push(fn);
    return this;
  }

  public on_created(fn: (client: BotClient) => Promise<void>): this {
    this.hooks.onCreated.push(fn);
    return this;
  }

  public on_booting(fn: (client: BotClient) => Promise<void>): this {
    this.hooks.onBooting.push(fn);
    return this;
  }

  public on_booted(fn: (client: BotClient) => Promise<void>): this {
    this.hooks.onBooted.push(fn);
    return this;
  }

  private async handleError(error: Error) {
    if (this.hooks.onError.length > 0) {
      for (const handler of this.hooks.onError) {
        try {
          await handler(error);
        } catch (e) {
          logger.error(`Error in on_error hook:`, e);
        }
      }
    } else {
      logger.error("Unhandled error:", error);
    }
  }

  public bindHooks(): this {
    this.on(Events.ClientReady, async () => {
      for (const handler of this.hooks.onReady) {
        try {
          await handler(this);
        } catch (e: any) {
          await this.handleError(e);
        }
      }
    });

    this.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      for (const handler of this.hooks.onMessageCreate) {
        try {
          await handler(message);
        } catch (e: any) {
          await this.handleError(e);
        }
      }
    });

    this.on(Events.GuildMemberAdd, async (member) => {
      for (const handler of this.hooks.onMemberJoin) {
        try {
          await handler(member as GuildMember);
        } catch (e: any) {
          await this.handleError(e);
        }
      }
    });

    this.on(Events.GuildMemberRemove, async (member) => {
      for (const handler of this.hooks.onMemberLeave) {
        try {
          await handler(member as GuildMember);
        } catch (e: any) {
          await this.handleError(e);
        }
      }
    });

    this.on(Events.Error, async (error) => {
      await this.handleError(error);
    });

    return this;
  }

  public async deploy(deployFn: () => Promise<void>): Promise<void> {
    try {
      for (const handler of this.hooks.onBeforeDeploy) {
        await handler();
      }
      await deployFn();
      for (const handler of this.hooks.onAfterDeploy) {
        await handler();
      }
    } catch (e: any) {
      await this.handleError(e);
    }
  }

  public async triggerCreated(): Promise<this> {
    for (const handler of this.hooks.onCreated) {
      await handler(this);
    }
    return this;
  }

  public async triggerBooting(): Promise<this> {
    for (const handler of this.hooks.onBooting) {
      await handler(this);
    }
    return this;
  }

  public async triggerBooted(): Promise<this> {
    for (const handler of this.hooks.onBooted) {
      await handler(this);
    }
    return this;
  }
}
