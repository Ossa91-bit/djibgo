// Service Worker for DjibGo - Optimized for Performance
const CACHE_VERSION = 'djibgo-v1.0.5';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Cache size limits
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('djibgo-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls (always fetch fresh)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip external APIs (except images)
  if (url.origin !== location.origin && !isImageRequest(request)) {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      
      // Limit cache size
      limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
      
      // Cache the image
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Image fetch failed:', error);
    // Return a placeholder or offline image if available
    return new Response('', { status: 404, statusText: 'Image not found' });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Static fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(STATIC_CACHE);
      return offlineCache.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Limit cache size
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
      
      // Cache the response
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Dynamic fetch failed, trying cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(STATIC_CACHE);
      return offlineCache.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Helper: Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname) || 
         url.hostname.includes('readdy.ai') && url.pathname.includes('/api/search-image');
}

// Helper: Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname) ||
         url.pathname === '/' ||
         url.pathname === '/index.html' ||
         url.pathname === '/manifest.json';
}

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
