import fs from "fs";
import path from "path";
import { logger } from "../../logger";
import { CacheDriver } from "./CacheDriver";

interface FileEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class FileDriver implements CacheDriver {
  constructor(private cachePath: string) {
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Basic hash-like filename to avoid filesystem issues with special chars
    const safeKey = Buffer.from(key).toString("hex").slice(0, 32);
    return path.join(this.cachePath, `${safeKey}.cache`);
  }

  public async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const entry: FileEntry<T> = JSON.parse(content);

      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        await this.forget(key);
        return null;
      }

      return entry.value;
    } catch (e) {
      logger.error(`[CACHE] Failed to read cache file for ${key}`, e);
      return null;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    const entry: FileEntry<T> = { value, expiresAt };

    try {
      fs.writeFileSync(filePath, JSON.stringify(entry), "utf-8");
    } catch (e) {
      logger.error(`[CACHE] Failed to write cache file for ${key}`, e);
    }
  }

  public async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  public async forget(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        logger.error(`[CACHE] Failed to delete cache file for ${key}`, e);
      }
    }
  }

  public async flush(): Promise<void> {
    try {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        if (file.endsWith(".cache")) {
          fs.unlinkSync(path.join(this.cachePath, file));
        }
      }
    } catch (e) {
      logger.error(`[CACHE] Failed to flush file cache`, e);
    }
  }
}
