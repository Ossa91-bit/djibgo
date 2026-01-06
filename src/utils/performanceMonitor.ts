// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {
    this.initWebVitals();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.metrics.set('LCP', lcp);
        console.log('✅ LCP:', lcp.toFixed(2), 'ms', lcp < 2500 ? '(Good)' : lcp < 4000 ? '(Needs Improvement)' : '(Poor)');
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.set('FID', fid);
          console.log('✅ FID:', fid.toFixed(2), 'ms', fid < 100 ? '(Good)' : fid < 300 ? '(Needs Improvement)' : '(Poor)');
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation not supported');
    }
  }

  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.set('CLS', clsValue);
            console.log('✅ CLS:', clsValue.toFixed(3), clsValue < 0.1 ? '(Good)' : clsValue < 0.25 ? '(Needs Improvement)' : '(Poor)');
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation not supported');
    }
  }

  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.metrics.set('TTFB', ttfb);
        console.log('✅ TTFB:', ttfb.toFixed(2), 'ms', ttfb < 800 ? '(Good)' : ttfb < 1800 ? '(Needs Improvement)' : '(Poor)');
      }
    } catch (e) {
      console.warn('TTFB observation not supported');
    }
  }

  getMetrics(): Map<string, number> {
    return this.metrics;
  }

  logMetrics() {
    console.group('📊 Performance Metrics');
    this.metrics.forEach((value, key) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  // Track custom metrics
  mark(name: string) {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`⏱️ ${name}:`, measure.duration.toFixed(2), 'ms');
      return measure.duration;
    } catch (e) {
      console.warn(`Could not measure ${name}`);
      return 0;
    }
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  PerformanceMonitor.getInstance();
}

export default PerformanceMonitor;
