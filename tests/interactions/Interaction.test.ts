import { Message } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { helpLoader } from "../../src/help/HelpLoader";
import { Interaction, ParsedInput } from "../../src/interactions/Interaction";

// Mock interaction class since it's abstract
class TestInteraction extends Interaction {
  protected signature = 'test:sub {arg1} {arg2?="def"} {--flag} {--opt=}';
  public description = "Desc test";

  public async execute(
    message: Message | null,
    input: ParsedInput,
  ): Promise<void> {
    if (message) await message.reply("Executed!");
  }

  public async sub(message: Message | null, input: ParsedInput): Promise<void> {
    if (message) await message.reply("Sub Executed!");
  }
}

const mockMessage = (roles: string[] = []) =>
  ({
    member: {
      permissions: { has: vi.fn().mockReturnValue(true) },
      roles: { cache: roles.map((name) => ({ name })) },
    },
    reply: vi.fn().mockResolvedValue({}),
  }) as unknown as Message;

vi.mock("../../src/help/HelpLoader", () => ({
  helpLoader: {
    has: vi.fn(),
    get: vi.fn(),
  },
}));

describe("Interaction", () => {
  let interaction: TestInteraction;

  beforeEach(() => {
    interaction = new TestInteraction();
    vi.clearAllMocks();
  });

  it("getName renvoie la base de la signature", () => {
    expect(interaction.getName()).toBe("test");
  });

  it("getSubcommandNames renvoie les sous-commandes", () => {
    expect(interaction.getSubcommandNames()).toEqual(["sub"]);
  });

  it("getHelp renvoie le markdown depuis helpLoader si présent", () => {
    vi.mocked(helpLoader.has).mockReturnValue(true);
    vi.mocked(helpLoader.get).mockReturnValue("Contenu mock");
    expect(interaction.getHelp()).toBe("Contenu mock");
  });

  it("getHelp renvoie un markdown basique généré si helpLoader absent", () => {
    vi.mocked(helpLoader.has).mockReturnValue(false);
    const help = interaction.getHelp();
    expect(help).toContain("## test");
    expect(help).toContain("Desc test");
    expect(help).toContain("test"); // Le prefix et le nom (à travers config.prefix)
    expect(help).toContain("- `sub`");
  });

  it("parseInput lance Error si argument requis manquant", () => {
    expect(() => interaction.parseInput([])).toThrow(
      "Missing required argument: arg1",
    );
  });

  it("parseInput avec valeur par défaut et args requis", () => {
    const input = interaction.parseInput(["val1"]);
    expect(input.args.arg1).toBe("val1");
    expect(input.args.arg2).toBe('"def"'); // Wait split is =def
  });

  it("parseInput extrait flags et options", () => {
    const input = interaction.parseInput([
      "val1",
      "val2",
      "--flag",
      "--opt=hello",
      "ignore",
    ]);
    expect(input.args.arg1).toBe("val1");
    expect(input.args.arg2).toBe("val2");
    expect(input.options.flag).toBe(true);
    expect(input.options.opt).toBe("hello");
  });

  it("parseInput lit flag passé comme option et option spacés", () => {
    class SpaceTestInteraction extends Interaction {
      protected signature = "space {--opt=} {--flag}";
      public async execute() {}
    }
    const inst = new SpaceTestInteraction();
    const parsed = inst.parseInput(["--opt", "myval", "--flag"]);
    expect(parsed.options.opt).toBe("myval");
    expect(parsed.options.flag).toBe(true);
  });

  it("authorize renvoie false, prévient en éphémeral (ici reply) si permissions invalides", () => {
    class DenyInteraction extends TestInteraction {
      protected roles = ["Admin"];
    }
    const deny = new DenyInteraction();
    const msg = mockMessage(["User"]);
    const auth = deny.authorize(msg);
    expect(auth).toBe(false);
    expect(msg.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Vous n'avez pas le rôle requis." }),
    );
  });

  it("handle exécute getHelp si args[0] est --help", async () => {
    const msg = mockMessage();
    await interaction.handle(msg, ["--help"]);
    expect(msg.reply).toHaveBeenCalled();
  });

  it("handle lance hooks dans l'ordre puit execute", async () => {
    const order: string[] = [];
    interaction.beforeExecute(async () => {
      order.push("before");
    });
    interaction.onPrefixExecute(async () => {
      order.push("prefix");
    });
    interaction.afterExecute(async () => {
      order.push("after");
    });

    const msg = mockMessage();
    vi.spyOn(interaction, "execute").mockImplementation(async () => {
      order.push("execute");
    });

    await interaction.handle(msg, ["val"]);

    expect(order).toEqual(["before", "prefix", "execute", "after"]);
  });

  it("handle route sur une subcommand si présente", async () => {
    const msg = mockMessage();
    const subSpy = vi.spyOn(interaction, "sub");
    await interaction.handle(msg, ["sub", "val"]);
    expect(subSpy).toHaveBeenCalled();
  });

  it("handle gère une subcommander inexistante poliment, erreur -> reply", async () => {
    class InvalidSubInteraction extends Interaction {
      protected signature = "app:nonexistent";
      public async execute() {}
    }
    const msg = mockMessage();
    const spy = vi.spyOn(msg, "reply");
    await new InvalidSubInteraction().handle(msg, ["nonexistent"]);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("is not implemented"),
      }),
    );
  });

  it("handle catch exception et execute hooks onError si present", async () => {
    const msg = mockMessage();
    const errorFn = vi.fn();
    interaction.onError(errorFn);

    vi.spyOn(interaction, "execute").mockRejectedValue(new Error("crash"));

    await interaction.handle(msg, ["val"]);
    expect(errorFn).toHaveBeenCalled();
  });

  it("handle catch exception de callback onError", async () => {
    const msg = mockMessage();
    const errorFn = vi.fn().mockRejectedValue(new Error("crash cb"));
    interaction.onError(errorFn);

    vi.spyOn(interaction, "execute").mockRejectedValue(new Error("crash"));

    await interaction.handle(msg, ["val"]);
    expect(errorFn).toHaveBeenCalled(); // No unhandled promise
  });

  it("authorize subPermissions", () => {
    class SubAuthInteraction extends TestInteraction {
      protected subRoles = { sub: ["Admin"] };
    }
    const inst = new SubAuthInteraction();
    const auth = inst.authorize(mockMessage(["User"]), "sub");
    expect(auth).toBe(false);
  });
});
