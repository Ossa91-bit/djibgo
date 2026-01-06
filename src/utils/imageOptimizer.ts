/**
 * Image Optimization Utility
 * Handles WebP conversion, compression, and responsive images
 */

interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface ResponsiveImageSizes {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const DEFAULT_SIZES: ResponsiveImageSizes = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Generate optimized image URL with WebP support
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  const { quality = 85, maxWidth, maxHeight, format = 'webp' } = options;

  // If it's a Stable Diffusion API image, add optimization parameters
  if (originalUrl.includes('readdy.ai/api/search-image')) {
    const url = new URL(originalUrl);
    
    if (maxWidth) url.searchParams.set('width', maxWidth.toString());
    if (maxHeight) url.searchParams.set('height', maxHeight.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('format', format);
    
    return url.toString();
  }

  // For external images, return as-is (consider using image proxy in production)
  return originalUrl;
};

export function optimizeImageUrl(
  url: string,
  options: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const { quality = 85, width, height, format } = options;

  // If it's a Stable Diffusion image from readdy.ai
  if (url.includes('readdy.ai/api/search-image')) {
    const urlObj = new URL(url);
    
    // Add compression and quality parameters
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('fm', format || 'webp');
    
    if (width) {
      urlObj.searchParams.set('w', width.toString());
    }
    if (height) {
      urlObj.searchParams.set('h', height.toString());
    }
    
    // Add auto optimization
    urlObj.searchParams.set('auto', 'compress,format');
    
    return urlObj.toString();
  }

  // For other images, return as-is (could add CDN logic here)
  return url;
}

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (
  originalUrl: string,
  sizes: Partial<ResponsiveImageSizes> = {}
): string => {
  const imageSizes = { ...DEFAULT_SIZES, ...sizes };
  
  const srcsetArray = Object.entries(imageSizes).map(([key, width]) => {
    const optimizedUrl = getOptimizedImageUrl(originalUrl, { maxWidth: width });
    return `${optimizedUrl} ${width}w`;
  });

  return srcsetArray.join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizesAttribute = (
  breakpoints: Partial<Record<keyof ResponsiveImageSizes, string>> = {}
): string => {
  const defaultBreakpoints = {
    sm: '100vw',
    md: '100vw',
    lg: '50vw',
    xl: '33vw',
  };

  const sizes = { ...defaultBreakpoints, ...breakpoints };
  
  return [
    `(max-width: 640px) ${sizes.sm}`,
    `(max-width: 768px) ${sizes.md}`,
    `(max-width: 1024px) ${sizes.lg}`,
    sizes.xl,
  ].join(', ');
};

/**
 * Check if browser supports WebP
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
};

/**
 * Compress image using Canvas API
 */
export const compressImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> => {
  const { quality = 0.85, maxWidth = 1920, maxHeight = 1080 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Preload critical images
 */
export const preloadImage = (url: string, priority: 'high' | 'low' = 'high'): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.setAttribute('fetchpriority', priority);
  document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImages = (selector: string = 'img[data-lazy]'): void => {
  const images = document.querySelectorAll<HTMLImageElement>(selector);

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (src) img.src = src;
            if (srcset) img.srcset = srcset;

            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    images.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without Intersection Observer
    images.forEach((img) => {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
      if (src) img.src = src;
      if (srcset) img.srcset = srcset;
    });
  }
};

/**
 * Get optimal image format based on browser support
 */
export const getOptimalImageFormat = async (): Promise<'webp' | 'jpeg'> => {
  const webpSupported = await supportsWebP();
  return webpSupported ? 'webp' : 'jpeg';
};

/**
 * Calculate image dimensions maintaining aspect ratio
 */
export const calculateAspectRatioDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
};

export default {
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizesAttribute,
  supportsWebP,
  compressImage,
  preloadImage,
  lazyLoadImages,
  getOptimalImageFormat,
  calculateAspectRatioDimensions,
};
