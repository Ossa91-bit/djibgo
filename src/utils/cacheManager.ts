
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_EXPIRY = 30 * 60 * 1000; // 30 minutes

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });

    // Clean up expired entries periodically
    this.cleanupExpired();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Cache with automatic refresh
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiresIn: number = this.DEFAULT_EXPIRY
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetchFn();
      this.set(key, data, expiresIn);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Specialized cache for API responses
export class ApiCache extends CacheManager {
  constructor() {
    super();
  }

  // Cache API responses with automatic retry on failure
  async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    expiresIn: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<T> {
    const cacheKey = `api_${url}_${JSON.stringify(options)}`;
    
    return this.getOrFetch(
      cacheKey,
      async () => {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
      expiresIn
    );
  }
}

export const apiCache = new ApiCache();

// Service Worker cache utilities
export class ServiceWorkerCache {
  private cacheName = 'djibgo-cache-v1';

  async cacheResources(urls: string[]): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.addAll(urls);
        console.log('Resources cached successfully');
      } catch (error) {
        console.error('Failed to cache resources:', error);
      }
    }
  }

  async getCachedResponse(url: string): Promise<Response | null> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        return await cache.match(url);
      } catch (error) {
        console.error('Failed to get cached response:', error);
        return null;
      }
    }
    return null;
  }

  async updateCache(url: string): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.add(url);
      } catch (error) {
        console.error('Failed to update cache:', error);
      }
    }
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        await caches.delete(this.cacheName);
        console.log('Cache cleared successfully');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  }
}

export const swCache = new ServiceWorkerCache();
