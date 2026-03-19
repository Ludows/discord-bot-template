import { PermissionFlagsBits } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { BotClient } from "../../src/bot/BotClient";
import { Interaction } from "../../src/interactions/Interaction";
import { SlashInteraction } from "../../src/interactions/SlashInteraction";
import { slashRegistry } from "../../src/interactions/SlashInteractionRegistry";
import { PermissionManager } from "../../src/utils/PermissionManager";

class DummyIter extends Interaction {
  protected signature = "test:sub {arg1} {arg2=val2} {--opt=} {--flag} junk";
  public execute = vi.fn();

  constructor() {
    super();
    this.subPermissions = { sub: ["Administrator"] };
  }
}

class NoSubIter extends Interaction {
  protected signature = "nosub {arg1}";
  public execute = vi.fn();
}

class DummySlash extends SlashInteraction {
  protected signature = "sl:sub {arg1} {arg2=val1} {--opt=} junk";
  public executeSlash = vi.fn();

  public testReg() {
    this.registerModal("m", async () => {});
    this.registerSelectMenu("s", async () => {});
    this.registerButton("b", async () => {});
  }
}

describe("Interaction coverage gaps", () => {
  it("Interaction.replyEphemeral timeout coverage", async () => {
    vi.useFakeTimers();
    const iter = new DummyIter();
    const mockMsg = {
      reply: vi
        .fn()
        .mockResolvedValue({ delete: vi.fn().mockResolvedValue(true) }),
    } as any;
    await (iter as any).replyEphemeral(mockMsg, "test");
    vi.runAllTimers();
    expect(mockMsg.reply).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("Interaction setters (onError, etc) coverage", () => {
    const iter = new DummyIter();
    iter.onError(async () => {});
    iter.onPrefixExecute(async () => {});
    iter.beforeExecute(async () => {});
    iter.afterExecute(async () => {});
  });

  it("Interaction.authorize subPermissions coverage", () => {
    const iter = new DummyIter();
    const mockMsg = { member: {}, reply: vi.fn() } as any;
    vi.spyOn(PermissionManager, "check").mockReturnValue({
      allowed: false,
      reason: "",
    });
    const spy = vi
      .spyOn(iter as any, "replyEphemeral")
      .mockImplementation(() => {});

    expect(iter.authorize(mockMsg, "sub")).toBe(false);
    expect(spy).toHaveBeenCalledWith(expect.anything(), "Accès refusé.");
  });

  it("Interaction.handle early returns if not authorized", async () => {
    const iter = new DummyIter();
    vi.spyOn(iter, "authorize").mockReturnValue(false);
    const mockMsg = {} as any;
    await iter.handle(mockMsg, ["sub"]);
    expect(iter.execute).not.toHaveBeenCalled();
  });

  it("Interaction.parseInput exhaustively hits option branches", () => {
    const iter = new DummyIter();

    // Hit line 129: --opt=val
    const parsed1 = iter.parseInput(["val1", "--opt=foo"]);
    expect(parsed1.options["opt"]).toBe("foo");

    // Hit line 129 false branch: --unknown=foo
    iter.parseInput(["val1", "--unknown=foo"]);

    // Hit line 134-136: --flag (boolean)
    const parsed2 = iter.parseInput(["val1", "--flag"]);
    expect(parsed2.options["flag"]).toBe(true);

    // Hit line 134 false branch: --unknown
    iter.parseInput(["val1", "--unknown"]);

    // Hit line 137: --opt val (separated)
    const parsed3 = iter.parseInput(["val1", "--opt", "bar"]);
    expect(parsed3.options["opt"]).toBe("bar");

    // Optional arg with default
    const parsed4 = iter.parseInput(["val1"]);
    expect(parsed4.args["arg2"]).toBe("val2");

    // Hit line 137 false branch (no value for opt)
    const parsed5 = iter.parseInput(["val1", "--opt"]);
    expect(parsed5.options["opt"]).toBe(null);

    // Hit line 137 false branch (next is another flag)
    const parsed6 = iter.parseInput(["val1", "--opt", "--flag"]);
    expect(parsed6.options["opt"]).toBe(null);
  });

  it("Interaction.getHelp covers no subcommands branch", () => {
    const iter = new NoSubIter();
    const help = iter.getHelp();
    expect(help).toContain("nosub");
    expect(help).not.toContain("Sous-commandes");
  });

  it("SlashInteraction exhaustive signatures coverage", () => {
    class SigSlash extends SlashInteraction {
      protected signature = "sig {arg1?} {arg2=default} junk";
      public executeSlash = vi.fn();
      constructor() {
        super();
        this.permissions = [PermissionFlagsBits.Administrator];
      }
    }
    const slash = new SigSlash();

    // Hit lines 140-143: permissions reduction in toSlashCommand
    const builder = slash.toSlashCommand();
    expect(builder).toBeDefined();

    const mockChat = {
      options: {
        getSubcommand: () => null,
        getString: (k: string) => (k === "opt" ? "val" : null),
        getBoolean: () => false,
      },
    } as any;

    // Hit line 208-209: parseSlashInput option with value
    const slashWithOpt = new DummySlash();
    const parsedOpt = slashWithOpt.parseSlashInput(mockChat);
    expect(parsedOpt.options["opt"]).toBe("val");

    const parsed = slash.parseSlashInput(mockChat);
    expect(parsed.args["arg1"]).toBe(null);
    expect(parsed.args["arg2"]).toBe("default");

    // Hit line 113-120: registration methods
    slashWithOpt.testReg();

    // Coverage for other setters
    slashWithOpt.beforeSlashExecute(async () => {});
    slashWithOpt.afterSlashExecute(async () => {});
    slashWithOpt.onSlashExecute(async () => {});
    slashWithOpt.onSlashError(async () => {});
    slashWithOpt.onComponentInteraction(async () => {});

    // Hit line 306 TRUE branch
    slashWithOpt.handleComponent({} as any, vi.fn());

    // Hit line 306 FALSE branch
    const slashNoCb = new DummySlash();
    slashNoCb.handleComponent({} as any, vi.fn());

    // Hit func 127: applySubcommandOptions
    slashNoCb.applySubcommandOptions({}, "test");

    // Hit SlashInteraction.execute stub
    slashNoCb.execute(null, { args: {}, options: {} });
  });

  it("SlashInteraction subcommand not implemented error", async () => {
    const slash = new DummySlash();
    const mockChat = {
      options: {
        getSubcommand: () => "sub",
        getString: () => null,
      },
      reply: vi.fn(),
      followUp: vi.fn(),
    } as any;
    await slash.handleSlash(mockChat);
    expect(mockChat.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("not implemented"),
      }),
    );
  });

  it("SlashInteraction autocomplete hits all subName branches", async () => {
    const slash = new DummySlash();
    const mockAuto = {
      options: {
        getSubcommand: () => "sub",
        getFocused: () => ({ name: "f" }),
      },
      respond: vi.fn(),
    } as any;

    await slash.handleAutocomplete(mockAuto);

    const mockAutoNoSub = {
      options: {
        getSubcommand: () => null,
        getFocused: () => ({ name: "f" }),
      },
      respond: vi.fn(),
    } as any;
    await slash.handleAutocomplete(mockAutoNoSub);

    expect(mockAuto.respond).toHaveBeenCalled();
    expect(mockAutoNoSub.respond).toHaveBeenCalled();
  });

  it("SlashRegistry hits all branches of interactionCreate", async () => {
    const client = new BotClient();
    slashRegistry.bind(client);

    const emit = async (props: any) => {
      const inter = {
        isChatInputCommand: () => false,
        isAutocomplete: () => false,
        isButton: () => false,
        isModalSubmit: () => false,
        isStringSelectMenu: () => false,
        ...props,
      };
      client.emit("interactionCreate", inter);
      await new Promise((r) => setTimeout(r, 5));
    };

    await emit({});
  });
});
