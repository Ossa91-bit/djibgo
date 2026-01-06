import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl, supportsWebP } from '../../utils/imageOptimizer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function LazyImage({
  src,
  alt,
  className = '',
  priority = false,
  quality = 85,
  width,
  height,
  objectFit = 'cover',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [webpSupported, setWebpSupported] = useState(true);

  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      const format = webpSupported ? 'webp' : 'jpeg';
      const optimizedSrc = optimizeImageUrl(src, { quality, width, height, format });
      setImageSrc(optimizedSrc);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, src, quality, width, height, webpSupported]);

  useEffect(() => {
    if (isInView && !imageSrc) {
      const format = webpSupported ? 'webp' : 'jpeg';
      const optimizedSrc = optimizeImageUrl(src, { quality, width, height, format });
      setImageSrc(optimizedSrc);
    }
  }, [isInView, src, quality, width, height, imageSrc, webpSupported]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const aspectRatio = width && height ? `${width}/${height}` : undefined;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        aspectRatio,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%'
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        width={width}
        height={height}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit }}
      />
    </div>
  );
}
