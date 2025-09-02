import { RequestResponseCacheService } from './request.response.cache.service';
import { CachePriority, type CacheMetrics } from './cache.types';

///////////////////////////////////////////////////////////////////////////////

export interface CacheAnalytics {
  Global: CacheMetrics;
  Recommendations: CacheRecommendation[];
  Performance: PerformanceData;
}

export interface CacheRecommendation {
  Type: 'performance' | 'memory' | 'configuration';
  Priority: CachePriority;
  Message: string;
  Metric: string;
  Value: number | string;
}

export interface PerformanceData {
  RequestCount: number;
  AverageResponseTime: number;
  SlowQueries: Array<{ key: string; time: number }>;
  PopularKeys: Array<{ key: string; hits: number }>;
}

export class CacheMonitor {
  private static instance: CacheMonitor;
  private performanceData: Map<string, any> = new Map();
  private requestLog: Array<{ key: string; hit: boolean; responseTime: number; timestamp: number }> = [];

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  async recordRequest(key: string, hit: boolean, responseTime: number): Promise<void> {
    const timestamp = Date.now();
    
    // Update performance data
    const existing = this.performanceData.get(key) || {
      hits: 0,
      misses: 0,
      totalTime: 0,
      requestCount: 0,
      averageTime: 0
    };

    existing.requestCount++;
    existing.totalTime += responseTime;
    existing.averageTime = existing.totalTime / existing.requestCount;

    if (hit) {
      existing.hits++;
    } else {
      existing.misses++;
    }

    this.performanceData.set(key, existing);

    // Add to request log (keep last 1000 requests)
    this.requestLog.push({ key, hit, responseTime, timestamp });
    if (this.requestLog.length > 1000) {
      this.requestLog.shift();
    }
  }

  async getAnalytics(): Promise<CacheAnalytics> {
    const metrics = await RequestResponseCacheService.getMetrics();
    const recommendations = this.generateRecommendations(metrics);
    const performance = this.calculatePerformanceData();

    return {
      Global: metrics,
      Recommendations: recommendations,
      Performance: performance
    };
  }

  private generateRecommendations(metrics: CacheMetrics): CacheRecommendation[] {
    const recommendations: CacheRecommendation[] = [];

    // Low hit rate recommendation
    if (metrics.HitRate < 0.5 && metrics.Hits + metrics.Misses > 100) {
      recommendations.push({
        Type: 'performance',
        Priority: CachePriority.High,
        Message: 'Cache hit rate is low. Consider increasing TTL for frequently accessed data.',
        Metric: 'hitRate',
        Value: metrics.HitRate
      });
    }

    // High memory usage recommendation
    if (metrics.TotalSize > 80 * 1024 * 1024) { // 80MB
      recommendations.push({
        Type: 'memory',
        Priority: CachePriority.Normal,
        Message: 'Cache memory usage is high. Consider implementing compression or reducing TTL.',
        Metric: 'totalSize',
        Value: `${(metrics.TotalSize / 1024 / 1024).toFixed(1)}MB`
      });
    }

    // Performance recommendations based on individual keys
    for (const [key, data] of this.performanceData.entries()) {
      const hitRate = data.hits / (data.hits + data.misses);
      if (hitRate < 0.3 && data.requestCount > 50) {
        recommendations.push({
          Type: 'configuration',
          Priority: CachePriority.Normal,
          Message: `Key "${key}" has low hit rate. Consider caching strategy.`,
          Metric: 'keyHitRate',
          Value: hitRate
        });
      }
    }

    return recommendations;
  }

  private calculatePerformanceData(): PerformanceData {
    const totalRequests = this.requestLog.length;
    const totalTime = this.requestLog.reduce((sum, req) => sum + req.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalTime / totalRequests : 0;

    // Find slow queries (top 10 slowest)
    const slowQueries = this.requestLog
      .filter(req => req.responseTime > averageResponseTime * 2)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10)
      .map(req => ({ key: req.key, time: req.responseTime }));

    // Find popular keys
    const keyStats = new Map<string, number>();
    for (const req of this.requestLog) {
      keyStats.set(req.key, (keyStats.get(req.key) || 0) + 1);
    }

    const popularKeys = Array.from(keyStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, hits]) => ({ key, hits }));

    return {
      RequestCount: totalRequests,
      AverageResponseTime: averageResponseTime,
      SlowQueries: slowQueries,
      PopularKeys: popularKeys
    };
  }

  // Clear old data
  clearOldData(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.requestLog = this.requestLog.filter(req => req.timestamp > cutoff);
  }
}
