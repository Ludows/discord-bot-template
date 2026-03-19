import { beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../../../src/config";
import { DbSetupCommand } from "../../../src/console/commands/DbSetupCommand";
import * as dbModule from "../../../src/database";

vi.mock("../../../src/database", () => ({
  buildSequelize: vi.fn(),
  databaseExists: vi.fn(),
  createDatabase: vi.fn(),
}));

const mockSeq = { close: vi.fn() };

describe("DbSetupCommand", () => {
  let cmd: DbSetupCommand;
  let exitSpy: any;
  let logSpy: any;
  let wrnSpy: any;

  beforeEach(() => {
    cmd = new DbSetupCommand();
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    wrnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    config.database.enabled = true;
    (dbModule.buildSequelize as any).mockReturnValue(mockSeq);
  });

  const runWithArg = async (arg: string) => {
    vi.spyOn(cmd as any, "getArg").mockReturnValue(arg);
    await cmd.handle();
  };

  it("check: avertit si db désactivée", async () => {
    config.database.enabled = false;
    await runWithArg("check");
    expect(wrnSpy).toHaveBeenCalled();
  });

  it("check: success si existe", async () => {
    (dbModule.databaseExists as any).mockResolvedValue(true);
    await runWithArg("check");
    expect(logSpy).toHaveBeenCalled(); // success message
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("check: avertit si inexistant, exit 1", async () => {
    (dbModule.databaseExists as any).mockResolvedValue(false);
    await runWithArg("check");
    expect(wrnSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("create: avertit si db désactivée", async () => {
    config.database.enabled = false;
    await runWithArg("create");
    expect(wrnSpy).toHaveBeenCalled();
  });

  it("create: success sans appel si déjà existante", async () => {
    (dbModule.databaseExists as any).mockResolvedValue(true);
    await runWithArg("create");
    expect(dbModule.createDatabase).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled(); // success
  });

  it("create: créé si inexistant", async () => {
    (dbModule.databaseExists as any).mockResolvedValue(false);
    await runWithArg("create");
    expect(dbModule.createDatabase).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("info: log plusieurs infos", async () => {
    await runWithArg("info");
    expect(logSpy).toHaveBeenCalledTimes(7); // info + 6 lines
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("info: gère base de nom null pour display fallback", async () => {
    config.database.url = "postgres://x";
    await runWithArg("info");
    expect(logSpy).toHaveBeenCalled(); // includes ***
  });

  it("fallback: exit 0 avec appel invalid arg", async () => {
    await runWithArg("invalid");
    expect(wrnSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0); // Exit process politely
  });
});
