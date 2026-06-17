import { createClient } from 'redis';
import type { ICache } from './cache.interface';
import type { CacheEntry, CacheMetrics, CacheOptions } from './cache.types';

///////////////////////////////////////////////////////////////////////////////

// Redis-backed cache used when CACHE_PROVIDER=redis. Designed to be safe:
//  - bounded connect (won't hang startup if Redis is unreachable),
//  - fail-open (any error degrades to a miss / no-op rather than throwing),
//  - honours the "persistent" strategy (Ttl null/0 => stored WITHOUT expiry, so
//    per-tenant bot-secrets survive — a fixed TTL here would silently drop them).
export class RedisCache implements ICache {

    private client: ReturnType<typeof createClient>;

    private connectPromise: Promise<unknown>;

    private metrics: CacheMetrics = {
        Hits             : 0,
        Misses           : 0,
        HitRate          : 0,
        TotalSize        : 0,
        TotalEntries     : 0,
        OldestEntry      : Date.now(),
        NewestEntry      : Date.now(),
        AverageEntrySize : 0
    };

    constructor() {
        const host = process.env.CACHE_HOST || 'localhost';
        const port = process.env.CACHE_PORT ? parseInt(process.env.CACHE_PORT, 10) : 6379;
        this.client = createClient({
            socket : {
                host,
                port,
                connectTimeout   : 8000,
                // Give up after a few attempts so connect() rejects instead of retrying
                // forever — keeps startup from hanging when Redis is down.
                reconnectStrategy : (retries: number) =>
                    (retries > 5 ? new Error('redis unavailable') : Math.min(retries * 200, 2000))
            },
            password : process.env.CACHE_PASSWORD || undefined
        });
        this.client.on('error', (err) => console.error('Redis cache error:', err?.message || err));
        this.client.on('ready', () => console.log(`Redis cache connected: ${host}:${port}`));
        this.connectPromise = this.client.connect().catch(
            (e) => console.error('Redis cache initial connect failed (continuing in-process):', e?.message || e)
        );
    }

    // Await the initial connection once, then report whether the socket is open.
    private async ready(): Promise<boolean> {
        try { await this.connectPromise; } catch { /* logged in ctor */ }
        return this.client.isOpen;
    }

    async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
        if (!(await this.ready())) return;
        try {
            const ttl = options.Ttl;   // null/undefined for the "persistent" strategy
            const entry: CacheEntry = {
                Data      : value,
                Timestamp : Date.now(),
                Ttl       : (ttl ?? null) as any,
                Hits      : 0,
                Size      : this.calculateSize(value)
            };
            const payload = JSON.stringify(entry);
            if (ttl && ttl > 0) {
                await this.client.set(key, payload, { PX: ttl });
            } else {
                await this.client.set(key, payload);   // persistent — no expiry
            }
            this.metrics.NewestEntry = entry.Timestamp;
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async get(key: string): Promise<CacheEntry | undefined> {
        if (!(await this.ready())) { this.metrics.Misses++; return undefined; }
        try {
            const raw = await this.client.get(key);
            if (!raw) { this.metrics.Misses++; return undefined; }
            this.metrics.Hits++;
            return JSON.parse(raw) as CacheEntry;
        } catch (error) {
            console.error('Redis get error:', error);
            this.metrics.Misses++;
            return undefined;
        }
    }

    async has(key: string): Promise<boolean> {
        if (!(await this.ready())) return false;
        try { return (await this.client.exists(key)) === 1; } catch { return false; }
    }

    async delete(key: string): Promise<boolean> {
        if (!(await this.ready())) return false;
        try { return (await this.client.del(key)) > 0; } catch { return false; }
    }

    async clear(): Promise<void> {
        if (!(await this.ready())) return;
        try { await this.client.flushDb(); } catch (error) { console.error('Redis clear error:', error); }
    }

    async findAndClear(searchPattern: string): Promise<string[]> {
        if (!(await this.ready())) return [];
        try {
            const keys = await this.client.keys(`*${searchPattern}*`);
            if (keys.length > 0) { await this.client.del(keys); }
            return keys;
        } catch (error) {
            console.error('Redis findAndClear error:', error);
            return [];
        }
    }

    async getMetrics(): Promise<CacheMetrics> {
        const total = this.metrics.Hits + this.metrics.Misses;
        this.metrics.HitRate = total > 0 ? this.metrics.Hits / total : 0;
        try { if (await this.ready()) { this.metrics.TotalEntries = await this.client.dbSize(); } } catch { /* ignore */ }
        return { ...this.metrics };
    }

    async cleanup(): Promise<void> {
        // Redis expires keys via TTL automatically — nothing to sweep.
    }

    async setMany(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<void> {
        await Promise.all(entries.map(({ key, value, options }) => this.set(key, value as any, options)));
    }

    async getMany(keys: string[]): Promise<Array<CacheEntry | undefined>> {
        return Promise.all(keys.map(key => this.get(key)));
    }

    async deleteMany(keys: string[]): Promise<boolean[]> {
        return Promise.all(keys.map(key => this.delete(key)));
    }

    private calculateSize(data: any): number {
        try { return JSON.stringify(data).length * 2; } catch { return 0; }
    }

}
