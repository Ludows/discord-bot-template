import { describe, expect, it } from "vitest";
import { Process } from "../../src/utils/Process";

describe("Process", () => {
  it("peu éxécuter une commande et retourner le résultat", async () => {
    const result = await Process.run('echo "hello world"');
    expect(result.successful()).toBe(true);
    expect(result.output()).toBe("hello world");
    expect(result.exitCode()).toBe(0);
  });

  it("gère les erreurs de commande", async () => {
    const result = await Process.run("non-existent-command");
    expect(result.failed()).toBe(true);
    expect(result.exitCode()).not.toBe(0);
  });
});
