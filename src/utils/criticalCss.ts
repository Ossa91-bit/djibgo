/**
 * Critical CSS utilities for above-the-fold content
 * Helps improve First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
 */

export const criticalStyles = `
  /* Reset and base styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Hero section critical styles */
  .hero-section {
    position: relative;
    min-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Prevent layout shift for images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Loading spinner */
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Button base styles */
  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
  }

  /* Prevent flash of unstyled content */
  #root {
    min-height: 100vh;
  }
`;

/**
 * Inject critical CSS into document head
 */
export function injectCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  const styleElement = document.createElement('style');
  styleElement.id = 'critical-css';
  styleElement.textContent = criticalStyles;
  
  // Insert at the beginning of head for highest priority
  const head = document.head || document.getElementsByTagName('head')[0];
  head.insertBefore(styleElement, head.firstChild);
}

/**
 * Remove critical CSS after main styles load
 */
export function removeCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  const criticalStyle = document.getElementById('critical-css');
  if (criticalStyle) {
    // Delay removal to ensure main styles are loaded
    setTimeout(() => {
      criticalStyle.remove();
    }, 1000);
  }
}
