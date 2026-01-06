/**
 * Query Optimizer for Supabase
 * Implements caching, batching, and performance optimizations
 */

interface QueryCache {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class QueryOptimizer {
  private cache: Map<string, QueryCache> = new Map();
  private pendingQueries: Map<string, Promise<any>> = new Map();
  private batchQueue: Array<{ key: string; query: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Execute query with caching
   */
  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl = 300000, forceRefresh = false } = options; // 5 minutes default

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getFromCache<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Check if query is already pending (deduplication)
    const pending = this.pendingQueries.get(key);
    if (pending) {
      return pending;
    }

    // Execute query
    const queryPromise = queryFn()
      .then((result) => {
        this.setCache(key, result, ttl);
        this.pendingQueries.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingQueries.delete(key);
        throw error;
      });

    this.pendingQueries.set(key, queryPromise);
    return queryPromise;
  }

  /**
   * Batch multiple queries together
   */
  async batchQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ key, query: queryFn, resolve, reject });

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Execute batch after 10ms or when queue reaches 10 items
      if (this.batchQueue.length >= 10) {
        this.executeBatch();
      } else {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 10);
      }
    });
  }

  /**
   * Execute batched queries
   */
  private async executeBatch() {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Execute all queries in parallel
    const results = await Promise.allSettled(
      batch.map(({ query }) => query())
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batch[index].resolve(result.value);
      } else {
        batch[index].reject(result.reason);
      }
    });
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });

    // Limit cache size to 100 items
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Prefetch data
   */
  async prefetch(key: string, queryFn: () => Promise<any>, ttl = 300000) {
    // Execute in background without blocking
    this.query(key, queryFn, { ttl }).catch(() => {
      // Ignore prefetch errors
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingQueries: this.pendingQueries.size,
    };
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();

// Cache duration constants
export const CACHE_TTL = {
  SHORT: 60000,        // 1 minute
  MEDIUM: 300000,      // 5 minutes
  LONG: 900000,        // 15 minutes
  VERY_LONG: 3600000,  // 1 hour
};

// Query keys
export const QUERY_KEYS = {
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  PROFESSIONALS: 'professionals',
  SERVICES: 'services',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  PROFILE: 'profile',
  WALLET: 'wallet',
};
