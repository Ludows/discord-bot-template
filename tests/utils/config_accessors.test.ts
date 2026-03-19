import { describe, expect, it } from "vitest";
import { config } from "../../src/config";

describe("Config Accessors", () => {
  it("should get a top-level value", () => {
    expect(config.get("prefix")).toBe(config.prefix);
  });

  it("should get a nested value", () => {
    expect(config.get("database.host")).toBe(config.database.host);
  });

  it("should return undefined for non-existent paths", () => {
    expect(config.get("non.existent.path")).toBeUndefined();
    expect(config.get("database.invalid")).toBeUndefined();
  });

  it("should set a top-level value", () => {
    const originalPrefix = config.prefix;
    config.set("prefix", "!!");
    expect(config.prefix).toBe("!!");
    expect(config.get("prefix")).toBe("!!");
    // Reset for other tests if needed, though config is a singleton
    config.set("prefix", originalPrefix);
  });

  it("should set a nested value", () => {
    const originalHost = config.database.host;
    config.set("database.host", "remote-host");
    expect(config.database.host).toBe("remote-host");
    expect(config.get("database.host")).toBe("remote-host");
    config.set("database.host", originalHost);
  });

  it("should create intermediate objects if they don't exist", () => {
    // @ts-ignore - testing dynamic path
    config.set("new.deeply.nested.property", "value");
    // @ts-ignore
    expect(config.new.deeply.nested.property).toBe("value");
    expect(config.get("new.deeply.nested.property")).toBe("value");
  });
});
