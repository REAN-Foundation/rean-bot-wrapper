import type { ICache } from './cache.interface.js';
import type { CacheEntry, CacheMetrics, CacheOptions } from './cache.types.js';
import { InMemoryCache } from './inmemory.cache.js';
import { StrategyManager } from './cache.strategies.js';
const REQUEST_CACHE_TYPE = 'InMemory';

///////////////////////////////////////////////////////////////////////////////

export class RequestResponseCacheService {

    private static _cache: ICache = RequestResponseCacheService.getCache();

    private static getCache(): ICache {
        if (REQUEST_CACHE_TYPE === 'InMemory') {
            return new InMemoryCache();
        }
        return new InMemoryCache();

        // return new RedisCache();
    }

    // Enhanced get with strategy support and stale-while-revalidate
    static async get(key: string, strategy?: string): Promise<any | undefined> {
        try {
            console.log('CacheService.get', key, strategy);

            const entry = await RequestResponseCacheService._cache.get(key);
            if (!entry) return undefined;

            // Check stale-while-revalidate
            // const config = strategy ? StrategyManager.getStrategy(strategy) : undefined;
            // if (config?.StaleWhileRevalidate && RequestResponseCacheService.isStale(entry)) {
            //   // Return stale data immediately, refresh in background
            //   console.log('Returning stale data, should refresh in background for key:', key);
            //   // Note: Background refresh would be implemented by the calling code
            //   // since this service doesn't know how to fetch fresh data
            // }

            return entry.Data;
        } catch (error) {
            console.error('Error in CacheService.get:', error);
            return undefined;
        }
    }

    // Get with full entry (for debugging/monitoring)
    private static async getEntry(key: string): Promise<CacheEntry | undefined> {
        try {
            return await RequestResponseCacheService._cache.get(key);
        } catch (error) {
            console.error('Error in CacheService.getEntry:', error);
            return undefined;
        }
    }

    // Enhanced set with strategy support
    static async set(key: string, value: any, strategy?: string, customOptions?: CacheOptions): Promise<void> {
        try {
            console.log('Value to be chached:', value);
            const strategyOptions = strategy ? StrategyManager.getStrategy(strategy) || {} : {};
            const options: CacheOptions = { ...strategyOptions, ...(customOptions || {}) };
            await RequestResponseCacheService._cache.set(key, value, options);
        } catch (error) {
            console.error('Error in CacheService.set:', error);
        }
    }

    // Legacy methods (maintained for backward compatibility)
    static async has(key: string): Promise<boolean> {
        try {
            return RequestResponseCacheService._cache.has(key);
        } catch (error) {
            console.error('Error in CacheService.has:', error);
            return false;
        }
    }

    static async delete(key: string): Promise<boolean> {
        try {
            return RequestResponseCacheService._cache.delete(key);
        } catch (error) {
            console.error('Error in CacheService.delete:', error);
            return false;
        }
    }

    static async deleteMany(keys: string[]): Promise<boolean[]> {
        try {
            return RequestResponseCacheService._cache.deleteMany(keys);
        } catch (error) {
            console.error('Error in CacheService.deleteMany:', error);
            return [];
        }
    }

    static async findAndClear(searchPatterns: string[]): Promise<string[]> {
        try {
            const allKeys: string[] = [];
            for (const pattern of searchPatterns) {
                const keys = await RequestResponseCacheService._cache.findAndClear(pattern);
                allKeys.push(...keys);
            }
            return allKeys;
        } catch (error) {
            console.error('Error in CacheService.findAndClear:', error);
            return [];
        }
    }

    static async clear(): Promise<void> {
        try {
            await RequestResponseCacheService._cache.clear();
        } catch (error) {
            console.error('Error in CacheService.clear:', error);
        }
    }

    static async getMetrics(): Promise<CacheMetrics> {
        try {
            return await RequestResponseCacheService._cache.getMetrics();
        } catch (error) {
            console.error('Error in CacheService.getMetrics:', error);
            return {
                Hits             : 0,
                Misses           : 0,
                HitRate          : 0,
                TotalSize        : 0,
                TotalEntries     : 0,
                OldestEntry      : 0,
                NewestEntry      : 0,
                AverageEntrySize : 0
            };
        }
    }

    static async cleanup(): Promise<void> {
        try {
            await RequestResponseCacheService._cache.cleanup();
        } catch (error) {
            console.error('Error in CacheService.cleanup:', error);
        }
    }

    // Bulk operations
    static async setMany(entries: Array<{ key: string; value: any; strategy?: string; options?:
        CacheOptions }>): Promise<void> {
        try {
            const cacheEntries = entries.map(({ key, value, strategy, options }) => {
                const strategyOptions = strategy ? StrategyManager.getStrategy(strategy) || {} : {};
                const finalOptions = { ...strategyOptions, ...options };
                return { key, value, options: finalOptions };
            });

            await RequestResponseCacheService._cache.setMany(cacheEntries);
        } catch (error) {
            console.error('Error in CacheService.setMany:', error);
        }
    }

    static async getMany(keys: string[]): Promise<Array<any | undefined>> {
        try {
            const entries = await RequestResponseCacheService._cache.getMany(keys);
            return entries.map(entry => entry?.Data);
        } catch (error) {
            console.error('Error in CacheService.getMany:', error);
            return [];
        }
    }

    // Strategy management (delegated to StrategyManager)
    static setStrategy(name: string, options: CacheOptions): void {
        try {
            StrategyManager.setStrategy(name, options);
        } catch (error) {
            console.error('Error in CacheService.setStrategy:', error);
        }
    }

    static getStrategy(name: string): CacheOptions | undefined {
        try {
            return StrategyManager.getStrategy(name);
        } catch (error) {
            console.error('Error in CacheService.getStrategy:', error);
            return undefined;
        }
    }

    static getAllStrategies(): Record<string, CacheOptions> {
        try {
            return StrategyManager.getAllStrategies();
        } catch (error) {
            console.error('Error in CacheService.getAllStrategies:', error);
            return {};
        }
    }

    static removeStrategy(name: string): boolean {
        try {
            return StrategyManager.removeStrategy(name);
        } catch (error) {
            console.error('Error in CacheService.removeStrategy:', error);
            return false;
        }
    }

    static resetStrategies(): void {
        try {
            StrategyManager.resetToDefaults();
        } catch (error) {
            console.error('Error in CacheService.resetStrategies:', error);
        }
    }

    // Cache statistics and monitoring
    static async getCacheStats(): Promise<{
        metrics: CacheMetrics;
        strategies: Record<string, CacheOptions>;
        isStaleThreshold: number;
    }> {
        try {
            const metrics = await RequestResponseCacheService.getMetrics();

            return {
                metrics,
                strategies       : StrategyManager.getAllStrategies(),
                isStaleThreshold : 0.8 // 80% of TTL
            };
        } catch (error) {
            console.error('Error in CacheService.getCacheStats:', error);
            return {
                metrics          : { Hits: 0, Misses: 0, HitRate: 0, TotalSize: 0, TotalEntries: 0, OldestEntry: 0, NewestEntry: 0, AverageEntrySize: 0 },
                strategies       : {},
                isStaleThreshold : 0.8
            };
        }
    }

}
