import { Message } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Interaction } from "../../src/interactions/Interaction";
import { runner } from "../../src/interactions/InteractionRunner";
import { logger } from "../../src/utils/logger";

class MockIter extends Interaction {
  protected signature = "cmd:sub";
  public execute = vi.fn();

  public sub = vi.fn();
}

describe("InteractionRunner", () => {
  let mockIter: MockIter;

  beforeEach(() => {
    mockIter = new MockIter();
    runner.registerAll([mockIter]);
    vi.clearAllMocks();
  });

  it("get renvoie l'interaction", () => {
    expect(runner.get("cmd")).toBe(mockIter);
  });

  it("buildRawArgs reconstruit args correct", () => {
    const raw = runner.buildRawArgs({
      args: { a: "A", b: "" },
      options: { f: true, f2: false, k: "V" },
    });
    expect(raw).toEqual(["A", "--f", "--k=V"]);
  });

  it("call loggue warning si inexistant", async () => {
    const loggerSpy = vi
      .spyOn(logger, "warn")
      .mockImplementation((() => {}) as any);
    await runner.call("unknown", { args: {}, options: {} }, {} as Message);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining("not found"),
    );
  });

  it("call execute la méthode handle de base", async () => {
    vi.spyOn(mockIter, "handle").mockResolvedValue(undefined);
    await runner.call("cmd", { args: {}, options: {} }, {} as Message);
    expect(mockIter.handle).toHaveBeenCalled();
  });

  it("callSilent loggue warning si inexistant", async () => {
    const loggerSpy = vi
      .spyOn(logger, "warn")
      .mockImplementation((() => {}) as any);
    await runner.callSilent("unknown", { args: {}, options: {} });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining("not found"),
    );
  });

  it("callSilent execute silencieusement", async () => {
    await runner.callSilent("cmd", { args: {}, options: {} });
    expect(mockIter.execute).toHaveBeenCalled();
  });

  it("callSilent catch et loggue erreur", async () => {
    const loggerSpy = vi
      .spyOn(logger, "error")
      .mockImplementation((() => {}) as any);
    mockIter.execute.mockRejectedValueOnce(new Error("silent crash"));
    await runner.callSilent("cmd", { args: {}, options: {} });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in callSilent"),
      expect.any(Error),
    );
  });
});
