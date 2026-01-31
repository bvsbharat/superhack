import React, { useRef, useEffect } from 'react';
import { animate } from 'motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Animated Charts using Motion.dev + Recharts
 * Provides smooth animations for data visualization
 */

interface AnimatedAreaChartProps {
  data: any[];
  dataKey: string;
  stroke?: string;
  fill?: string;
  height?: number;
  duration?: number;
}

export const AnimatedAreaChart: React.FC<AnimatedAreaChartProps> = ({
  data,
  dataKey,
  stroke = '#ffe566',
  fill = 'url(#colorUv)',
  height = 150,
  duration = 0.8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Animate container entrance
      animate(
        containerRef.current,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration }
      );

      // Animate chart bars/areas with stagger
      const chartElements = containerRef.current.querySelectorAll('path');
      chartElements.forEach((el, idx) => {
        if (el.tagName === 'path' && el.getAttribute('d')) {
          setTimeout(() => {
            animate(
              el,
              { opacity: [0, 1], transform: ['scaleY(0)', 'scaleY(1)'] },
              { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            );
          }, idx * 50);
        }
      });
    }
  }, [data, duration]);

  return (
    <div ref={containerRef} style={{ opacity: 0 }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.8} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={fill} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface AnimatedBarChartProps {
  data: any[];
  dataKey: string;
  fill?: string;
  height?: number;
  duration?: number;
  staggerDelay?: number;
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  dataKey,
  fill = '#ffe566',
  height = 200,
  duration = 0.6,
  staggerDelay = 0.05,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Animate container entrance
      animate(
        containerRef.current,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration }
      );

      // Animate individual bars with stagger effect
      const bars = containerRef.current.querySelectorAll('[role="presentation"] rect');
      bars.forEach((bar, idx) => {
        setTimeout(() => {
          animate(
            bar,
            {
              transform: ['scaleY(0)', 'scaleY(1)'],
              opacity: [0, 1]
            },
            { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
          );
        }, idx * staggerDelay * 1000);
      });
    }
  }, [data, duration, staggerDelay]);

  return (
    <div ref={containerRef} style={{ opacity: 0 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12 }} />
          <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
          <Bar dataKey={dataKey} fill={fill} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: number;
  duration?: number;
  className?: string;
}

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  label,
  value,
  unit = '',
  icon,
  trend,
  duration = 0.6,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Animate card entrance with slide and fade
      animate(
        ref.current,
        {
          opacity: [0, 1],
          transform: ['translateX(-20px)', 'translateX(0)']
        },
        { duration }
      );
    }

    // Animate number counter if value is numeric
    if (valueRef.current && typeof value === 'number') {
      const numValue = value;
      animate(
        { count: 0 },
        { count: numValue },
        {
          duration: 0.8,
          onUpdate: ({ count }) => {
            if (valueRef.current) {
              valueRef.current.textContent = Math.round(count).toString();
            }
          },
        }
      );
    }
  }, [value, duration]);

  return (
    <div
      ref={ref}
      className={`bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10 ${className}`}
      style={{ opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        {icon && <div className="text-yellow-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span ref={valueRef} className="text-2xl font-bold text-white">
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
};

interface AnimatedMetricsGridProps {
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    trend?: number;
  }>;
  staggerDelay?: number;
  duration?: number;
}

export const AnimatedMetricsGrid: React.FC<AnimatedMetricsGridProps> = ({
  metrics,
  staggerDelay = 0.1,
  duration = 0.6,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-metric-card]');
      cards.forEach((card, idx) => {
        setTimeout(() => {
          animate(
            card as HTMLElement,
            {
              opacity: [0, 1],
              transform: ['translateY(20px)', 'translateY(0)']
            },
            { duration }
          );
        }, idx * staggerDelay * 1000);
      });
    }
  }, [metrics, staggerDelay, duration]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-3">
      {metrics.map((metric, idx) => (
        <div key={idx} data-metric-card style={{ opacity: 0 }}>
          <AnimatedStatCard
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            icon={metric.icon}
            trend={metric.trend}
            duration={0}
          />
        </div>
      ))}
    </div>
  );
};

interface AnimatedLiveEventProps {
  events: Array<{
    id: string;
    text: string;
    timestamp: string;
    type?: 'play' | 'turnover' | 'score' | 'penalty';
  }>;
  maxVisible?: number;
}

export const AnimatedLiveEvents: React.FC<AnimatedLiveEventProps> = ({ events, maxVisible = 5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const eventElements = containerRef.current.querySelectorAll('[data-event-item]');
      eventElements.forEach((el, idx) => {
        if (idx < maxVisible) {
          animate(
            el as HTMLElement,
            {
              opacity: [0, 1],
              transform: ['translateX(-20px)', 'translateX(0)']
            },
            { duration: 0.4, delay: idx * 0.05 }
          );
        }
      });
    }
  }, [events, maxVisible]);

  const getEventColor = (type?: string) => {
    switch (type) {
      case 'turnover': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'score': return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'penalty': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {events.slice(0, maxVisible).map((event) => (
        <div
          key={event.id}
          data-event-item
          className={`p-3 rounded border backdrop-blur text-sm ${getEventColor(event.type)}`}
          style={{ opacity: 0 }}
        >
          <div className="font-medium">{event.text}</div>
          <div className="text-xs opacity-75 mt-1">{event.timestamp}</div>
        </div>
      ))}
    </div>
  );
};
