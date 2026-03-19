import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParsedInput } from "../../src/interactions/Interaction";
import { SlashInteraction } from "../../src/interactions/SlashInteraction";

class TestSlash extends SlashInteraction {
  protected signature = "test:sub {arg1} {--flag}";
  public description = "Test desc";

  constructor() {
    super();
    this.registerButton("my-btn", this.onBtn);
  }

  public async executeSlash(
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ): Promise<void> {
    await interaction.reply("Executed");
  }

  public async sub(
    interaction: ChatInputCommandInteraction,
    input: ParsedInput,
  ): Promise<void> {
    await interaction.reply("Sub");
  }

  public async autocomplete_sub_arg1(interaction: AutocompleteInteraction) {
    await interaction.respond([{ name: "sub-res", value: "sub-res" }]);
  }

  public async onBtn(i: ButtonInteraction) {
    await i.reply("btn");
  }
}

const mockSlashInteraction = (sub?: string, opts: Record<string, any> = {}) =>
  ({
    options: {
      getSubcommand: vi.fn().mockReturnValue(sub ?? null),
      getString: vi.fn((key) => opts[key] ?? null),
      getBoolean: vi.fn((key) => opts[key] ?? false),
      getFocused: vi.fn().mockReturnValue({ name: "arg1", value: "a" }),
    },
    reply: vi.fn(),
    followUp: vi.fn(),
    respond: vi.fn(),
    replied: false,
    deferred: false,
  }) as unknown as ChatInputCommandInteraction;

const mockAutocomplete = (sub?: string, fieldName = "arg1") =>
  ({
    options: {
      getSubcommand: vi.fn().mockReturnValue(sub ?? null),
      getFocused: vi.fn().mockReturnValue({ name: fieldName, value: "a" }),
    },
    respond: vi.fn(),
  }) as unknown as AutocompleteInteraction;

describe("SlashInteraction", () => {
  let interaction: TestSlash;

  beforeEach(() => {
    interaction = new TestSlash();
    vi.clearAllMocks();
  });

  it("toSlashCommand construit le builder avec sous-commande", () => {
    const builder = interaction.toSlashCommand();
    expect(builder.name).toBe("test");
    expect(builder.description).toBe("Test desc");

    // Le builder est un mock object dans les tests complets discord.js,
    // mais ici c'est importé de discord.js, on vérifie la structure JSON.
    const json = builder.toJSON();
    expect(json.options?.length).toBeGreaterThan(0);
    expect(json.options![0].name).toBe("sub");
  });

  it("toSlashCommand ajoute les options (string, boolean) sans subcommand", () => {
    class NoSubSlash extends SlashInteraction {
      protected signature = "cmd {myarg} {--myflag} {--myopt=}";
      public async executeSlash() {}
    }
    const noSub = new NoSubSlash();
    const json = noSub.toSlashCommand().toJSON();
    expect(json.options?.length).toBe(3);
    const names = json.options!.map((o) => o.name);
    expect(names).toContain("myarg");
    expect(names).toContain("myflag");
    expect(names).toContain("myopt");
  });

  it("parseSlashInput extrait du ChatInputCommandInteraction", () => {
    const minteraction = mockSlashInteraction(undefined, {
      arg1: "hello",
      flag: true,
    });
    const input = interaction.parseSlashInput(minteraction);
    expect(input.args.arg1).toBe("hello");
    expect(input.options.flag).toBe(true);
  });

  it("handleSlash route vers la sous-commande", async () => {
    const sl = mockSlashInteraction("sub");
    await interaction.handleSlash(sl);
    expect(sl.reply).toHaveBeenCalledWith("Sub");
  });

  it("handleSlash execute hooks et subcommand", async () => {
    const order: string[] = [];
    interaction.beforeSlashExecute(async () => {
      order.push("before");
    });
    interaction.onSlashExecute(async () => {
      order.push("execute_hook");
    });
    interaction.afterSlashExecute(async () => {
      order.push("after");
    });
    const subSpy = vi.spyOn(interaction, "sub").mockImplementation(async () => {
      order.push("sub");
    });

    const sl = mockSlashInteraction("sub");
    await interaction.handleSlash(sl);

    expect(order).toEqual(["before", "execute_hook", "sub", "after"]);
  });

  it("handleSlash catch une erreur non gérée -> reply ephemeral", async () => {
    vi.spyOn(interaction, "executeSlash").mockRejectedValue(new Error("crash"));
    const sl = mockSlashInteraction();
    await interaction.handleSlash(sl);
    expect(sl.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    );
  });

  it("handleSlash execute onError hook si présent", async () => {
    const errFn = vi.fn();
    interaction.onSlashError(errFn);
    vi.spyOn(interaction, "executeSlash").mockRejectedValue(new Error("crash"));

    await interaction.handleSlash(mockSlashInteraction());
    expect(errFn).toHaveBeenCalled();
  });

  it("handleAutocomplete appelle le handler s'il existe", async () => {
    const auto = mockAutocomplete("sub", "arg1");
    await interaction.handleAutocomplete(auto);
    expect(auto.respond).toHaveBeenCalledWith([
      { name: "sub-res", value: "sub-res" },
    ]);
  });

  it("handleAutocomplete respond.([ ]) si handler absent", async () => {
    const auto = mockAutocomplete("sub", "unknown_field");
    await interaction.handleAutocomplete(auto);
    expect(auto.respond).toHaveBeenCalledWith([]);
  });

  it("handleComponent appelle le handler de bouton", async () => {
    const btn = {
      reply: vi.fn(),
      customId: "my-btn",
    } as unknown as ButtonInteraction;
    const hook = vi.fn();
    interaction.onComponentInteraction(hook);

    await interaction.handleComponent(btn, interaction.buttons.get("my-btn")!);

    expect(btn.reply).toHaveBeenCalledWith("btn");
    expect(hook).toHaveBeenCalled();
  });

  it("handleSlash fallback sur executeSlash si pas de subName", async () => {
    const sl = mockSlashInteraction(); // sub = null
    await interaction.handleSlash(sl);
    expect(sl.reply).toHaveBeenCalledWith("Executed");
  });

  it("handleSlash fallback sur followUp si deja replied", async () => {
    vi.spyOn(interaction, "executeSlash").mockRejectedValue(new Error("crash"));
    const sl = mockSlashInteraction();
    (sl as any).replied = true;
    await interaction.handleSlash(sl);
    expect(sl.followUp).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    );
  });
});
