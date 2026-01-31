# Motion.dev Quick Reference Card

## Import Statements

```tsx
// Basic Motion import
import { animate } from 'motion';

// Pre-built components
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  Counter,
  AnimatedPanel,
  AnimatedList,
  Bounce,
  GlowEffect,
  Pulse,
  AnimatedHeroImage,
} from './components/AnimatedComponents';

// Chart animations
import {
  AnimatedAreaChart,
  AnimatedBarChart,
  AnimatedStatCard,
  AnimatedMetricsGrid,
  AnimatedLiveEvents,
} from './components/AnimatedChart';
```

## Quick Components

### Fade In
```tsx
<FadeIn duration={0.6} delay={0.2}>
  Content fades in smoothly
</FadeIn>
```

### Slide In
```tsx
<SlideIn direction="right" distance={50} duration={0.6}>
  Slides in from right
</SlideIn>
```
Directions: `'left'`, `'right'`, `'top'`, `'bottom'`

### Scale In
```tsx
<ScaleIn duration={0.5} delay={0.3}>
  Scales up nicely
</ScaleIn>
```

### Counter (Numbers)
```tsx
<Counter from={0} to={72.4} duration={1} />
```

### Animated List (Stagger)
```tsx
<AnimatedList staggerDelay={0.1} duration={0.5}>
  <div data-animated-item>Item 1</div>
  <div data-animated-item>Item 2</div>
  <div data-animated-item>Item 3</div>
</AnimatedList>
```

### Bouncing
```tsx
<Bounce duration={0.6} distance={20}>
  Bounces up and down
</Bounce>
```

### Pulsing
```tsx
<Pulse duration={2}>
  Pulses opacity
</Pulse>
```

### Glow Effect
```tsx
<GlowEffect glowColor="rgba(255,255,255,0.5)" duration={1.5}>
  Glows with box shadow
</GlowEffect>
```

### Hero Image
```tsx
<AnimatedHeroImage
  src="/image.jpg"
  alt="Hero"
  duration={0.8}
  className="w-full h-64"
/>
```

## Chart Components

### Animated Area Chart
```tsx
<AnimatedAreaChart
  data={[{ name: 'Q1', val: 0.5 }]}
  dataKey="val"
  stroke="#ffe566"
  fill="url(#gradient)"
  height={150}
  duration={0.8}
/>
```

### Animated Bar Chart
```tsx
<AnimatedBarChart
  data={[{ name: 'Pass', count: 32 }]}
  dataKey="count"
  fill="#ffe566"
  height={200}
  staggerDelay={0.05}
/>
```

### Stat Card
```tsx
<AnimatedStatCard
  label="EPA"
  value={2.4}
  unit="per play"
  trend={5.2}
/>
```

### Metrics Grid
```tsx
<AnimatedMetricsGrid
  metrics={[
    { label: 'EPA', value: 2.4, unit: 'per play', trend: 5.2 },
    { label: 'Win Prob', value: 72.4, unit: '%', trend: -2.1 },
  ]}
  staggerDelay={0.1}
/>
```

### Live Events
```tsx
<AnimatedLiveEvents
  events={[
    { id: '1', text: 'Touchdown', timestamp: '2:15', type: 'score' },
    { id: '2', text: 'Interception', timestamp: '1:45', type: 'turnover' },
  ]}
  maxVisible={5}
/>
```
Event types: `'play'`, `'turnover'`, `'score'`, `'penalty'`

## Direct Motion Usage

### Basic Animation
```tsx
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (ref.current) {
    animate(ref.current, { opacity: [0, 1] }, { duration: 0.6 });
  }
}, []);

return <div ref={ref}>Content</div>;
```

### Multiple Properties
```tsx
animate(element,
  {
    opacity: [0, 1],
    transform: ['translateY(20px)', 'translateY(0)']
  },
  { duration: 0.6 }
);
```

### With Easing
```tsx
animate(element,
  { scale: [0.8, 1] },
  {
    duration: 0.5,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
);
```

### Stagger Effect
```tsx
const items = container.querySelectorAll('.item');
items.forEach((item, idx) => {
  setTimeout(() => {
    animate(item, { opacity: [0, 1] }, { duration: 0.5 });
  }, idx * 100);
});
```

### With Callback
```tsx
animate({ value: 0 }, { value: 100 }, {
  duration: 1,
  onUpdate: ({ value }) => {
    element.textContent = Math.round(value).toString();
  },
  onComplete: () => console.log('Done!')
});
```

## Common Easing Functions

```tsx
'ease-in-out'  // Default smooth
'ease-in'      // Slow start, fast end
'ease-out'     // Fast start, slow end
'cubic-bezier(0.34, 1.56, 0.64, 1)'  // Bounce effect
'cubic-bezier(0.175, 0.885, 0.32, 1.275)'  // Spring effect
```

## Animation Durations (Recommended)

```
UI Elements:     0.3-0.5s
Transitions:     0.5-0.7s
Hero/Banner:     0.8-1.0s
Complex:         1.0-1.5s
Stagger spacing: 0.05-0.15s between items
```

## Panel/Width Animations

### Simple Expansion
```tsx
const panelRef = useRef<HTMLDivElement>(null);
const [isExpanded, setIsExpanded] = useState(false);

useEffect(() => {
  if (panelRef.current) {
    animate(panelRef.current,
      { width: isExpanded ? '100%' : '35%' },
      { duration: 0.5, easing: 'ease-in-out' }
    );
  }
}, [isExpanded]);

return (
  <div ref={panelRef} style={{ width: '35%' }}>
    Content
  </div>
);
```

## Number Counter Pattern

```tsx
const ref = useRef<HTMLSpanElement>(null);

useEffect(() => {
  animate({ count: 0 }, { count: 72.4 }, {
    duration: 1,
    onUpdate: ({ count }) => {
      if (ref.current) {
        ref.current.textContent = count.toFixed(1);
      }
    }
  });
}, []);

return <span ref={ref}>0</span>;
```

## List Animations Pattern

```tsx
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const items = containerRef.current?.querySelectorAll('[data-item]');
  items?.forEach((item, idx) => {
    setTimeout(() => {
      animate(item,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration: 0.5 }
      );
    }, idx * 100);
  });
}, [items]);

return (
  <div ref={containerRef}>
    {items.map((item, idx) => (
      <div key={idx} data-item style={{ opacity: 0 }}>
        {item}
      </div>
    ))}
  </div>
);
```

## Performance Checklist

✅ Use `transform` instead of `left/top/width/height`
✅ Use `opacity` for fading effects
✅ Stagger animations (don't animate everything at once)
✅ Set initial state in inline styles (opacity: 0)
✅ Use GPU-accelerated properties only
✅ Disable Recharts animations when using Motion
✅ Test on mobile (may need duration adjustments)
✅ Check FPS in DevTools Performance tab

❌ Don't animate layout properties
❌ Don't animate thousands of elements
❌ Don't use delay.current or other stale closures
❌ Don't forget to set initial transform/opacity

## Troubleshooting

**Animation not playing?**
- Add initial state to element: `style={{ opacity: 0 }}`
- Check if useEffect dependency is correct
- Verify ref is attached to correct element

**Jittery animation?**
- Use `transform` instead of position
- Avoid animating width/height (use transform: scale instead)
- Reduce stagger delay between items

**Performance issues?**
- Reduce duration of animations
- Stagger animations over time
- Limit number of simultaneous animations
- Profile with DevTools

**Z-index problems?**
- Use inline `style` prop instead of Tailwind classes
- Ensure parent has `position: relative`
- Use explicit z-index on animated elements

## Files to Reference

- **Implementation**: `components/ANIMATION_EXAMPLE.tsx`
- **Utilities**: `utils/animations.tsx`
- **Components**: `components/AnimatedComponents.tsx`
- **Charts**: `components/AnimatedChart.tsx`
- **Guide**: `MOTION_ANIMATION_GUIDE.md`
- **Setup**: `MOTION_SETUP.md`

## Documentation

- **Motion.dev Docs**: https://motion.dev/docs
- **Examples File**: `UI/components/ANIMATION_EXAMPLE.tsx`
- **Setup Guide**: `MOTION_SETUP.md`
- **Full Guide**: `UI/MOTION_ANIMATION_GUIDE.md`

---

**Quick Start**: Import a component, wrap your JSX, done!

```tsx
import { FadeIn } from './components/AnimatedComponents';

<FadeIn duration={0.6}>
  <YourComponent />
</FadeIn>
```

That's it! 🎉
