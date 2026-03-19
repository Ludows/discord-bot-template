import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/database", () => ({
  sequelize: null,
}));

describe("Service missing sequelize", () => {
  it("throws if transaction called", async () => {
    const { Service } = await import("../../src/services/Service");
    class Srv extends Service {
      protected name = "a";
      public async boot() {}
      public async test() {
        return this.transaction(async () => {});
      }
    }
    const s = new Srv();
    await expect(s.test()).rejects.toThrow("La base de données est désactivée");
  });
});

describe("Logger Coverage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("../../src/config");
  });

  it("covers logger initialization in dev env", async () => {
    vi.resetModules();

    vi.doMock("../../src/config", () => ({
      config: { env: "dev", logLevel: "info" },
    }));

    // This will now hit the 'dev' branch and the Console transport
    const { logger } = await import("../../src/utils/logger");

    logger.info("test output formatting");
    expect(logger).toBeDefined();
  });
});
