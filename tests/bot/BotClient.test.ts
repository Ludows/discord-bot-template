import { Events, GuildMember, Message } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotClient } from "../../src/bot/BotClient";

const emitEvent = (client: BotClient, event: string, ...args: any[]) => {
  client.emit(event, ...args);
};

const mockMember = (tag = "user#0001") =>
  ({
    user: { tag },
    roles: { cache: new Map() },
  }) as unknown as GuildMember;

const mockMessage = (content = "!ping", bot = false) =>
  ({
    content,
    author: { bot, tag: "user#0001" },
    member: {
      permissions: { has: vi.fn().mockReturnValue(true) },
      roles: { cache: [] },
    },
    reply: vi
      .fn()
      .mockResolvedValue({ delete: vi.fn(), createdTimestamp: Date.now() }),
    createdTimestamp: Date.now(),
  }) as unknown as Message;

describe("BotClient", () => {
  let client: BotClient;

  beforeEach(() => {
    client = new BotClient();
    vi.clearAllMocks();
  });

  it("on_ready est appelé à l'event ready", async () => {
    const fn = vi.fn();
    client.on_ready(fn).bindHooks();
    emitEvent(client, Events.ClientReady);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledOnce());
  });

  it("on_messageCreate est appelé avec le message", async () => {
    const fn = vi.fn();
    const message = mockMessage();
    client.on_messageCreate(fn).bindHooks();
    emitEvent(client, Events.MessageCreate, message);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(message));
  });

  it("on_messageCreate ignore les messages de bots", async () => {
    const fn = vi.fn();
    const message = mockMessage("!ping", true); // bot = true
    client.on_messageCreate(fn).bindHooks();
    emitEvent(client, Events.MessageCreate, message);
    await new Promise((r) => setTimeout(r, 50)); // Attend un peu pour la queue
    expect(fn).not.toHaveBeenCalled();
  });

  it("on_memberJoin est appelé avec le membre", async () => {
    const fn = vi.fn();
    const member = mockMember();
    client.on_memberJoin(fn).bindHooks();
    emitEvent(client, Events.GuildMemberAdd, member);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(member));
  });

  it("on_memberLeave est appelé avec le membre", async () => {
    const fn = vi.fn();
    const member = mockMember();
    client.on_memberLeave(fn).bindHooks();
    emitEvent(client, Events.GuildMemberRemove, member);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(member));
  });

  it("on_error est appelé en cas d'erreur globale", async () => {
    const fn = vi.fn();
    const error = new Error("boom");
    client.on_error(fn).bindHooks();
    emitEvent(client, Events.Error, error);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(error));
  });

  it("une erreur dans on_messageCreate est transmise à on_error", async () => {
    const error = new Error("handler crash");
    const onError = vi.fn();
    client
      .on_messageCreate(async () => {
        throw error;
      })
      .on_error(onError)
      .bindHooks();
    emitEvent(client, Events.MessageCreate, mockMessage());
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it("une erreur dans on_memberJoin est transmise à on_error", async () => {
    const error = new Error("join crash");
    const onError = vi.fn();
    client
      .on_memberJoin(async () => {
        throw error;
      })
      .on_error(onError)
      .bindHooks();
    emitEvent(client, Events.GuildMemberAdd, mockMember());
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it("deploy() exécute beforeDeploy -> deployFn -> afterDeploy dans l'ordre", async () => {
    const order: string[] = [];
    client
      .on_beforeDeploy(async () => {
        order.push("before");
      })
      .on_afterDeploy(async () => {
        order.push("after");
      });

    const deployFn = vi.fn(async () => {
      order.push("deploy");
    });
    await client.deploy(deployFn);

    expect(order).toEqual(["before", "deploy", "after"]);
    expect(deployFn).toHaveBeenCalledOnce();
  });

  it("deploy() fonctionne sans beforeDeploy ni afterDeploy", async () => {
    const deployFn = vi.fn();
    await expect(client.deploy(deployFn)).resolves.not.toThrow();
    expect(deployFn).toHaveBeenCalledOnce();
  });

  it("les hooks sont chainables", () => {
    expect(
      client.on_ready(vi.fn()).on_messageCreate(vi.fn()).on_error(vi.fn()),
    ).toBe(client);
  });

  it("erreur dans deploy() est catch et envoyée à onError", async () => {
    const error = new Error("deploy crash");
    const deployFn = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    client.on_error(onError).bindHooks();
    await client.deploy(deployFn);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("l'erreur dans getError déclenche un fail-safe silencieux (fallback error manager)", async () => {
    client.bindHooks();
    const error = new Error("random crash");
    emitEvent(client, Events.Error, error);
    // Wait to verify it doesn't throw unhandled
    await new Promise((r) => setTimeout(r, 10));
  });

  it("on_error qui crash est géré (catch de sécurité)", async () => {
    const error = new Error("random crash");
    const onError = vi
      .fn()
      .mockRejectedValue(new Error("crash inside error handler"));
    client.on_error(onError).bindHooks();
    emitEvent(client, Events.Error, error);
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it("une erreur dans ready est gérée", async () => {
    const error = new Error("ready crash");
    const onError = vi.fn();
    client
      .on_ready(async () => {
        throw error;
      })
      .on_error(onError)
      .bindHooks();
    emitEvent(client, Events.ClientReady);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it("une erreur dans guildMemberRemove est gérée", async () => {
    const error = new Error("remove crash");
    const onError = vi.fn();
    client
      .on_memberLeave(async () => {
        throw error;
      })
      .on_error(onError)
      .bindHooks();
    emitEvent(client, Events.GuildMemberRemove, mockMember());
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });
});
