import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleCommand } from "../../src/console/ConsoleCommand";

class TestCmd extends ConsoleCommand {
  public signature = "test";
  public description = "Test command";

  public async handle(): Promise<void> {
    this.info("msg info");
    this.success("msg success");
    this.warn("msg warn");
    this.error("msg error");
    this.line("msg line");
  }

  public getArgTest(i: number) {
    return this.getArg(i);
  }
  public hasFlagTest(f: string) {
    return this.hasFlag(f);
  }
  public getOptionTest(o: string) {
    return this.getOption(o);
  }
}

describe("ConsoleCommand", () => {
  let cmd: TestCmd;

  beforeEach(() => {
    cmd = new TestCmd();
    vi.clearAllMocks();
  });

  it("run execute handle proprement", async () => {
    const spy = vi.spyOn(cmd, "handle").mockResolvedValue(undefined);
    await cmd.run();
    expect(spy).toHaveBeenCalled();
  });

  it("run exit 1 si handle throw", async () => {
    vi.spyOn(cmd, "handle").mockRejectedValue(new Error("crash"));
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await cmd.run();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errSpy).toHaveBeenCalled();
  });

  it("méthodes de logs fonctionnent", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const wrnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await cmd.handle();
    expect(logSpy).toHaveBeenCalledTimes(3); // info, success, line
    expect(wrnSpy).toHaveBeenCalledTimes(1); // warn
    expect(errSpy).toHaveBeenCalledTimes(1); // error
  });

  it("line utilise string vide par défaut", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    (cmd as any).line();
    expect(logSpy).toHaveBeenCalledWith("");
  });

  it("helpers arguments lisent process.argv", () => {
    const originalArgv = process.argv;
    process.argv = ["node", "script", "action", "--flag", "--opt=val"];

    expect(cmd.getArgTest(0)).toBe("action");
    expect(cmd.getArgTest(1)).toBeNull(); // car index 1 = option ignorée des args positionnels purs ?
    // getArg excludes anything starting with '--'

    expect(cmd.hasFlagTest("flag")).toBe(true);
    expect(cmd.hasFlagTest("noflag")).toBe(false);
    expect(cmd.getOptionTest("opt")).toBe("val");
    expect(cmd.getOptionTest("noopt")).toBeNull();

    process.argv = originalArgv;
  });
});
