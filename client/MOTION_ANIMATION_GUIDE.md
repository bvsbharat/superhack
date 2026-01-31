# Motion.dev Animation Integration Guide

This guide covers how to use Motion.dev animations across your Super Bowl Analytics app for a smooth experience.

## Installation

Motion.dev is already installed:
```bash
npm install motion
```

## Quick Start

### 1. Import Motion Utilities

```tsx
import { animate } from 'motion';
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  Counter,
  AnimatedPanel
} from './components/AnimatedComponents';
import {
  AnimatedAreaChart,
  AnimatedBarChart,
  AnimatedStatCard,
  AnimatedMetricsGrid,
  AnimatedLiveEvents
} from './components/AnimatedChart';
```

## Component Examples

### Fade In Component
```tsx
<FadeIn duration={0.6} delay={0.2}>
  <div>Your content fades in smoothly</div>
</FadeIn>
```

### Slide In Component
```tsx
<SlideIn direction="right" distance={50} duration={0.6}>
  <Panel>Slides in from the right</Panel>
</SlideIn>
```

### Scale In Component
```tsx
<ScaleIn duration={0.5} delay={0.3}>
  <Modal>Scales up smoothly</Modal>
</ScaleIn>
```

### Number Counter
```tsx
<Counter from={0} to={72.4} duration={1} />
```

### Animated Charts
```tsx
<AnimatedAreaChart
  data={epaTrendData}
  dataKey="val"
  duration={0.8}
/>

<AnimatedBarChart
  data={playStatsData}
  dataKey="count"
  staggerDelay={0.05}
/>
```

### Animated Metrics Grid
```tsx
<AnimatedMetricsGrid
  metrics={[
    { label: 'EPA', value: 2.4, unit: 'per play', trend: 5.2 },
    { label: 'Win Prob', value: 72.4, unit: '%', trend: -2.1 },
  ]}
  staggerDelay={0.1}
/>
```

### Animated Live Events
```tsx
<AnimatedLiveEvents
  events={[
    { id: '1', text: 'Touchdown Pass', timestamp: '2:15', type: 'score' },
    { id: '2', text: 'Interception', timestamp: '1:45', type: 'turnover' },
  ]}
  maxVisible={5}
/>
```

## Direct Motion Animation Usage

### Basic Animation
```tsx
import { animate } from 'motion';
import { useRef, useEffect } from 'react';

const MyComponent = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(
        ref.current,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration: 0.6 }
      );
    }
  }, []);

  return <div ref={ref}>Animated element</div>;
};
```

### Animation with Easing
```tsx
animate(element, { scale: [0.8, 1] }, {
  duration: 0.5,
  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
});
```

### Sequence Animation
```tsx
// Animate one after another
await animate(el1, { opacity: [0, 1] }, { duration: 0.3 });
await animate(el2, { opacity: [0, 1] }, { duration: 0.3 });
```

### Stagger Animation
```tsx
const items = container.querySelectorAll('.item');
items.forEach((item, idx) => {
  setTimeout(() => {
    animate(item, { opacity: [0, 1] }, { duration: 0.5 });
  }, idx * 100);
});
```

## Application Areas

### 1. Panel Expansions (Layout)
- **File**: `App.tsx`
- **Usage**: When user toggles between views, animate panel width changes
```tsx
useEffect(() => {
  if (panelRef.current) {
    animate(panelRef.current,
      { width: isExpanded ? '100%' : '35%' },
      { duration: 0.5, easing: 'ease-in-out' }
    );
  }
}, [isExpanded]);
```

### 2. Football Field Animation (MatchOverview)
- **File**: `components/MatchOverview.tsx`
- **Usage**: Smooth player movement along the field
```tsx
// Animate player positions during simulation
animate(playerElement,
  { transform: `translate(${newX}px, ${newY}px)` },
  { duration: 0.3, easing: 'ease-in-out' }
);
```

### 3. Chart Animations (Statistics)
- **File**: `components/Statistics.tsx`
- **Usage**: Smooth chart data transitions
```tsx
<AnimatedAreaChart
  data={metrics.epaTrend}
  dataKey="val"
  duration={0.8}
/>
```

### 4. Live Event Feed
- **File**: `components/LiveCommentaryPanel.tsx`
- **Usage**: Staggered appearance of live events
```tsx
<AnimatedLiveEvents
  events={liveAnalysis}
  maxVisible={10}
/>
```

### 5. Highlight Carousel
- **File**: `components/CombinedStatus.tsx`
- **Usage**: Smooth transitions between highlights
```tsx
<SlideIn direction="right" duration={0.4}>
  <img src={currentHighlight.imageUrl} alt="highlight" />
</SlideIn>
```

### 6. Statistics Numbers
- **File**: Any stat display component
- **Usage**: Animated counters for metrics
```tsx
<Counter from={0} to={gameState.winProb} duration={1} />
```

## Available Animation Utils

See `utils/animations.tsx` for:
- `fadeIn(element, duration)`
- `slideInFromRight(element, distance, duration)`
- `slideInFromLeft(element, distance, duration)`
- `slideInFromTop(element, distance, duration)`
- `slideInFromBottom(element, distance, duration)`
- `scaleIn(element, duration)`
- `bounce(element, iterations, duration)`
- `pulse(element, iterations, duration)`
- `rotateIn(element, duration)`
- `countUpNumber(element, start, end, duration, formatter)`
- `moveElement(element, fromX, fromY, toX, toY, duration)`
- `colorTransition(element, fromColor, toColor, duration)`
- `glowEffect(element, glowColor, iterations, duration)`
- `barChartRise(element, duration)`
- `playerMovement(element, targetX, targetY, duration)`
- `ballTrajectory(element, points, totalDuration)`
- `staggerChildren(container, selector, animationFn, staggerDelay)`
- `staggerFadeIn(container, selector, staggerDelay, duration)`

## Performance Tips

1. **Use `isAnimationActive={false}` on Recharts components** - Let Motion.dev handle animations
2. **Stagger animations** - Don't animate everything at once
3. **Keep durations short** - 0.3-0.6s for UI, 0.8-1.2s for hero animations
4. **Use hardware-accelerated properties** - `transform`, `opacity`
5. **Avoid animating layout properties** - Use `transform` instead of `width`/`height`

## Easing Functions

```tsx
const easings = {
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};
```

## Documentation Reference

Full Motion.dev documentation: https://motion.dev/docs

## Implementation Checklist

- [ ] Import `animate` from 'motion' in App.tsx
- [ ] Create refs for animated elements
- [ ] Add `useEffect` hooks to trigger animations on state changes
- [ ] Replace Tailwind `transition-` classes with Motion for complex animations
- [ ] Update Charts to use AnimatedChart components
- [ ] Add AnimatedLiveEvents to event feeds
- [ ] Test smooth 60fps animations
- [ ] Verify mobile performance

## Common Patterns

### Auto-play Animation on Mount
```tsx
useEffect(() => {
  if (ref.current) animate(ref.current, { opacity: [0, 1] }, { duration: 0.6 });
}, []);
```

### Animated State Changes
```tsx
useEffect(() => {
  if (ref.current) {
    animate(ref.current, { scale: [1, 1.1, 1] }, { duration: 0.4 });
  }
}, [someState]);
```

### Hover Animations
```tsx
const handleHover = () => {
  animate(ref.current, { scale: [1, 1.05] }, { duration: 0.2 });
};
```

## Troubleshooting

**Animations not working?**
- Ensure element has `opacity: 0` or initial transform in inline styles
- Check that ref is properly connected to DOM element
- Verify useEffect runs after element mounts

**Jittery animations?**
- Avoid animating layout-affecting properties
- Use `transform` instead of `left`/`top`/`width`/`height`
- Check for competing CSS transitions

**Performance issues?**
- Reduce number of simultaneous animations
- Use `staggerDelay` to spread animations over time
- Avoid animating long lists (limit to visible items)
