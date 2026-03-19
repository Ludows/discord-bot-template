import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotClient } from "../../src/bot/BotClient";
import { config } from "../../src/config";
import { SlashInteraction } from "../../src/interactions/SlashInteraction";
import {
  deployCommands,
  slashRegistry,
} from "../../src/interactions/SlashInteractionRegistry";

vi.mock("discord.js", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    REST: class {
      setToken() {
        return this;
      }
      put(url: any, data: any) {
        if (
          data?.body &&
          data.body.length > 0 &&
          data.body[0].name === "fail_me"
        ) {
          return Promise.reject(new Error("api fail"));
        }
        return Promise.resolve(true);
      }
    },
  };
});

class MockSlashCmd extends SlashInteraction {
  protected signature = "test";
  public executeSlash = vi.fn();
  public handleSlash = vi.fn();
  public handleAutocomplete = vi.fn();
  public handleComponent = vi.fn();

  constructor() {
    super();
    this.buttons.set("test:btn", vi.fn());
    this.modals.set("test:mod", vi.fn());
    this.selectMenus.set("test:sel", vi.fn());
  }
}

class FailSlashCmd extends SlashInteraction {
  protected signature = "fail_me";
  public executeSlash = vi.fn();
}

describe("SlashInteractionRegistry", () => {
  let client: BotClient;
  let mock: MockSlashCmd;

  beforeEach(() => {
    client = new BotClient();
    mock = new MockSlashCmd();
    // clear interactions from previous tests
    (slashRegistry as any).interactions.clear();
    slashRegistry.registerAll([mock]);
    slashRegistry.bind(client);
    vi.clearAllMocks();
  });

  it("toJSON serialise tout de manière exhaustive", () => {
    const json = slashRegistry.toJSON();
    expect(json.length).toBeGreaterThan(0);
    expect(json[0].name).toBe("test");
  });

  const emitType = async (type: string, name: string, customId?: string) => {
    const interaction: any = {
      isChatInputCommand: () => type === "chat",
      isAutocomplete: () => type === "auto",
      isButton: () => type === "button",
      isModalSubmit: () => type === "modal",
      isStringSelectMenu: () => type === "select",
      commandName: name,
      customId: customId,
    };
    client.emit("interactionCreate", interaction);
    await new Promise((r) => setTimeout(r, 10)); // wait for event loop
  };

  it("binds isChatInputCommand", async () => {
    await emitType("chat", "test");
    expect(mock.handleSlash).toHaveBeenCalled();
  });

  it("ignores isChatInputCommand if unknown", async () => {
    await emitType("chat", "unknown");
    expect(mock.handleSlash).not.toHaveBeenCalled();
  });

  it("binds isAutocomplete", async () => {
    await emitType("auto", "test");
    expect(mock.handleAutocomplete).toHaveBeenCalled();
  });

  it("ignores isAutocomplete if unknown", async () => {
    await emitType("auto", "unknown");
    expect(mock.handleAutocomplete).not.toHaveBeenCalled();
  });

  it("binds isButton", async () => {
    await emitType("button", "", "test:btn");
    expect(mock.handleComponent).toHaveBeenCalled();
  });

  it("ignores isButton if unknown", async () => {
    await emitType("button", "", "test:unknown");
    expect(mock.handleComponent).not.toHaveBeenCalled();
  });

  it("binds isModalSubmit", async () => {
    await emitType("modal", "", "test:mod");
    expect(mock.handleComponent).toHaveBeenCalled();
  });

  it("ignores isModalSubmit if unknown", async () => {
    await emitType("modal", "", "test:unknown");
    expect(mock.handleComponent).not.toHaveBeenCalled();
  });

  it("binds isStringSelectMenu", async () => {
    await emitType("select", "", "test:sel");
    expect(mock.handleComponent).toHaveBeenCalled();
  });

  it("ignores isStringSelectMenu if unknown", async () => {
    await emitType("select", "", "test:unknown");
    expect(mock.handleComponent).not.toHaveBeenCalled();
  });
});

describe("deployCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("warns if token is missing", async () => {
    const t = config.token;
    (config as any).token = "";
    await deployCommands();
    (config as any).token = t;
  });

  it("deploys with guildId", async () => {
    const t = config.token;
    const c = config.clientId;
    const g = config.guildId;
    (config as any).token = "mock";
    (config as any).clientId = "mock_client";
    (config as any).guildId = "123";

    await deployCommands();
    (config as any).token = t;
    (config as any).clientId = c;
    (config as any).guildId = g;
  });

  it("deploys without guildId (global)", async () => {
    const t = config.token;
    const c = config.clientId;
    const g = config.guildId;
    (config as any).token = "mock";
    (config as any).clientId = "mock_client";
    (config as any).guildId = "";

    await deployCommands();
    (config as any).token = t;
    (config as any).clientId = c;
    (config as any).guildId = g;
  });

  it("catches deployment error", async () => {
    const t = config.token;
    const c = config.clientId;
    (config as any).token = "mock";
    (config as any).clientId = "mock_client";

    // Register failing mock
    const fail = new FailSlashCmd();
    (slashRegistry as any).interactions.clear();
    slashRegistry.registerAll([fail]);

    // This will call the mocked REST and throw
    await deployCommands();

    (config as any).token = t;
    (config as any).clientId = c;
  });
});
