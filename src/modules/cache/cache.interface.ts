import type { CacheEntry, CacheMetrics, CacheOptions } from "./cache.types";

///////////////////////////////////////////////////////////////////////////////

export interface ICache {

  // Basic operations
  set(key: string, value: unknown, options?: CacheOptions): Promise<void>;
  get(key: string): Promise<CacheEntry | undefined>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  
  // Advanced operations
  findAndClear(searchPattern: string): Promise<string[]>;
  
  // Metrics and monitoring
  getMetrics(): Promise<CacheMetrics>;
  cleanup(): Promise<void>;
  
  // Bulk operations
  setMany(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<void>;
  getMany(keys: string[]): Promise<Array<CacheEntry | undefined>>;
  deleteMany(keys: string[]): Promise<boolean[]>;
}
