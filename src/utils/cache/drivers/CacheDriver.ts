export interface CacheDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  forget(key: string): Promise<void>;
  flush(): Promise<void>;
}
