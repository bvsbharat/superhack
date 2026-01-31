/**
 * ANIMATION EXAMPLE
 *
 * This file demonstrates how to integrate Motion.dev animations
 * into your existing components for a smooth app experience.
 *
 * Copy these patterns into your actual components!
 */

import React, { useRef, useEffect, useState } from 'react';
import { animate } from 'motion';
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  Counter,
  AnimatedList,
  Bounce,
  GlowEffect,
  Pulse,
  AnimatedHeroImage,
} from './AnimatedComponents';
import {
  AnimatedAreaChart,
  AnimatedBarChart,
  AnimatedStatCard,
  AnimatedMetricsGrid,
  AnimatedLiveEvents,
} from './AnimatedChart';

// ============================================
// EXAMPLE 1: Animated Statistics Dashboard
// ============================================

export const StatisticsDashboardExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    epaTrend: [
      { name: 'Q1', val: 0.5 },
      { name: 'Q2', val: 1.2 },
      { name: 'Q3', val: 0.8 },
      { name: 'Q4', val: 1.5 },
    ],
    playStats: [
      { name: 'Pass', count: 32 },
      { name: 'Run', count: 28 },
      { name: 'Special', count: 5 },
    ],
    epa: 2.4,
    winProb: 72.4,
    possessionTime: 1845,
    explosivePlays: 12,
  });

  useEffect(() => {
    if (containerRef.current) {
      // Fade in entire dashboard
      animate(
        containerRef.current,
        { opacity: [0, 1], transform: ['translateY(30px)', 'translateY(0)'] },
        { duration: 0.8, easing: 'ease-out' }
      );
    }
  }, []);

  const possessionMins = Math.floor(metrics.possessionTime / 60);
  const possessionSecs = metrics.possessionTime % 60;

  return (
    <div ref={containerRef} style={{ opacity: 0 }} className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4">
        <FadeIn duration={0.6}>
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold mb-3">EPA Trend</h3>
            <AnimatedAreaChart
              data={metrics.epaTrend}
              dataKey="val"
              height={150}
            />
          </div>
        </FadeIn>

        <FadeIn duration={0.6} delay={0.1}>
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold mb-3">Play Distribution</h3>
            <AnimatedBarChart
              data={metrics.playStats}
              dataKey="count"
              height={150}
            />
          </div>
        </FadeIn>
      </div>

      {/* Metrics Grid */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <h3 className="text-sm font-semibold mb-4">Key Metrics</h3>
        <AnimatedMetricsGrid
          metrics={[
            { label: 'EPA', value: metrics.epa, unit: 'per play', trend: 5.2 },
            { label: 'Win Prob', value: metrics.winProb, unit: '%', trend: -2.1 },
            { label: 'Possession', value: `${possessionMins}:${possessionSecs.toString().padStart(2, '0')}`, unit: '', trend: 0 },
            { label: 'Explosive Plays', value: metrics.explosivePlays, unit: 'total', trend: 8.0 },
          ]}
          staggerDelay={0.1}
        />
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 2: Animated Hero Image with Info
// ============================================

export const HeroImageExample: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-transparent border border-white/10">
      {/* Hero Image */}
      <AnimatedHeroImage
        src="/images/center-paceholder.jpg"
        alt="Player highlight"
        duration={0.8}
        className="w-full h-64 object-cover"
      />

      {/* Info Overlay */}
      <SlideIn direction="top" duration={0.6} delay={0.3}>
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <h3 className="text-2xl font-bold mb-1">Patrick Mahomes</h3>
          <p className="text-yellow-400 font-semibold mb-4">Quarterback</p>

          <AnimatedList
            staggerDelay={0.08}
            duration={0.4}
            direction="up"
          >
            <div data-animated-item>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Pass Completions</span>
                <span className="font-bold">12 / 14</span>
              </div>
            </div>
            <div data-animated-item>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Passing Yards</span>
                <span className="font-bold">284 yds</span>
              </div>
            </div>
            <div data-animated-item>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Quarterback Rating</span>
                <span className="font-bold">113.0</span>
              </div>
            </div>
          </AnimatedList>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition-colors"
          >
            {isExpanded ? 'Show Less' : 'View Stats'}
          </button>
        </div>
      </SlideIn>
    </div>
  );
};

// ============================================
// EXAMPLE 3: Animated Live Event Feed
// ============================================

export const LiveEventFeedExample: React.FC = () => {
  const [events, setEvents] = useState([
    {
      id: '1',
      text: 'Touchdown Pass',
      timestamp: '2:15 - Q4',
      type: 'score' as const,
    },
    {
      id: '2',
      text: 'Interception',
      timestamp: '1:45 - Q4',
      type: 'turnover' as const,
    },
    {
      id: '3',
      text: 'Holding Penalty',
      timestamp: '1:30 - Q4',
      type: 'penalty' as const,
    },
    {
      id: '4',
      text: 'First Down',
      timestamp: '1:15 - Q4',
      type: 'play' as const,
    },
    {
      id: '5',
      text: 'Incomplete Pass',
      timestamp: '1:00 - Q4',
      type: 'play' as const,
    },
  ]);

  const addNewEvent = () => {
    const newEvent = {
      id: Date.now().toString(),
      text: `New Play Event`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'play' as const,
    };
    setEvents([newEvent, ...events.slice(0, 4)]);
  };

  return (
    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Live Events</h3>
        <button
          onClick={addNewEvent}
          className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
        >
          + New Event
        </button>
      </div>

      <AnimatedLiveEvents events={events} maxVisible={5} />
    </div>
  );
};

// ============================================
// EXAMPLE 4: Animated Panel Toggle
// ============================================

export const AnimatedPanelToggleExample: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      const targetHeight = isExpanded ? '300px' : '150px';
      animate(
        panelRef.current,
        { height: targetHeight as any },
        { duration: 0.5, easing: 'ease-in-out' }
      );
    }
  }, [isExpanded]);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition-colors"
      >
        {isExpanded ? 'Collapse' : 'Expand'} Panel
      </button>

      <div
        ref={panelRef}
        style={{ height: '150px', overflow: 'hidden' }}
        className="bg-white/5 border border-white/10 rounded-lg p-6 transition-all"
      >
        <h3 className="text-lg font-bold mb-4">Expandable Panel</h3>
        <FadeIn>
          <p className="text-gray-300 mb-4">
            This panel smoothly animates its height when expanded or collapsed using Motion.dev
          </p>
          {isExpanded && (
            <SlideIn direction="up" duration={0.4}>
              <div className="mt-4 p-4 bg-blue-500/20 rounded border border-blue-500/40">
                <p className="text-blue-300">Additional content revealed on expansion!</p>
              </div>
            </SlideIn>
          )}
        </FadeIn>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 5: Staggered List Animation
// ============================================

export const StaggeredListExample: React.FC = () => {
  const items = [
    { id: 1, label: 'Smooth Animations', desc: 'All animations powered by Motion.dev' },
    { id: 2, label: 'Hardware Accelerated', desc: 'Uses GPU for 60fps performance' },
    { id: 3, label: 'Stagger Support', desc: 'Coordinated animations across lists' },
    { id: 4, label: 'Easing Functions', desc: 'Cubic bezier and preset easings' },
    { id: 5, label: 'Easy Integration', desc: 'Drop-in React components' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Features (Staggered Animation)</h3>
      <AnimatedList staggerDelay={0.12} duration={0.5} direction="up">
        {items.map((item) => (
          <div
            key={item.id}
            data-animated-item
            className="bg-white/5 p-4 rounded border border-white/10 hover:border-white/20 transition-colors"
          >
            <h4 className="font-semibold text-yellow-400">{item.label}</h4>
            <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </AnimatedList>
    </div>
  );
};

// ============================================
// EXAMPLE 6: Pulsing & Glowing Elements
// ============================================

export const PulsingElementsExample: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="flex flex-col items-center">
        <Pulse duration={1.5}>
          <div className="w-16 h-16 rounded-full bg-blue-500 mb-3"></div>
        </Pulse>
        <p className="text-sm text-gray-400">Pulsing Element</p>
      </div>

      <div className="flex flex-col items-center">
        <GlowEffect glowColor="rgba(34, 197, 94, 0.5)" duration={1.5}>
          <div className="w-16 h-16 rounded-full bg-green-500 mb-3"></div>
        </GlowEffect>
        <p className="text-sm text-gray-400">Glowing Element</p>
      </div>

      <div className="flex flex-col items-center">
        <Bounce duration={0.6} distance={15}>
          <div className="w-16 h-16 rounded-full bg-purple-500 mb-3"></div>
        </Bounce>
        <p className="text-sm text-gray-400">Bouncing Element</p>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 7: Counter Animation
// ============================================

export const CounterAnimationExample: React.FC = () => {
  const [winProb, setWinProb] = useState(50);

  return (
    <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Win Probability</h3>
        <div className="text-5xl font-bold text-yellow-400">
          <Counter from={0} to={winProb} duration={1} />
          <span className="text-3xl">%</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setWinProb(Math.min(100, winProb + 10))}
          className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-bold transition-colors"
        >
          Increase
        </button>
        <button
          onClick={() => setWinProb(Math.max(0, winProb - 10))}
          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-bold transition-colors"
        >
          Decrease
        </button>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 8: Complete Integration Pattern
// ============================================

export const CompleteAnimationPattern: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animate on mount
  useEffect(() => {
    if (containerRef.current) {
      // Step 1: Fade in background
      animate(
        containerRef.current,
        { opacity: [0, 1] },
        { duration: 0.5 }
      );

      // Step 2: Animate child elements after 300ms
      setTimeout(() => {
        const children = containerRef.current?.querySelectorAll('[data-animate]');
        children?.forEach((child, idx) => {
          animate(
            child as HTMLElement,
            {
              opacity: [0, 1],
              transform: ['translateY(20px)', 'translateY(0)']
            },
            {
              duration: 0.5,
              delay: idx * 0.1
            }
          );
        });
      }, 300);
    }

    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} style={{ opacity: 0 }} className="space-y-6 p-6">
      <div data-animate className="text-3xl font-bold">
        Complete Animation Pattern
      </div>

      <div data-animate className="bg-white/5 p-4 rounded border border-white/10">
        <p className="text-gray-300">
          This demonstrates the complete pattern for animations:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-400 space-y-1">
          <li>useRef to reference DOM element</li>
          <li>useEffect to trigger animation</li>
          <li>animate() from Motion.dev</li>
          <li>Stagger child animations</li>
        </ul>
      </div>

      {isLoading ? (
        <div data-animate className="text-center py-4">
          <Bounce duration={0.8} distance={8}>
            <p className="text-gray-400">Loading...</p>
          </Bounce>
        </div>
      ) : (
        <div data-animate className="bg-green-500/10 p-4 rounded border border-green-500/40">
          <p className="text-green-300">✓ Loaded successfully!</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EXAMPLE USAGE IN APP
// ============================================

export const AnimationExamplesPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 py-12 px-6">
      <h1 className="text-4xl font-bold mb-2">Motion.dev Animation Examples</h1>
      <p className="text-gray-400">
        Copy these patterns into your components for smooth animations across the app
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Statistics Dashboard</h2>
          <StatisticsDashboardExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Hero Image</h2>
          <HeroImageExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Live Event Feed</h2>
          <LiveEventFeedExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Animated Panel</h2>
          <AnimatedPanelToggleExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Staggered List</h2>
          <StaggeredListExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Pulsing & Glowing</h2>
          <PulsingElementsExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Counter Animation</h2>
          <CounterAnimationExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Complete Pattern</h2>
          <CompleteAnimationPattern />
        </section>
      </div>
    </div>
  );
};
