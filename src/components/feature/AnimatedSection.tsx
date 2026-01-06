
import { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'zoomIn';
  delay?: number;
  duration?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  animation = 'fadeIn',
  delay = 0,
  duration = 0.6
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getAnimationClass = () => {
    const baseClass = `transition-all duration-[${Math.round(duration * 1000)}ms] ease-out`;
    
    if (!isVisible) {
      switch (animation) {
        case 'slideUp':
          return `${baseClass} opacity-0 translate-y-8`;
        case 'slideLeft':
          return `${baseClass} opacity-0 -translate-x-8`;
        case 'slideRight':
          return `${baseClass} opacity-0 translate-x-8`;
        case 'zoomIn':
          return `${baseClass} opacity-0 scale-95`;
        default:
          return `${baseClass} opacity-0`;
      }
    }

    return `${baseClass} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  return (
    <div ref={ref} className={`${getAnimationClass()} ${className}`}>
      {children}
    </div>
  );
}
