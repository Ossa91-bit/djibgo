import React, { useState, useEffect } from 'react';
import { getCacheSize, formatCacheSize, clearAllCaches, getNetworkStatus } from '../../utils/serviceWorker';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

interface CacheInfo {
  size: number;
  formattedSize: string;
}

interface NetworkInfo {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
  });
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ size: 0, formattedSize: '0 Bytes' });
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkStatus());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load performance metrics
    loadPerformanceMetrics();
    
    // Load cache info
    loadCacheInfo();

    // Update network status
    const updateNetwork = () => setNetworkInfo(getNetworkStatus());
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  const loadPerformanceMetrics = () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      setMetrics({
        lcp: getLCP(),
        fid: getFID(),
        cls: getCLS(),
        ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
        fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || null,
      });
    }
  };

  const loadCacheInfo = async () => {
    const size = await getCacheSize();
    setCacheInfo({
      size,
      formattedSize: formatCacheSize(size),
    });
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all caches?')) {
      await clearAllCaches();
      await loadCacheInfo();
      alert('Cache cleared successfully!');
    }
  };

  const getLCP = (): number | null => {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : null;
  };

  const getFID = (): number | null => {
    const fidEntries = performance.getEntriesByType('first-input');
    return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : null;
  };

  const getCLS = (): number | null => {
    const clsEntries = performance.getEntriesByType('layout-shift');
    return clsEntries.reduce((sum, entry: any) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);
  };

  const getMetricStatus = (value: number | null, thresholds: { good: number; poor: number }): string => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'good': return '✓';
      case 'needs-improvement': return '⚠';
      case 'poor': return '✗';
      default: return '?';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        title="Performance Dashboard"
      >
        <i className="ri-dashboard-line text-xl"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ri-dashboard-line text-xl"></i>
          <h3 className="font-semibold">Performance Dashboard</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors whitespace-nowrap"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Core Web Vitals */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-speed-line"></i>
            Core Web Vitals
          </h4>
          <div className="space-y-2">
            {/* LCP */}
            <MetricCard
              label="LCP"
              value={metrics.lcp}
              unit="ms"
              status={getMetricStatus(metrics.lcp, { good: 2500, poor: 4000 })}
              description="Largest Contentful Paint"
            />
            
            {/* FID */}
            <MetricCard
              label="FID"
              value={metrics.fid}
              unit="ms"
              status={getMetricStatus(metrics.fid, { good: 100, poor: 300 })}
              description="First Input Delay"
            />
            
            {/* CLS */}
            <MetricCard
              label="CLS"
              value={metrics.cls}
              unit=""
              status={getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 })}
              description="Cumulative Layout Shift"
            />
          </div>
        </div>

        {/* Other Metrics */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-time-line"></i>
            Loading Metrics
          </h4>
          <div className="space-y-2">
            {/* TTFB */}
            <MetricCard
              label="TTFB"
              value={metrics.ttfb}
              unit="ms"
              status={getMetricStatus(metrics.ttfb, { good: 800, poor: 1800 })}
              description="Time to First Byte"
            />
            
            {/* FCP */}
            <MetricCard
              label="FCP"
              value={metrics.fcp}
              unit="ms"
              status={getMetricStatus(metrics.fcp, { good: 1800, poor: 3000 })}
              description="First Contentful Paint"
            />
          </div>
        </div>

        {/* Network Status */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-wifi-line"></i>
            Network Status
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${networkInfo.online ? 'text-green-600' : 'text-red-600'}`}>
                {networkInfo.online ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            {networkInfo.effectiveType && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connection:</span>
                <span className="font-medium text-gray-900">{networkInfo.effectiveType.toUpperCase()}</span>
              </div>
            )}
            {networkInfo.downlink && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-medium text-gray-900">{networkInfo.downlink} Mbps</span>
              </div>
            )}
            {networkInfo.rtt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Latency:</span>
                <span className="font-medium text-gray-900">{networkInfo.rtt} ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Cache Info */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-database-2-line"></i>
            Cache Storage
          </h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total Size:</span>
              <span className="text-sm font-semibold text-gray-900">{cacheInfo.formattedSize}</span>
            </div>
            <button
              onClick={handleClearCache}
              className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              Clear All Caches
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={loadPerformanceMetrics}
            className="flex-1 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </button>
          <button
            onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            <i className="ri-external-link-line mr-2"></i>
            PageSpeed
          </button>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  status: string;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, status, description }) => {
  const getStatusColor = (s: string): string => {
    switch (s) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (s: string): string => {
    switch (s) {
      case 'good': return '✓';
      case 'needs-improvement': return '⚠';
      case 'poor': return '✗';
      default: return '?';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor(status)}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-lg">{getStatusIcon(status)}</span>
        </div>
        <span className="text-sm font-bold">
          {value !== null ? `${value.toFixed(2)}${unit}` : 'N/A'}
        </span>
      </div>
      <p className="text-xs opacity-75">{description}</p>
    </div>
  );
};

export default PerformanceDashboard;
