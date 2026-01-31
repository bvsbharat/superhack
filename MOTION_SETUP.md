# Motion.dev Animation Setup & Integration

## What We've Set Up

Your Super Bowl Analytics app now has full Motion.dev integration for smooth, professional animations across all UI components.

### New Files Created

1. **`UI/utils/animations.tsx`** - Low-level Motion animation utilities
   - Element animations (fade, slide, scale, rotate, bounce, pulse)
   - Number counters and transitions
   - Chart animations (bar rise, chart data flow)
   - Player/object movement (field animations, ball trajectory)
   - Stagger group animations

2. **`UI/components/AnimatedComponents.tsx`** - Reusable React components
   - `<FadeIn />` - Fade in effect
   - `<SlideIn />` - Slide from any direction
   - `<ScaleIn />` - Scale/pop animation
   - `<Counter />` - Animated number counters
   - `<AnimatedPanel />` - Panel width transitions
   - `<AnimatedList />` - Staggered list animations
   - `<Bounce />` - Bouncing effect
   - `<GlowEffect />` - Pulsing glow
   - `<Pulse />` - Opacity pulse
   - `<AnimatedHeroImage />` - Hero image entrance

3. **`UI/components/AnimatedChart.tsx`** - Chart-specific animations
   - `<AnimatedAreaChart />` - Smooth area chart entrance + bar animations
   - `<AnimatedBarChart />` - Staggered bar rise animations
   - `<AnimatedStatCard />` - Stat card with counter animation
   - `<AnimatedMetricsGrid />` - Grid of metrics with stagger
   - `<AnimatedLiveEvents />` - Live event feed with slide animations

4. **`UI/MOTION_ANIMATION_GUIDE.md`** - Complete developer guide

### Updated Files

- **`UI/App.tsx`** - Added Motion animations for:
  - Main container fade-in on authentication
  - Panel expansion/collapse with smooth width transitions
  - Layout panel animations

## Quick Integration Examples

### Example 1: Animated Game Statistics Panel

```tsx
// In components/Statistics.tsx
import { animate } from 'motion';
import {
  AnimatedAreaChart,
  AnimatedBarChart,
  AnimatedMetricsGrid,
  AnimatedLiveEvents
} from './AnimatedChart';

export const Statistics: React.FC<StatisticsProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !loading) {
      // Fade in the entire panel
      animate(containerRef.current,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration: 0.6 }
      );
    }
  }, [loading]);

  return (
    <div ref={containerRef} style={{ opacity: 0 }}>
      {/* EPA Trend Chart */}
      <AnimatedAreaChart
        data={metrics.epaTrend}
        dataKey="val"
        stroke="#ffe566"
        height={150}
        duration={0.8}
      />

      {/* Key Metrics Grid */}
      <AnimatedMetricsGrid
        metrics={[
          { label: 'EPA', value: metrics.epa, unit: 'per play', trend: 5.2 },
          { label: 'Win Prob', value: gameState.winProb, unit: '%', trend: -2.1 },
          { label: 'Possession', value: `${Math.floor(metrics.possessionTime / 60)}:${metrics.possessionTime % 60}`, unit: '', trend: 0 },
          { label: 'Explosive Plays', value: metrics.totalExplosivePlays, unit: 'total', trend: 8.0 },
        ]}
        staggerDelay={0.1}
      />

      {/* Live Events Feed */}
      <AnimatedLiveEvents
        events={liveAnalysis.map(e => ({
          id: e.timestamp,
          text: e.event,
          timestamp: e.timestamp,
          type: e.isTurnover ? 'turnover' : e.isScoring ? 'score' : 'play'
        }))}
        maxVisible={5}
      />
    </div>
  );
};
```

### Example 2: Animated Player Movement

```tsx
// In components/MatchOverview.tsx
import { animate } from 'motion';

// Update player circles during simulation
useEffect(() => {
  const playerCircles = fieldSvgRef.current?.querySelectorAll('g[data-player]');
  if (!playerCircles) return;

  playerCircles.forEach(circle => {
    const playerId = circle.getAttribute('data-player-id');
    const pos = dynamicPositions[playerId];

    if (pos) {
      animate(circle,
        { transform: `translate(${pos.x}px, ${pos.y}px)` },
        { duration: 0.5, easing: 'ease-in-out' }
      );
    }
  });
}, [dynamicPositions]);
```

### Example 3: Animated Hero Image

```tsx
// In components/CombinedStatus.tsx
import { AnimatedHeroImage, SlideIn } from './AnimatedComponents';

export const CombinedStatus: React.FC<CombinedStatusProps> = (props) => {
  return (
    <div className="rounded-2xl overflow-hidden">
      <AnimatedHeroImage
        src={image}
        alt="Player highlight"
        duration={0.8}
        className="w-full h-64 object-cover"
      />

      <SlideIn direction="top" duration={0.6} delay={0.2}>
        <div className="p-4 bg-gradient-to-t from-black">
          <h3 className="text-lg font-bold">{player.name}</h3>
          <p className="text-sm text-gray-300">{player.role}</p>
        </div>
      </SlideIn>
    </div>
  );
};
```

### Example 4: Animated Panel Expansion

```tsx
// Panel that expands when clicked
import { AnimatedPanel } from './AnimatedComponents';

const [isExpanded, setIsExpanded] = useState(false);

return (
  <AnimatedPanel
    isExpanded={isExpanded}
    expandedWidth="100%"
    collapsedWidth="35%"
    duration={0.5}
    className="flex flex-col"
  >
    <YourContent />
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? 'Collapse' : 'Expand'}
    </button>
  </AnimatedPanel>
);
```

### Example 5: Animated Live Commentary

```tsx
// Live events with staggered entrance
import { AnimatedLiveEvents } from './AnimatedChart';

<AnimatedLiveEvents
  events={liveAnalysis.map(event => ({
    id: event.timestamp,
    text: event.event,
    timestamp: event.timestamp,
    type: event.isTurnover ? 'turnover' :
          event.isScoring ? 'score' :
          event.isPenalty ? 'penalty' : 'play'
  }))}
  maxVisible={10}
/>
```

## Animation Areas in Your App

### 1. App Layout Transitions
- **Where**: `App.tsx`
- **What**: Panel width changes when expanding/collapsing
- **Animation**: Smooth width transition (0.5s)

### 2. Football Field Player Movement
- **Where**: `MatchOverview.tsx` (FieldSVG)
- **What**: Players moving on field during simulation
- **Animation**: Smooth position transitions (0.3-0.5s per move)

### 3. Charts & Metrics
- **Where**: `Statistics.tsx`
- **What**: EPA, WPA, formation charts; metric cards
- **Animation**: Staggered bar rise, number counters (0.6-0.8s)

### 4. Live Events Feed
- **Where**: `LiveCommentaryPanel.tsx`
- **What**: Real-time game events appearing
- **Animation**: Slide-in from left with stagger (0.3-0.4s per event)

### 5. Highlight Carousel
- **Where**: `CombinedStatus.tsx`
- **What**: Switching between highlight images
- **Animation**: Slide/fade transition (0.4-0.6s)

### 6. Game State Updates
- **Where**: Throughout app
- **What**: Win probability, down/distance changes
- **Animation**: Number counters, color transitions (0.6-1s)

### 7. Modal/Overlay Entrances
- **Where**: `AIInsightPanel.tsx`, any modals
- **What**: Panels sliding/fading in
- **Animation**: Slide + fade (0.5-0.6s)

## Performance Considerations

1. **Use hardware-accelerated properties**
   ```tsx
   // Good - Uses transform (GPU accelerated)
   animate(el, { transform: 'translateX(20px)' }, { duration: 0.5 });

   // Bad - Uses position (CPU intensive)
   animate(el, { left: '20px' }, { duration: 0.5 });
   ```

2. **Stagger animations for large lists**
   ```tsx
   // Spreads 100 animations over 2 seconds instead of all at once
   items.forEach((item, idx) => {
     setTimeout(() => {
       animate(item, props, { duration: 0.4 });
     }, idx * 20);
   });
   ```

3. **Disable Recharts animations when using Motion**
   ```tsx
   <AreaChart data={data} isAnimationActive={false}>
     {/* Motion.dev will handle animations */}
   </AreaChart>
   ```

4. **Use ref callbacks for clean animations**
   ```tsx
   const animateOnMount = useCallback((el: HTMLElement) => {
     if (el) animate(el, { opacity: [0, 1] }, { duration: 0.6 });
   }, []);
   ```

## Testing Animations

```bash
# Dev server with hot reload
npm run dev

# Build for production
npm build

# Check performance in browser DevTools
# - Disable GPU: Rendering > Disable GPU acceleration
# - Record performance: More tools > Performance
```

## Next Steps

1. **Implement in Statistics Component**
   - Replace Tailwind transitions with Motion for chart data
   - Add number counter animations to stats
   - Animate metric cards on load

2. **Enhance Live Field**
   - Smooth ball trajectory animation
   - Player movement interpolation
   - Play call visualization

3. **Polish Highlight Carousel**
   - Smooth image transitions
   - Fade to next highlight
   - Animated caption/description

4. **Add Page Transitions**
   - Fade between authenticated/unauthenticated states
   - Smooth view changes (analytics/feed/highlights)
   - Loading state animations

5. **Mobile Optimization**
   - Reduce animation duration on mobile
   - Use `prefers-reduced-motion` media query
   - Test on actual devices

## Motion.dev Documentation

Full docs: https://motion.dev/docs

Key concepts:
- Keyframes: `[start, end]` or `{ value: 0 }` → `{ value: 100 }`
- Easing: `'ease-in-out'`, `'cubic-bezier(...)'`, or custom functions
- Duration: Time in seconds
- Delay: Wait time before animation starts
- Repeat: Number of times to repeat animation

## Troubleshooting

**Q: Animations not triggering?**
A: Ensure element has initial state (opacity: 0, etc.) and useEffect dependency is correct

**Q: Jittery animations?**
A: Use `transform` instead of position properties; check for CSS transitions

**Q: Chart bars not animating?**
A: Add `isAnimationActive={false}` to Recharts components

**Q: Performance issues?**
A: Stagger animations, reduce number of simultaneous animations, profile with DevTools

## Example Metrics After Implementation

- **App Load**: 500ms total fade-in
- **Panel Expansion**: 500ms smooth transition
- **Chart Load**: 800ms staggered bar animations
- **Player Movement**: 300ms per move on field
- **Live Event**: 400ms slide-in per event
- **FPS**: Target 60fps (locked in browser)
