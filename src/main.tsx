import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { injectCriticalCSS, removeCriticalCSS } from './utils/criticalCss';
import { prefetchData } from './lib/supabase';
import { initCompatibility } from './utils/browserCompatibility';

// Initialize browser compatibility fixes
initCompatibility();

// Inject critical CSS immediately for better FCP
injectCriticalCSS();

// Prefetch critical data
if (typeof window !== 'undefined') {
  // Prefetch in background after initial render
  setTimeout(() => {
    prefetchData(['categories', 'locations']).catch(() => {
      // Ignore prefetch errors
    });
  }, 100);
}

// Register service worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registered');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (window.confirm('Nouvelle version disponible ! Recharger pour mettre à jour ?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(() => {
        // Service worker registration failed, continue without it
      });
  });
}

// Performance monitoring
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  performance.mark('app-init-start');

  // Monitor Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcpValue = (lastEntry as any).renderTime || (lastEntry as any).loadTime;
        console.log('📊 LCP:', lcpValue.toFixed(2), 'ms', lcpValue < 2500 ? '(Good)' : lcpValue < 4000 ? '(Needs Improvement)' : '(Poor)');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fidValue = entry.processingStart - entry.startTime;
          console.log('📊 FID:', fidValue.toFixed(2), 'ms', fidValue < 100 ? '(Good)' : fidValue < 300 ? '(Needs Improvement)' : '(Poor)');
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        console.log('📊 CLS:', clsScore.toFixed(4), clsScore < 0.1 ? '(Good)' : clsScore < 0.25 ? '(Needs Improvement)' : '(Poor)');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // Performance monitoring not supported
    }
  }
}

// Render app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Remove critical CSS after app loads
window.addEventListener('load', () => {
  if (import.meta.env.DEV) {
    performance.mark('app-init-end');
    performance.measure('app-initialization', 'app-init-start', 'app-init-end');
    
    const measure = performance.getEntriesByName('app-initialization')[0];
    console.log('⚡ App initialization time:', measure.duration.toFixed(2), 'ms');
  }
  
  // Remove critical CSS
  removeCriticalCSS();
});
