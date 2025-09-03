import type { ICache } from "./cache.interface";
import { CacheMap } from "./cache.map";
import { type CacheConfig, type CacheEntry, type CacheMetrics, type CacheOptions } from "./cache.types";

///////////////////////////////////////////////////////////////////////////////

export class InMemoryCache implements ICache {

    private cache: CacheMap<CacheEntry> = new CacheMap<CacheEntry>();

    private metrics: CacheMetrics;

    private config: CacheConfig;

    private cleanupInterval: any;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            DefaultTTL           : 30 * 60 * 1000,
            MaxMemorySize        : 50 * 1024 * 1024, //
            EnableMetrics        : true,
            EnableCompression    : false,
            CompressionThreshold : 1024,
            CleanupInterval      : 60 * 15 * 1000,
            ...config
        };

        this.metrics = {
            Hits             : 0,
            Misses           : 0,
            HitRate          : 0,
            TotalSize        : 0,
            TotalEntries     : 0,
            OldestEntry      : Date.now(),
            NewestEntry      : Date.now(),
            AverageEntrySize : 0
        };

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.config.CleanupInterval);
    }

    async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
        const ttl = options.Ttl || this.config.DefaultTTL;
        const size = this.calculateSize(value);
        const timestamp = Date.now();
        
        // Check memory limits before adding
        // if (this.metrics.TotalSize + size > this.config.MaxMemorySize) {
        //   await this.cleanup();
        
        //   // If still over limit after cleanup, reject based on priority
        //   if (this.metrics.TotalSize + size > this.config.MaxMemorySize && options.Priority !== CachePriority.High) {
        //     console.warn(`Cache memory limit exceeded for key: ${key}`);
        //     return;
        //   }
        // }

        const entry: CacheEntry = {
            Data      : value,
            Timestamp : timestamp,
            Ttl       : ttl,
            Hits      : 0,
            Size      : size,
        };

        // Remove existing entry if it exists
        if (this.cache.has(key)) {
            const oldEntry = this.cache.get(key)!;
            this.updateMetrics(oldEntry, 'remove');
        }

        this.cache.set(key, entry);
        this.updateMetrics(entry, 'add');

    }

    async get(key: string): Promise<CacheEntry | undefined> {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.recordMiss();
            return undefined;
        }

        // Check if expired
        if (this.isExpired(entry)) {
            await this.delete(key);
            this.recordMiss();
            return undefined;
        }

        entry.Hits++;
        this.recordHit();
        return entry;
    }

    async has(key: string): Promise<boolean> {
        const entry = this.cache.get(key);
        return entry !== undefined && !this.isExpired(entry);
    }

    async delete(key: string): Promise<boolean> {
        const entry = this.cache.get(key);
        if (!entry) return false;

        this.cache.delete(key);
        this.updateMetrics(entry, 'remove');
        return true;
    }

    async clear(): Promise<void> {
        this.cache.clear();
        this.resetMetrics();
    }

    async findAndClear(searchPattern: string): Promise<string[]> {
        return this.cache.findAndClear(searchPattern);
    }

    async getMetrics(): Promise<CacheMetrics> {
        this.updateHitRate();
        return { ...this.metrics };
    }

    async cleanup(): Promise<void> {
        const now = Date.now();
        const expiredKeys: string[] = [];
        const validEntries: Array<{ key: string; entry: CacheEntry }> = [];

        // Collect expired keys and valid entries
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                expiredKeys.push(key);
            } else {
                validEntries.push({ key, entry });
            }
        }

        // Remove expired entries
        for (const key of expiredKeys) {
            await this.delete(key);
        }

        // If still over limits, remove least recently used
        if (this.metrics.TotalSize > this.config.MaxMemorySize) {

            // Sort by last access time (timestamp + hits as proxy for LRU)
            validEntries.sort((a, b) => {
                const aScore = a.entry.Timestamp + (a.entry.Hits * 1000);
                const bScore = b.entry.Timestamp + (b.entry.Hits * 1000);
                return aScore - bScore;
            });

            // Remove oldest entries until under limits
            let index = 0;
            while (this.metrics.TotalSize > this.config.MaxMemorySize && index < validEntries.length) {
                await this.delete(validEntries[index].key);
                index++;
            }
        }
    }

    // Bulk operations
    async setMany(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<void> {
        await Promise.all(entries.map(({ key, value, options }) => this.set(key, value, options)));
    }

    async getMany(keys: string[]): Promise<Array<CacheEntry | undefined>> {
        return Promise.all(keys.map(key => this.get(key)));
    }

    async deleteMany(keys: string[]): Promise<boolean[]> {
        return Promise.all(keys.map(key => this.delete(key)));
    }

    // Private helper methods
    private isExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.Timestamp > entry.Ttl;
    }

    private calculateSize(data: any): number {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch {

            // Fallback for environments without Blob
            return JSON.stringify(data).length * 2; // Rough UTF-16 estimate
        }
    }

    private recordHit(): void {
        if (this.config.EnableMetrics) {
            this.metrics.Hits++;
        }
    }

    private recordMiss(): void {
        if (this.config.EnableMetrics) {
            this.metrics.Misses++;
        }
    }

    private updateMetrics(entry: CacheEntry, action: 'add' | 'remove'): void {
        if (!this.config.EnableMetrics) return;

        if (action === 'add') {
            this.metrics.TotalEntries++;
            this.metrics.TotalSize += entry.Size;
            this.metrics.NewestEntry = entry.Timestamp;
            if (entry.Timestamp < this.metrics.OldestEntry || this.metrics.TotalEntries === 1) {
                this.metrics.OldestEntry = entry.Timestamp;
            }
        } else {
            this.metrics.TotalEntries = Math.max(0, this.metrics.TotalEntries - 1);
            this.metrics.TotalSize = Math.max(0, this.metrics.TotalSize - entry.Size);
        }

        this.metrics.AverageEntrySize = this.metrics.TotalEntries > 0
            ? this.metrics.TotalSize / this.metrics.TotalEntries
            : 0;
    }

    private updateHitRate(): void {
        const total = this.metrics.Hits + this.metrics.Misses;
        this.metrics.HitRate = total > 0 ? this.metrics.Hits / total : 0;
    }

    private resetMetrics(): void {
        this.metrics = {
            Hits             : 0,
            Misses           : 0,
            HitRate          : 0,
            TotalSize        : 0,
            TotalEntries     : 0,
            OldestEntry      : Date.now(),
            NewestEntry      : Date.now(),
            AverageEntrySize : 0
        };
    }

    // Cleanup interval management
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

}
