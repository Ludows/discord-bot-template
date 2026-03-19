import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../../src/config";
import { Cache } from "../../src/utils/cache/Cache";
import { FileDriver } from "../../src/utils/cache/drivers/FileDriver";
import { MemoryDriver } from "../../src/utils/cache/drivers/MemoryDriver";
import { logger } from "../../src/utils/logger";

describe("Cache System", () => {
  describe("Memory Driver", () => {
    let driver: MemoryDriver;
    beforeEach(() => {
      driver = new MemoryDriver();
    });

    it("can store and retrieve values", async () => {
      await driver.set("foo", "bar");
      expect(await driver.get("foo")).toBe("bar");
    });

    it("returns null if key not found", async () => {
      expect(await driver.get("nonexistent")).toBe(null);
    });

    it("handles TTL expiration", async () => {
      vi.useFakeTimers();
      await driver.set("short", "life", 1);
      vi.advanceTimersByTime(1500);
      expect(await driver.get("short")).toBe(null);
      vi.useRealTimers();
    });

    it("can check existence and handle expired items in has()", async () => {
      vi.useFakeTimers();
      await driver.set("exist", true, 1);
      expect(await driver.has("exist")).toBe(true);

      vi.advanceTimersByTime(1500);
      expect(await driver.has("exist")).toBe(false);
      vi.useRealTimers();

      expect(await driver.has("ghost")).toBe(false);
    });

    it("can forget values", async () => {
      await driver.set("bye", "world");
      await driver.forget("bye");
      expect(await driver.has("bye")).toBe(false);
    });

    it("flush() clears the storage", async () => {
      await driver.set("a", 1);
      await driver.flush();
      expect(await driver.has("a")).toBe(false);
    });
  });

  describe("File Driver", () => {
    const testPath = path.resolve(process.cwd(), "tests/tmp/cache_driver_test");
    let driver: FileDriver;

    beforeEach(() => {
      if (fs.existsSync(testPath)) {
        fs.rmSync(testPath, { recursive: true });
      }
      driver = new FileDriver(testPath);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      if (fs.existsSync(testPath)) {
        fs.rmSync(testPath, { recursive: true, force: true });
      }
    });

    it("persists values to disk", async () => {
      await driver.set("file-test", { a: 1 });
      expect(await driver.get("file-test")).toEqual({ a: 1 });
    });

    it("has() works for file driver", async () => {
      await driver.set("h", 1);
      expect(await driver.has("h")).toBe(true);
      expect(await driver.has("no")).toBe(false);
    });

    it("handles file TTL", async () => {
      vi.useFakeTimers();
      await driver.set("exp", "data", 1);
      vi.advanceTimersByTime(1500);
      expect(await driver.get("exp")).toBe(null);
      vi.useRealTimers();
    });

    it("handles corrupt JSON gracefully", async () => {
      await driver.set("bad", "data");
      const filePath = (driver as any).getFilePath("bad");
      fs.writeFileSync(filePath, "invalid-json");

      const logSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
      expect(await driver.get("bad")).toBe(null);
      expect(logSpy).toHaveBeenCalled();
    });

    it("handles write errors gracefully", async () => {
      const logSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw new Error("write fail");
      });

      await driver.set("fail", "data");
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to write"),
        expect.anything(),
      );
    });

    it("handles delete errors gracefully", async () => {
      const logSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
      await driver.set("del", "data");
      vi.spyOn(fs, "unlinkSync").mockImplementation(() => {
        throw new Error("unlink fail");
      });

      await driver.forget("del");
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete"),
        expect.anything(),
      );
    });

    it("flush() handles multiple files and non .cache files", async () => {
      await driver.set("a", 1);
      fs.writeFileSync(path.join(testPath, "keep.me"), "ignore");

      await driver.flush();
      expect(fs.existsSync(path.join(testPath, "keep.me"))).toBe(true);
      expect(fs.readdirSync(testPath).length).toBe(1);
    });

    it("flush() handles errors gracefully", async () => {
      const logSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
      await driver.set("a", 1);
      vi.spyOn(fs, "readdirSync").mockImplementation(() => {
        throw new Error("readdir fail");
      });

      await driver.flush();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to flush"),
        expect.anything(),
      );
    });

    it("constructor skips mkdir if path exists", () => {
      const spy = vi.spyOn(fs, "mkdirSync");
      new FileDriver(testPath);
      expect(spy).not.toHaveBeenCalled();
    });

    it("constructor creates directory if missing", () => {
      const customPath = path.resolve(process.cwd(), "tests/tmp/custom_cache");
      if (fs.existsSync(customPath)) fs.rmSync(customPath, { recursive: true });

      new FileDriver(customPath);
      expect(fs.existsSync(customPath)).toBe(true);
      fs.rmSync(customPath, { recursive: true });
    });
  });

  describe("Cache Class (API)", () => {
    it("works as a singleton and respects config", async () => {
      const c1 = Cache.getInstance();
      const c2 = Cache.getInstance();
      expect(c1).toBe(c2);
    });

    it("can initialize with file driver based on config", async () => {
      // Force a new instance by bypassing the private constructor check (casting or resetting)
      // Since it's a singleton, we can just test the logic by instantiating a new one if it was public
      // or using reflection. For 100% coverage, we MUST hit the 'file' branch in constructor.

      const oldDriver = (config.cache as any).driver;
      (config.cache as any).driver = "file";

      // @ts-ignore - call private constructor for coverage
      const fileCache = new Cache();
      expect((fileCache as any).driver).toBeInstanceOf(FileDriver);

      (config.cache as any).driver = oldDriver;
    });

    it("remember() uses cache on second call", async () => {
      const c = Cache.getInstance();
      await c.flush();
      const cb = vi.fn().mockResolvedValue("val");

      expect(await c.remember("rem", 10, cb)).toBe("val");
      expect(await c.remember("rem", 10, cb)).toBe("val");
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("get() returns fallback", async () => {
      const c = Cache.getInstance();
      expect(await c.get("missing", "fallback")).toBe("fallback");
    });

    it("put() has() forget() work through the class", async () => {
      const c = Cache.getInstance();
      await c.put("class-test", 123);
      expect(await c.has("class-test")).toBe(true);
      await c.forget("class-test");
      expect(await c.has("class-test")).toBe(false);
    });
  });
});
