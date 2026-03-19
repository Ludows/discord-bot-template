import { beforeEach, describe, expect, it, vi } from "vitest";
import { Service } from "../../src/services/Service";

// To mock the singleton `sequelize` in database/index
vi.mock("../../src/database/index", () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

import { sequelize } from "../../src/database/index";

class TestService extends Service {
  protected name = "TestService";
  public async boot(): Promise<void> {
    this.log("Booted");
  }

  public async doFail() {
    this.fail("Failed intent");
  }

  public async doTx() {
    return this.transaction(async () => {
      return "tx-res";
    });
  }

  public async doTxThrow() {
    return this.transaction(async () => {
      throw new Error("tx-crash");
    });
  }
}

describe("Service Base Class", () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    vi.clearAllMocks();
  });

  it("log() output properly", async () => {
    await expect(service.boot()).resolves.toBeUndefined();
  });

  it("fail() throws Error", async () => {
    await expect(service.doFail()).rejects.toThrow("Failed intent");
  });

  it("transaction() commits", async () => {
    const t = { commit: vi.fn(), rollback: vi.fn() };
    (sequelize!.transaction as any).mockResolvedValue(t);

    const res = await service.doTx();
    expect(res).toBe("tx-res");
    expect(t.commit).toHaveBeenCalled();
  });

  it("transaction() rolls back", async () => {
    const t = { commit: vi.fn(), rollback: vi.fn() };
    (sequelize!.transaction as any).mockResolvedValue(t);

    await expect(service.doTxThrow()).rejects.toThrow("tx-crash");
    expect(t.rollback).toHaveBeenCalled();
  });
});
