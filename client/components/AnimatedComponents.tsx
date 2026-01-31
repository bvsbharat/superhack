import React, { useRef, useEffect } from 'react';
import { animate } from 'motion';

/**
 * Reusable Animated Components using Motion.dev
 * These wrap common UI patterns with smooth animations
 */

// ============ Fade In Component ============
interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, duration = 0.6, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        animate(ref.current!, { opacity: [0, 1] }, { duration });
      }, delay * 1000);
    }
  }, [duration, delay]);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

// ============ Slide In Component ============
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;
  duration?: number;
  delay?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'right',
  distance = 50,
  duration = 0.6,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const getTransform = () => {
        switch (direction) {
          case 'left': return [`translateX(${distance}px)`, 'translateX(0)'];
          case 'top': return [`translateY(${distance}px)`, 'translateY(0)'];
          case 'bottom': return [`translateY(-${distance}px)`, 'translateY(0)'];
          default: return [`translateX(-${distance}px)`, 'translateX(0)'];
        }
      };

      setTimeout(() => {
        animate(
          ref.current!,
          { transform: getTransform(), opacity: [0, 1] },
          { duration }
        );
      }, delay * 1000);
    }
  }, [direction, distance, duration, delay]);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

// ============ Scale In Component ============
interface ScaleInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, duration = 0.5, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        animate(
          ref.current!,
          { transform: ['scale(0.8)', 'scale(1)'], opacity: [0, 1] },
          { duration }
        );
      }, delay * 1000);
    }
  }, [duration, delay]);

  return (
    <div ref={ref} style={{ opacity: 0, transform: 'scale(0.8)' }}>
      {children}
    </div>
  );
};

// ============ Number Counter Component ============
interface CounterProps {
  from: number;
  to: number;
  duration?: number;
  formatter?: (n: number) => string;
}

export const Counter: React.FC<CounterProps> = ({
  from,
  to,
  duration = 1,
  formatter = (n) => Math.round(n).toString(),
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        { value: from },
        { value: to },
        {
          duration,
          onUpdate: ({ value }) => {
            if (ref.current) {
              ref.current.textContent = formatter(value);
            }
          },
        }
      );
    }
  }, [from, to, duration, formatter]);

  return <span ref={ref}>{from}</span>;
};

// ============ Animated Panel Component ============
interface AnimatedPanelProps {
  children: React.ReactNode;
  isExpanded: boolean;
  expandedWidth?: number | string;
  collapsedWidth?: number | string;
  duration?: number;
  className?: string;
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  children,
  isExpanded,
  expandedWidth = '100%',
  collapsedWidth = 'auto',
  duration = 0.5,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const targetWidth = isExpanded ? expandedWidth : collapsedWidth;
      animate(ref.current, { width: targetWidth as any }, { duration });
    }
  }, [isExpanded, expandedWidth, collapsedWidth, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// ============ Animated List (Stagger Animation) ============
interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 0.1,
  duration = 0.5,
  direction = 'up',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('[data-animated-item]');
      items.forEach((item, idx) => {
        const getTransform = () => {
          switch (direction) {
            case 'down': return [`translateY(-20px)`, 'translateY(0)'];
            case 'left': return [`translateX(20px)`, 'translateX(0)'];
            case 'right': return [`translateX(-20px)`, 'translateX(0)'];
            default: return [`translateY(20px)`, 'translateY(0)'];
          }
        };

        setTimeout(() => {
          animate(
            item as HTMLElement,
            { transform: getTransform(), opacity: [0, 1] },
            { duration }
          );
        }, idx * staggerDelay * 1000);
      });
    }
  }, [children, staggerDelay, duration, direction]);

  return (
    <div ref={containerRef}>
      {React.Children.map(children, (child) => (
        <div data-animated-item style={{ opacity: 0 }}>
          {child}
        </div>
      ))}
    </div>
  );
};

// ============ Bounce Animation Component ============
interface BounceProps {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
}

export const Bounce: React.FC<BounceProps> = ({ children, duration = 0.6, distance = 20 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        ref.current,
        { transform: ['translateY(0)', `translateY(-${distance}px)`, 'translateY(0)'] },
        { duration, repeat: Infinity }
      );
    }
  }, [duration, distance]);

  return <div ref={ref}>{children}</div>;
};

// ============ Glow Effect Component ============
interface GlowProps {
  children: React.ReactNode;
  glowColor?: string;
  duration?: number;
}

export const GlowEffect: React.FC<GlowProps> = ({
  glowColor = 'rgba(255, 255, 255, 0.5)',
  duration = 1.5,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        ref.current,
        {
          boxShadow: [
            `0 0 0 0px ${glowColor}`,
            `0 0 20px 10px ${glowColor}`,
            `0 0 0 0px ${glowColor}`,
          ],
        },
        { duration, repeat: Infinity }
      );
    }
  }, [glowColor, duration]);

  return <div ref={ref}>{children}</div>;
};

// ============ Pulse Animation Component ============
interface PulseProps {
  children: React.ReactNode;
  duration?: number;
}

export const Pulse: React.FC<PulseProps> = ({ children, duration = 2 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        ref.current,
        { opacity: [1, 0.5, 1] },
        { duration, repeat: Infinity }
      );
    }
  }, [duration]);

  return <div ref={ref}>{children}</div>;
};

// ============ Hero Image Animation ============
interface HeroImageProps {
  src: string;
  alt: string;
  duration?: number;
  className?: string;
}

export const AnimatedHeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  duration = 0.8,
  className = '',
}) => {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        ref.current,
        {
          transform: ['scale(0.9) translateY(30px)', 'scale(1) translateY(0)'],
          opacity: [0, 1],
        },
        {
          duration,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }
      );
    }
  }, [duration]);

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={{ opacity: 0, transform: 'scale(0.9)' }}
    />
  );
};
