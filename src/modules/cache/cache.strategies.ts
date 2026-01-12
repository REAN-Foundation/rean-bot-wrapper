import { CachePriority, type CacheOptions } from './cache.types';

///////////////////////////////////////////////////////////////////////////////

// Universal cache strategies for any application
export const CacheStrategies: Record<string, CacheOptions> = {

    // 1. STATIC CONTENT - Never changes or changes very rarely
    static : {
        Ttl                  : 24 * 60 * 60 * 1000, // 24 hours
        StaleWhileRevalidate : true,
        Priority             : CachePriority.Low
    },

    // 2. CONFIGURATION - App settings, feature flags
    config : {
        Ttl                  : 60 * 60 * 1000, // 1 hour
        StaleWhileRevalidate : true,
        Priority             : CachePriority.Normal
    },

    // 3. USER DATA - User profiles, preferences, sessions
    user : {
        Ttl                  : 15 * 60 * 1000, // 15 minutes
        StaleWhileRevalidate : true,
        Priority             : CachePriority.High
    },

    // 4. BUSINESS DATA - Core business entities
    //   business: {
    //     Ttl: 30 * 60 * 1000, // 30 minutes
    //     Tags: ['business'],
    //     StaleWhileRevalidate: true,
    //     Priority: CachePriority.High
    //   },

    //   // 5. SEARCH RESULTS - Query results, filtered data
    //   search: {
    //     Ttl: 10 * 60 * 1000, // 10 minutes
    //     Tags: ['search'],
    //     StaleWhileRevalidate: true,
    //     Priority: CachePriority.Normal
    //   },

    //   // 6. REAL-TIME DATA - Live feeds, notifications, stock prices
    //   realtime: {
    //     Ttl: 30 * 1000, // 30 seconds
    //     Tags: ['realtime'],
    //     StaleWhileRevalidate: false,
    //     Priority: CachePriority.Normal
    //   },

    //   // 7. API RESPONSES - External API calls
    //   api: {
    //     Ttl: 5 * 60 * 1000, // 5 minutes
    //     Tags: ['api'],
    //     StaleWhileRevalidate: true,
    //     Priority: CachePriority.Normal
    //   },

    //   // 8. COMPUTED DATA - Expensive calculations, aggregations
    //   computed: {
    //     Ttl: 60 * 60 * 1000, // 1 hour
    //     Tags: ['computed'],
    //     StaleWhileRevalidate: true,
    //     Priority: CachePriority.Low
    //   },

    //   // 9. SESSION DATA - Temporary user state
    //   session: {
    //     Ttl: 2 * 60 * 60 * 1000, // 2 hours
    //     Tags: ['session'],
    //     StaleWhileRevalidate: false,
    //     Priority: CachePriority.High
    //   },

//   // 10. TEMPORARY DATA - Short-lived cache
//   temp: {
//     Ttl: 5 * 60 * 1000, // 5 minutes
//     Tags: ['temp'],
//     StaleWhileRevalidate: false,
//     Priority: CachePriority.Low
//   }
};

// Strategy management functions
export class StrategyManager {

    private static strategies = { ...CacheStrategies };

    // Get a strategy by name
    static getStrategy(name: string): CacheOptions | undefined {
        return this.strategies[name];
    }

    // Get all strategies
    static getAllStrategies(): Record<string, CacheOptions> {
        return { ...this.strategies };
    }

    // Add or update a strategy
    static setStrategy(name: string, options: CacheOptions): void {
        this.strategies[name] = options;
    }

    // Remove a strategy
    static removeStrategy(name: string): boolean {
        if (this.strategies[name]) {
            delete this.strategies[name];
            return true;
        }
        return false;
    }

    // Reset to default strategies
    static resetToDefaults(): void {
        this.strategies = { ...CacheStrategies };
    }

    // Get strategy names
    static getStrategyNames(): string[] {
        return Object.keys(this.strategies);
    }

    // Validate strategy options
    static validateStrategy(options: CacheOptions): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!options.Ttl || options.Ttl <= 0) {
            errors.push('Ttl must be a positive number');
        }

        if (options.Priority && !['low', 'normal', 'high'].includes(options.Priority)) {
            errors.push('Priority must be low, normal, or high');
        }

        return {
            valid : errors.length === 0,
            errors
        };
    }

}

// Export default strategies
export default CacheStrategies;
