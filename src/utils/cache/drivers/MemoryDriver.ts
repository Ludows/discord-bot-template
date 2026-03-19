import { CacheDriver } from "./CacheDriver";

interface MemoryEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class MemoryDriver implements CacheDriver {
  private storage = new Map<string, MemoryEntry<any>>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.storage.get(key);

    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.forget(key);
      return null;
    }

    return entry.value as T;
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.storage.set(key, { value, expiresAt });
  }

  public async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  public async forget(key: string): Promise<void> {
    this.storage.delete(key);
  }

  public async flush(): Promise<void> {
    this.storage.clear();
  }
}
