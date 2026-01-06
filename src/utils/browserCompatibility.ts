/**
 * Browser Compatibility Utilities
 * Ensures the app works across all modern browsers
 */

/**
 * Polyfill for browsers that don't support certain features
 */
export const initBrowserCompatibility = () => {
  // Polyfill for Promise.allSettled (older browsers)
  if (!Promise.allSettled) {
    Promise.allSettled = function (promises) {
      return Promise.all(
        promises.map((promise) =>
          Promise.resolve(promise)
            .then((value) => ({ status: 'fulfilled', value }))
            .catch((reason) => ({ status: 'rejected', reason }))
        )
      );
    };
  }

  // Polyfill for Array.prototype.at (older browsers)
  if (!Array.prototype.at) {
    Array.prototype.at = function (index) {
      const len = this.length;
      const relativeIndex = index >= 0 ? index : len + index;
      if (relativeIndex < 0 || relativeIndex >= len) {
        return undefined;
      }
      return this[relativeIndex];
    };
  }

  // Polyfill for String.prototype.replaceAll (older browsers)
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search, replace) {
      return this.split(search).join(replace);
    };
  }

  // Fix for Safari's back/forward cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Page was loaded from cache, reload to ensure fresh state
      window.location.reload();
    }
  });

  // Fix for iOS Safari viewport height issue
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  // Prevent zoom on input focus (iOS Safari)
  const preventZoom = () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const content = viewportMeta.getAttribute('content') || '';
      if (!content.includes('maximum-scale')) {
        viewportMeta.setAttribute(
          'content',
          `${content}, maximum-scale=1.0, user-scalable=no`
        );
      }
    }
  };
  preventZoom();

  // Fix for Chrome's passive event listener warning
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassive = true;
        return true;
      },
    });
    window.addEventListener('testPassive', null as any, opts);
    window.removeEventListener('testPassive', null as any, opts);
  } catch (e) {
    // Passive not supported
  }

  // Store for use in event listeners
  (window as any).__supportsPassive = supportsPassive;
};

/**
 * Detect browser and version
 */
export const detectBrowser = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
    version = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browser, version };
};

/**
 * Check if browser is supported
 */
export const isBrowserSupported = () => {
  const { browser, version } = detectBrowser();
  const versionNum = parseInt(version, 10);

  const minVersions: Record<string, number> = {
    Chrome: 87,
    Firefox: 78,
    Safari: 14,
    Edge: 88,
    Opera: 73,
  };

  if (browser === 'Unknown') return true; // Assume supported if unknown

  return versionNum >= (minVersions[browser] || 0);
};

/**
 * Show browser compatibility warning
 */
export const showBrowserWarning = () => {
  if (!isBrowserSupported()) {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b6b;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    `;
    warning.innerHTML = `
      ⚠️ Votre navigateur n'est pas entièrement supporté. 
      Veuillez mettre à jour votre navigateur pour une meilleure expérience.
      <button onclick="this.parentElement.remove()" style="margin-left: 10px; padding: 4px 12px; background: white; color: #ff6b6b; border: none; border-radius: 4px; cursor: pointer;">
        Fermer
      </button>
    `;
    document.body.insertBefore(warning, document.body.firstChild);
  }
};

/**
 * Initialize all compatibility fixes
 */
export const initCompatibility = () => {
  initBrowserCompatibility();
  
  // Log browser info in development
  if (import.meta.env.DEV) {
    const { browser, version } = detectBrowser();
    console.log(`🌐 Browser: ${browser} ${version}`);
    console.log(`✅ Supported: ${isBrowserSupported()}`);
  }
};
