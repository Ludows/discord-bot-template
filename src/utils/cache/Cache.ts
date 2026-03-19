import { config } from "../../config";
import { CacheDriver } from "./drivers/CacheDriver";
import { FileDriver } from "./drivers/FileDriver";
import { MemoryDriver } from "./drivers/MemoryDriver";

export class Cache {
  private static instance: Cache;
  private driver: CacheDriver;

  private constructor() {
    if (config.cache.driver === "file") {
      this.driver = new FileDriver(config.cache.path);
    } else {
      this.driver = new MemoryDriver();
    }
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  /**
   * Get an item from the cache.
   */
  public async get<T>(
    key: string,
    fallback: T | null = null,
  ): Promise<T | null> {
    const value = await this.driver.get<T>(key);
    return value !== null ? value : fallback;
  }

  /**
   * Store an item in the cache.
   */
  public async put<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.driver.set(key, value, ttlSeconds);
  }

  /**
   * Check if an item exists in the cache.
   */
  public async has(key: string): Promise<boolean> {
    return this.driver.has(key);
  }

  /**
   * Remove an item from the cache.
   */
  public async forget(key: string): Promise<void> {
    await this.driver.forget(key);
  }

  /**
   * Remove all items from the cache.
   */
  public async flush(): Promise<void> {
    await this.driver.flush();
  }

  /**
   * Get an item from the cache, or execute the given closure and store the result.
   */
  public async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const value = await this.get<T>(key);

    if (value !== null) {
      return value;
    }

    const newValue = await callback();
    await this.put(key, newValue, ttlSeconds);

    return newValue;
  }
}

export const cache = Cache.getInstance();
