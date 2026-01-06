/**
 * Service Worker Registration and Management
 * Handles offline support and advanced caching strategies
 */

const SW_URL = '/sw.js';
const CACHE_VERSION = 'v1';

export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  maxAge?: number;
  maxEntries?: number;
}

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker available. Refresh to update.');
            // Optionally show update notification to user
            showUpdateNotification();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('✅ Service Worker unregistered');
      return success;
    }
    return false;
  } catch (error) {
    console.error('❌ Service Worker unregistration failed:', error);
    return false;
  }
};

/**
 * Check if service worker is active
 */
export const isServiceWorkerActive = (): boolean => {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
};

/**
 * Send message to service worker
 */
export const sendMessageToSW = async (message: any): Promise<any> => {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No active service worker');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
};

/**
 * Clear specific cache
 */
export const clearCache = async (cacheName: string): Promise<boolean> => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const deleted = await caches.delete(cacheName);
    console.log(`✅ Cache "${cacheName}" cleared`);
    return deleted;
  } catch (error) {
    console.error(`❌ Failed to clear cache "${cacheName}":`, error);
    return false;
  }
};

/**
 * Get cache size
 */
export const getCacheSize = async (): Promise<number> => {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('❌ Failed to calculate cache size:', error);
    return 0;
  }
};

/**
 * Format cache size for display
 */
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Precache critical assets
 */
export const precacheAssets = async (urls: string[]): Promise<void> => {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(`${CACHE_VERSION}-precache`);
    await cache.addAll(urls);
    console.log('✅ Critical assets precached');
  } catch (error) {
    console.error('❌ Failed to precache assets:', error);
  }
};

/**
 * Show update notification
 */
const showUpdateNotification = (): void => {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #14B8A6;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.innerHTML = `
    <span>New version available!</span>
    <button onclick="window.location.reload()" style="
      background: white;
      color: #14B8A6;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    ">Refresh</button>
    <button onclick="this.parentElement.remove()" style="
      background: transparent;
      color: white;
      border: none;
      padding: 6px;
      cursor: pointer;
      font-size: 18px;
    ">×</button>
  `;
  
  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
};

/**
 * Check for service worker updates
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to check for updates:', error);
    return false;
  }
};

/**
 * Get network status
 */
export const getNetworkStatus = (): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
};

/**
 * Listen for online/offline events
 */
export const setupNetworkListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = () => {
    console.log('🌐 Back online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('📡 Offline mode');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerActive,
  sendMessageToSW,
  clearAllCaches,
  clearCache,
  getCacheSize,
  formatCacheSize,
  precacheAssets,
  checkForUpdates,
  getNetworkStatus,
  setupNetworkListeners,
};
