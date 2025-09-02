export interface CacheEntry<T = any> {
    Data: T;
    Timestamp: number;
    Ttl: number;
    Hits: number;
    Size: number;
    LastModified?: string;
  }
  
export enum CachePriority {
    Low = 'Low',
    Normal = 'Normal',
    High = 'High'
  }

export interface CacheOptions {
    Ttl?: number;
    Compress?: boolean;
    StaleWhileRevalidate?: boolean;
    Force?: boolean;
    Priority?: CachePriority;
  }
  
export interface CacheMetrics {
    Hits: number;
    Misses: number;
    HitRate: number;
    TotalSize: number;
    TotalEntries: number;
    OldestEntry: number;
    NewestEntry: number;
    AverageEntrySize: number;
  }
  
export interface CacheConfig {
    DefaultTTL: number;
    MaxMemorySize: number;
    EnableMetrics: boolean;
    EnableCompression: boolean;
    CompressionThreshold: number;
    CleanupInterval: number;
  }

export interface CacheStrategy {
    Name: string;
    Ttl: number;
    Tags: string[];
    StaleWhileRevalidate?: boolean;
    Priority?: CachePriority;
    MaxSize?: number;
  }
