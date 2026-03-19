import { ChatInputCommandInteraction, Message } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { PingInteraction } from "../../src/interactions/PingInteraction";

describe("Ping Interaction (Unified System)", () => {
  const mockChat = {
    reply: vi.fn().mockResolvedValue({}),
    user: { id: "123" },
  } as unknown as ChatInputCommandInteraction;
  Object.setPrototypeOf(mockChat, ChatInputCommandInteraction.prototype);

  const mockMsg = {
    reply: vi.fn().mockResolvedValue({}),
    author: { id: "456" },
  } as unknown as Message;
  Object.setPrototypeOf(mockMsg, Message.prototype);

  it("PingInteraction executesSlash properly", async () => {
    const ping = new PingInteraction();
    await ping.executeSlash(mockChat, { args: {}, options: {} });
    expect(mockChat.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Pong (Slash) !" }),
    );
  });

  it("PingInteraction execute properly", async () => {
    const ping = new PingInteraction();
    await ping.execute(mockMsg, { args: {}, options: {} });
    expect(mockMsg.reply).toHaveBeenCalledWith("Pong (Prefix) !");
  });

  it("PingInteraction.stats executes properly", async () => {
    const ping = new PingInteraction();
    const chatStats = { reply: vi.fn(), createdTimestamp: Date.now() } as any;
    Object.setPrototypeOf(chatStats, ChatInputCommandInteraction.prototype);

    const msgStats = { reply: vi.fn(), createdTimestamp: Date.now() } as any;
    Object.setPrototypeOf(msgStats, Message.prototype);

    await ping.stats(chatStats, { args: {}, options: {} });
    await ping.stats(msgStats, { args: {}, options: {} });

    expect(chatStats.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.any(String) }),
    );
    expect(msgStats.reply).toHaveBeenCalledWith(expect.any(String));
  });

  it("PingInteraction.latency executes properly", async () => {
    const ping = new PingInteraction();
    const chatLat = {
      reply: vi.fn(),
      createdTimestamp: Date.now() - 100,
    } as any;
    Object.setPrototypeOf(chatLat, ChatInputCommandInteraction.prototype);

    const msgLat = {
      reply: vi.fn(),
      createdTimestamp: Date.now() - 100,
    } as any;
    Object.setPrototypeOf(msgLat, Message.prototype);

    await ping.latency(chatLat, { args: {}, options: {} });
    await ping.latency(msgLat, { args: {}, options: {} });

    expect(chatLat.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("Latence") }),
    );
    expect(msgLat.reply).toHaveBeenCalledWith(
      expect.stringContaining("Latence"),
    );
  });

  it("PingInteraction.execute handles null message", async () => {
    const ping = new PingInteraction();
    await expect(
      ping.execute(null, { args: {}, options: {} }),
    ).resolves.toBeUndefined();
  });
});
