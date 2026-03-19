import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Make } from "../../src/console/Make";

vi.mock("../../src/console/generators/ModelGenerator", () => ({
  ModelGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));
vi.mock("../../src/console/generators/MigrationGenerator", () => ({
  MigrationGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));
vi.mock("../../src/console/generators/ServiceGenerator", () => ({
  ServiceGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));
vi.mock("../../src/console/generators/HttpGenerator", () => ({
  HttpGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn((name) => {
      if (name === "CrashTest") throw new Error("parse error");
    });
  },
}));
vi.mock("../../src/console/generators/InteractionGenerator", () => ({
  InteractionGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));
vi.mock("../../src/console/generators/SlashInteractionGenerator", () => ({
  SlashInteractionGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));
vi.mock("../../src/console/generators/TestGenerator", () => ({
  TestGenerator: class {
    parseFields = vi.fn().mockReturnValue([]);
    generate = vi.fn();
  },
}));

describe("Make Command", () => {
  let cmd: Make;
  let exitSpy: any;
  let errSpy: any;
  let succSpy: any;
  let origArgv: string[];

  beforeEach(() => {
    cmd = new Make();
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    succSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    origArgv = process.argv;
  });

  afterEach(() => {
    process.argv = origArgv;
  });

  const runArgs = async (args: string[]) => {
    process.argv = ["node", "script", ...args];
    await cmd.handle();
  };

  it("échoue si arguments manquants", async () => {
    await runArgs([]);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("échoue si type generator invalide", async () => {
    await runArgs(["invalid", "Name"]);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("inconnu"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("route correctement vers model", async () => {
    await runArgs(["model", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers migration", async () => {
    await runArgs(["migration", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers service", async () => {
    await runArgs(["service", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers http", async () => {
    await runArgs(["http", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers interaction", async () => {
    await runArgs(["interaction", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers slash-interaction", async () => {
    await runArgs(["slash-interaction", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("route vers test:interaction", async () => {
    await runArgs(["test:interaction", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });
  it("route vers test:slash-interaction", async () => {
    await runArgs(["test:slash-interaction", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });
  it("route vers test:service", async () => {
    await runArgs(["test:service", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });
  it("route vers test:http", async () => {
    await runArgs(["test:http", "User"]);
    expect(succSpy).toHaveBeenCalledWith(expect.stringContaining("terminée."));
  });

  it("catch les erreurs des generateurs", async () => {
    await runArgs(["http", "CrashTest"]);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("parse error"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
