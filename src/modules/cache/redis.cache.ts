// import { createClient, type RedisClientType } from 'redis';
// import type { ICache } from './cache.interface';
// import type { CacheConfig, CacheEntry, CacheMetrics, CacheOptions } from './cache.types';

// export class RedisCache implements ICache {
//   private _client: RedisClientType | null = null;
//   private metrics: CacheMetrics;
//   private config: CacheConfig;
//   private isConnected = false;

//   constructor(config: Partial<CacheConfig> = {}) {
//     this.config = {
//       DefaultTTL: 5 * 60 * 1000, // 5 minutes
//       MaxMemorySize: 100 * 1024 * 1024, // 100MB
//       EnableMetrics: true,
//       EnableCompression: false,
//       CompressionThreshold: 1024,
//       CleanupInterval: 5 * 60 * 1000, // 5 minutes
//       ...config
//     };

//     this.metrics = {
//       Hits: 0,
//       Misses: 0,
//       HitRate: 0,
//       TotalSize: 0,
//       TotalEntries: 0,
//       OldestEntry: Date.now(),
//       NewestEntry: Date.now(),
//       AverageEntrySize: 0
//     };

//     this.initializeClient();
//   }

//   private async initializeClient(): Promise<void> {
//     try {
//       const port = process.env.CACHE_PORT ? parseInt(process.env.CACHE_PORT) : 6379;
//       this._client = createClient({
//         socket: {
//           host: process.env.CACHE_HOST || 'localhost',
//           port: port,
//         },
//         password: process.env.CACHE_PASSWORD
//       });

//       this._client.on('error', (err) => {
//         console.error('Redis client error:', err);
//         this.isConnected = false;
//       });

//       this._client.on('connect', () => {
//         console.log('Redis client connected');
//         this.isConnected = true;
//       });

//       this._client.on('disconnect', () => {
//         console.log('Redis client disconnected');
//         this.isConnected = false;
//       });

//       await this._client.connect();
//     } catch (error) {
//       console.error('Failed to initialize Redis client:', error);
//       this.isConnected = false;
//     }
//   }

//   async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
//     if (!this._client || !this.isConnected) {
//       console.warn('Redis client not connected');
//       return;
//     }

//     try {
//       const ttl = Math.floor((options.Ttl || this.config.DefaultTTL) / 1000); // Redis uses seconds
//       const timestamp = Date.now();
//       const size = this.calculateSize(value);

//       const entry: CacheEntry = {
//         Data: value,
//         Timestamp: timestamp,
//         Ttl: options.Ttl || this.config.DefaultTTL,
//         Hits: 0,
//         Size: size,
//       };

//       // Store the entry as JSON
//       const entryString = JSON.stringify(entry);
      
//       // Check if key exists for metrics
//       const exists = await this._client.exists(key);
//       if (exists === 1) {
//         const oldEntry = await this.get(key);
//         if (oldEntry) {
//           this.updateMetrics(oldEntry, 'remove');
//         }
//       }

//       await this._client.setEx(key, ttl, entryString);
//       this.updateMetrics(entry, 'add');

//     } catch (error) {
//       console.error('Redis set error:', error);
//     }
//   }

//   async get(key: string): Promise<CacheEntry | undefined> {
//     if (!this._client || !this.isConnected) {
//       this.recordMiss();
//       return undefined;
//     }

//     try {
//       const entryString = await this._client.get(key);
//       if (!entryString) {
//         this.recordMiss();
//         return undefined;
//       }

//       const entry: CacheEntry = JSON.parse(entryString);
      
//       // Update hit count
//       entry.Hits++;
//       await this._client.setEx(key, Math.floor((entry.Ttl - (Date.now() - entry.Timestamp)) / 1000), JSON.stringify(entry));
      
//       this.recordHit();
//       return entry;
//     } catch (error) {
//       console.error('Redis get error:', error);
//       this.recordMiss();
//       return undefined;
//     }
//   }

//   async has(key: string): Promise<boolean> {
//     if (!this._client || !this.isConnected) {
//       return false;
//     }

//     try {
//       const exists = await this._client.exists(key);
//       return exists === 1;
//     } catch (error) {
//       console.error('Redis has error:', error);
//       return false;
//     }
//   }

//   async delete(key: string): Promise<boolean> {
//     if (!this._client || !this.isConnected) {
//       return false;
//     }

//     try {
//       // Get entry for metrics before deletion
//       const entry = await this.get(key);
      
//       const deleted = await this._client.del(key);
      
//       if (deleted > 0 && entry) {
//         this.updateMetrics(entry, 'remove');
//       }
      
//       return deleted > 0;
//     } catch (error) {
//       console.error('Redis delete error:', error);
//       return false;
//     }
//   }

//   async clear(): Promise<void> {
//     if (!this._client || !this.isConnected) {
//       return;
//     }

//     try {
//       await this._client.flushAll();
//       this.resetMetrics();
//     } catch (error) {
//       console.error('Redis clear error:', error);
//     }
//   }

//   async findAndClear(searchPattern: string): Promise<string[]> {
//     if (!this._client || !this.isConnected) {
//       return [];
//     }

//     try {
//       const keys = await this._client.keys(`*${searchPattern}*`);
//       if (keys.length > 0) {
//         await this._client.del(keys);
        
//         // Update metrics (approximate since we can't get individual sizes easily)
//         this.metrics.TotalEntries = Math.max(0, this.metrics.TotalEntries - keys.length);
//       }
//       return keys;
//     } catch (error) {
//       console.error('Redis findAndClear error:', error);
//       return [];
//     }
//   }

//   async getMetrics(): Promise<CacheMetrics> {
//     if (!this._client || !this.isConnected) {
//       return this.metrics;
//     }

//     try {
//       // Update total entries from Redis
//       const dbSize = await this._client.dbSize();
//       this.metrics.TotalEntries = dbSize;
      
//       this.updateHitRate();
//       return { ...this.metrics };
//     } catch (error) {
//       console.error('Redis getMetrics error:', error);
//       return this.metrics;
//     }
//   }

//   async cleanup(): Promise<void> {
//     // Redis handles TTL expiration automatically
//     // This method can be used for custom cleanup logic if needed
//     console.log('Redis cleanup: TTL-based expiration is automatic');
//   }

//   // Bulk operations
//   async setMany(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<void> {
//     if (!this._client || !this.isConnected) {
//       return;
//     }

//     try {
//       const pipeline = this._client.multi();
      
//       for (const { key, value, options } of entries) {
//         const ttl = Math.floor((options?.Ttl || this.config.DefaultTTL) / 1000);
//         const entry: CacheEntry = {
//           Data: value,
//           Timestamp: Date.now(),
//           Ttl: options?.Ttl || this.config.DefaultTTL,
//           Hits: 0,
//           Size: this.calculateSize(value),
//         };
        
//         pipeline.setEx(key, ttl, JSON.stringify(entry));
        
//       }
      
//       await pipeline.exec();
//     } catch (error) {
//       console.error('Redis setMany error:', error);
//     }
//   }

//   async getMany(keys: string[]): Promise<Array<CacheEntry | undefined>> {
//     if (!this._client || !this.isConnected) {
//       return keys.map(() => undefined);
//     }

//     try {
//       const results = await this._client.mGet(keys);
//       return results.map(result => {
//         if (result) {
//           try {
//             const entry: CacheEntry = JSON.parse(result);
//             this.recordHit();
//             return entry;
//           } catch {
//             this.recordMiss();
//             return undefined;
//           }
//         } else {
//           this.recordMiss();
//           return undefined;
//         }
//       });
//     } catch (error) {
//       console.error('Redis getMany error:', error);
//       return keys.map(() => undefined);
//     }
//   }

//   async deleteMany(keys: string[]): Promise<boolean[]> {
//     if (!this._client || !this.isConnected) {
//       return keys.map(() => false);
//     }

//     try {
//       const pipeline = this._client.multi();
//       keys.forEach(key => pipeline.del(key));
      
//       const results = await pipeline.exec();
//       return results?.map(result => (result as any)?.[1] > 0) || keys.map(() => false);
//     } catch (error) {
//       console.error('Redis deleteMany error:', error);
//       return keys.map(() => false);
//     }
//   }

//   // Private helper methods
//   private calculateSize(data: any): number {
//     try {
//       return JSON.stringify(data).length * 2; // UTF-16 estimate
//     } catch {
//       return 0;
//     }
//   }

//   private recordHit(): void {
//     if (this.config.EnableMetrics) {
//       this.metrics.Hits++;
//     }
//   }

//   private recordMiss(): void {
//     if (this.config.EnableMetrics) {
//       this.metrics.Misses++;
//     }
//   }

//   private updateMetrics(entry: CacheEntry, action: 'add' | 'remove'): void {
//     if (!this.config.EnableMetrics) return;

//     if (action === 'add') {
//       this.metrics.TotalSize += entry.Size;
//       this.metrics.NewestEntry = entry.Timestamp;
//     } else {
//       this.metrics.TotalSize = Math.max(0, this.metrics.TotalSize - entry.Size);
//     }

//     this.metrics.AverageEntrySize = this.metrics.TotalEntries > 0
//       ? this.metrics.TotalSize / this.metrics.TotalEntries
//       : 0;
//   }

//   private updateHitRate(): void {
//     const total = this.metrics.Hits + this.metrics.Misses;
//     this.metrics.HitRate = total > 0 ? this.metrics.Hits / total : 0;
//   }

//   private resetMetrics(): void {
//     this.metrics = {
//       Hits: 0,
//       Misses: 0,
//       HitRate: 0,
//       TotalSize: 0,
//       TotalEntries: 0,
//       OldestEntry: Date.now(),
//       NewestEntry: Date.now(),
//       AverageEntrySize: 0
//     };
//   }

//   // Connection management
//   async disconnect(): Promise<void> {
//     if (this._client && this.isConnected) {
//       await this._client.disconnect();
//     }
//   }

//   isReady(): boolean {
//     return this.isConnected;
//   }
// }
