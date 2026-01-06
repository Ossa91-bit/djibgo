
import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function usePerformance() {
  const measurePerformance = useCallback((): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    return {
      loadTime,
      renderTime,
      memoryUsage
    };
  }, []);

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (imageUrls: string[]): Promise<void> => {
    const promises = imageUrls.map(url => preloadImage(url));
    await Promise.all(promises);
  }, [preloadImage]);

  const optimizeImages = useCallback((images: NodeListOf<HTMLImageElement>): void => {
    images.forEach(img => {
      // Add loading="lazy" if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  useEffect(() => {
    // Optimize existing images on mount
    const images = document.querySelectorAll('img');
    optimizeImages(images);

    // Set up performance monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', (entry as PerformanceEventTiming).processingStart - entry.startTime);
        }
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

    return () => {
      observer.disconnect();
    };
  }, [optimizeImages]);

  return {
    measurePerformance,
    preloadImage,
    preloadImages,
    optimizeImages,
    debounce,
    throttle
  };
}
