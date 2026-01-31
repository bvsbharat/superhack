import { animate } from 'motion';

/**
 * Motion.dev Animation Utilities for Smooth App Experience
 * https://motion.dev/docs
 */

// ============ Element Animations ============

export const fadeIn = (element: HTMLElement, duration = 0.6) => {
  return animate(element, { opacity: [0, 1] }, { duration });
};

export const slideInFromRight = (element: HTMLElement, distance = 50, duration = 0.6) => {
  return animate(element, { transform: [`translateX(${distance}px)`, 'translateX(0)'], opacity: [0, 1] }, { duration });
};

export const slideInFromLeft = (element: HTMLElement, distance = 50, duration = 0.6) => {
  return animate(element, { transform: [`translateX(-${distance}px)`, 'translateX(0)'], opacity: [0, 1] }, { duration });
};

export const slideInFromTop = (element: HTMLElement, distance = 50, duration = 0.6) => {
  return animate(element, { transform: [`translateY(-${distance}px)`, 'translateY(0)'], opacity: [0, 1] }, { duration });
};

export const slideInFromBottom = (element: HTMLElement, distance = 50, duration = 0.6) => {
  return animate(element, { transform: [`translateY(${distance}px)`, 'translateY(0)'], opacity: [0, 1] }, { duration });
};

export const scaleIn = (element: HTMLElement, duration = 0.5) => {
  return animate(element, { transform: ['scale(0.8)', 'scale(1)'], opacity: [0, 1] }, { duration });
};

export const bounce = (element: HTMLElement, iterations = 1, duration = 0.6) => {
  return animate(
    element,
    { transform: ['translateY(0)', 'translateY(-20px)', 'translateY(0)'] },
    { duration, repeat: iterations - 1 }
  );
};

export const pulse = (element: HTMLElement, iterations = Infinity, duration = 2) => {
  return animate(element, { opacity: [1, 0.5, 1] }, { duration, repeat: iterations - 1 });
};

export const rotateIn = (element: HTMLElement, duration = 0.6) => {
  return animate(element, { transform: ['rotate(-10deg) scale(0.8)', 'rotate(0deg) scale(1)'], opacity: [0, 1] }, { duration });
};

// ============ Number Counter Animations ============

export const countUpNumber = async (
  element: HTMLElement,
  start: number,
  end: number,
  duration = 1,
  formatter = (n: number) => Math.round(n).toString()
) => {
  return new Promise(resolve => {
    animate(
      { value: start },
      { value: end },
      {
        duration,
        onUpdate: ({ value }) => {
          element.textContent = formatter(value);
        },
        onComplete: () => resolve(null),
      }
    );
  });
};

// ============ Position/Transform Animations ============

export const moveElement = (
  element: HTMLElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  duration = 0.6
) => {
  return animate(
    element,
    {
      transform: [
        `translate(${fromX}px, ${fromY}px)`,
        `translate(${toX}px, ${toY}px)`
      ]
    },
    { duration }
  );
};

export const smoothTransition = (
  element: HTMLElement,
  props: Record<string, any>,
  duration = 0.6
) => {
  return animate(element, props, { duration, easing: 'ease-in-out' });
};

// ============ Color & Background Animations ============

export const colorTransition = (
  element: HTMLElement,
  fromColor: string,
  toColor: string,
  duration = 0.6
) => {
  return animate(element, { backgroundColor: [fromColor, toColor] }, { duration });
};

export const glowEffect = (
  element: HTMLElement,
  glowColor: string,
  iterations = Infinity,
  duration = 1.5
) => {
  return animate(
    element,
    {
      boxShadow: [
        `0 0 0 0px ${glowColor}`,
        `0 0 20px 10px ${glowColor}`,
        `0 0 0 0px ${glowColor}`
      ]
    },
    { duration, repeat: iterations - 1 }
  );
};

// ============ Chart/Graph Animations ============

export const barChartRise = (element: HTMLElement, duration = 0.8) => {
  return animate(
    element,
    { transform: ['scaleY(0)', 'scaleY(1)'], opacity: [0, 1] },
    { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );
};

export const chartDataFlow = (
  element: HTMLElement,
  itemCount: number,
  staggerDelay = 0.05,
  duration = 0.6
) => {
  const items = element.querySelectorAll('[data-chart-item]');
  items.forEach((item, idx) => {
    setTimeout(() => {
      animate(
        item as HTMLElement,
        { transform: ['translateY(20px)', 'translateY(0)'], opacity: [0, 1] },
        { duration }
      );
    }, idx * staggerDelay * 1000);
  });
};

// ============ Player/Object Movement ============

export const playerMovement = (
  element: HTMLElement,
  targetX: number,
  targetY: number,
  duration = 0.5
) => {
  return animate(
    element,
    { transform: `translate(${targetX}px, ${targetY}px)` },
    { duration, easing: 'ease-in-out' }
  );
};

export const ballTrajectory = (
  element: HTMLElement,
  points: Array<{ x: number; y: number }>,
  totalDuration = 1
) => {
  const durationPerPoint = totalDuration / (points.length - 1);
  let current = 0;

  const animate_segment = () => {
    if (current >= points.length - 1) return;

    const from = points[current];
    const to = points[current + 1];

    animate(
      element,
      { transform: `translate(${from.x}px, ${from.y}px)` },
      { duration: 0 }
    );

    animate(
      element,
      { transform: `translate(${to.x}px, ${to.y}px)` },
      { duration: durationPerPoint, onComplete: () => {
        current++;
        animate_segment();
      }}
    );
  };

  animate_segment();
};

// ============ Compound/Sequence Animations ============

export const heroImageAnimation = (element: HTMLElement) => {
  // 1. Fade in + Zoom in
  // 2. Subtle parallax/depth effect
  return animate(
    element,
    {
      transform: ['scale(0.9) translateY(30px)', 'scale(1) translateY(0)'],
      opacity: [0, 1]
    },
    { duration: 0.8, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
  );
};

export const panelExpand = (element: HTMLElement, fromWidth: number, toWidth: number, duration = 0.5) => {
  return animate(element, { width: [fromWidth, toWidth] }, { duration, easing: 'ease-in-out' });
};

export const panelCollapse = (element: HTMLElement, fromWidth: number, toWidth: number, duration = 0.5) => {
  return animate(element, { width: [fromWidth, toWidth] }, { duration, easing: 'ease-in-out' });
};

// ============ Stagger Group Animations ============

export const staggerChildren = (
  container: HTMLElement,
  selector: string,
  animationFn: (el: HTMLElement) => void,
  staggerDelay = 0.1
) => {
  const children = container.querySelectorAll(selector);
  children.forEach((child, idx) => {
    setTimeout(() => {
      animationFn(child as HTMLElement);
    }, idx * staggerDelay * 1000);
  });
};

export const staggerFadeIn = (container: HTMLElement, selector: string, staggerDelay = 0.1, duration = 0.5) => {
  const children = container.querySelectorAll(selector);
  children.forEach((child, idx) => {
    setTimeout(() => {
      animate(
        child as HTMLElement,
        { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        { duration }
      );
    }, idx * staggerDelay * 1000);
  });
};

// ============ Easing Functions & Presets ============

export const easings = {
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// ============ Lifecycle Hook Helpers ============

import React from 'react';

export const useElementAnimation = (elementRef: React.RefObject<HTMLElement>, animationFn: (el: HTMLElement) => void) => {
  React.useEffect(() => {
    if (elementRef.current) {
      animationFn(elementRef.current);
    }
  }, [elementRef, animationFn]);
};
