
import { useState, useEffect } from 'react';

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50; // Maximum number of cached images
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    
    if (entry) {
      // Check if cache entry is still valid
      if (Date.now() - entry.timestamp < this.maxAge) {
        return URL.createObjectURL(entry.blob);
      } else {
        // Remove expired entry
        this.cache.delete(url);
      }
    }
    
    return null;
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(url, {
      url,
      blob,
      timestamp: Date.now()
    });
  }

  async fetchAndCache(url: string): Promise<string> {
    try {
      const cachedUrl = await this.get(url);
      if (cachedUrl) {
        return cachedUrl;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      await this.set(url, blob);
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error caching image:', error);
      return url; // Fallback to original URL
    }
  }

  // Synchronous check for cached image
  getCachedSync(url: string): string | null {
    const entry = this.cache.get(url);
    
    if (entry) {
      // Check if cache entry is still valid
      if (Date.now() - entry.timestamp < this.maxAge) {
        return URL.createObjectURL(entry.blob);
      } else {
        // Remove expired entry
        this.cache.delete(url);
      }
    }
    
    return null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const imageCache = new ImageCache();

// Hook for LazyImage component compatibility
export function useImageCache() {
  const getCachedImage = (url: string): string | null => {
    return imageCache.getCachedSync(url);
  };

  const cacheImage = async (url: string): Promise<string> => {
    return await imageCache.fetchAndCache(url);
  };

  return { getCachedImage, cacheImage };
}

// Alternative hook for direct URL loading
export function useImageCacheWithUrl(url: string) {
  const [cachedUrl, setCachedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const cached = await imageCache.fetchAndCache(url);
        
        if (!isCancelled) {
          setCachedUrl(cached);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setCachedUrl(url); // Fallback to original URL
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadImage();
    }

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return { cachedUrl, loading, error };
}

export { imageCache };
