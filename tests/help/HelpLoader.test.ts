import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { helpLoader } from "../../src/help/HelpLoader";

vi.mock("../../src/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("HelpLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (helpLoader as any).cache.clear();
  });

  it("boot ne fait rien si dossier absent", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    helpLoader.boot();
    expect(helpLoader.has("abc")).toBe(false);
  });

  it("boot charge les fichiers md", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    // Ignore .DS_Store to test coverage of !md
    vi.spyOn(fs, "readdirSync").mockReturnValue(["cmd.md", ".DS_Store"] as any);
    vi.spyOn(fs, "readFileSync").mockReturnValue("MD_CONTENT");

    helpLoader.boot();

    expect(helpLoader.has("cmd")).toBe(true);
    expect(helpLoader.get("cmd")).toBe("MD_CONTENT");
    expect(helpLoader.get("unknown")).toBeNull();
  });
});
