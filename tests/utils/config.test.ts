import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("Config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("uses fallback values when environment variables are missing", async () => {
    // Stub fs.existsSync to always return false so that dotenv never loads
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    vi.stubEnv("DISCORD_TOKEN", "");
    vi.stubEnv("DISCORD_CLIENT_ID", "");
    vi.stubEnv("GUILD_ID", "");
    vi.stubEnv("PREFIX", "");
    vi.stubEnv("LOG_LEVEL", "");
    vi.stubEnv("DATABASE_ENABLED", "");
    vi.stubEnv("DATABASE_DIALECT", "");
    vi.stubEnv("DATABASE_HOST", "");
    vi.stubEnv("DATABASE_PORT", "");
    vi.stubEnv("DATABASE_NAME", "");
    vi.stubEnv("DATABASE_USER", "");
    vi.stubEnv("DATABASE_PASS", "");
    vi.stubEnv("DATABASE_URL", "");

    const { config } = await import("../../src/config");

    expect(config.prefix).toBe("!");
    expect(config.logLevel).toBe("info");
    expect(config.database.enabled).toBe(false);
    expect(config.database.dialect).toBe("postgres");
    expect(config.database.host).toBe("localhost");
    expect(config.database.port).toBe(5432); // Fallback is 5432
    expect(config.database.name).toBe("mybot");
  });
});
