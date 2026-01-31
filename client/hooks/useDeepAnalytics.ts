/**
 * React hook for Deep LLM Analytics integration
 *
 * Provides a clean interface to the dual-model analytics system:
 * - Flash analytics (every 2 events)
 * - Deep analytics (every 3 events)
 */

import { useState, useCallback, useRef } from 'react';
import { deepAnalyticsService } from '../services/deepAnalytics';
import { FastAnalytics, DeepAnalytics, LiveScoreData } from '../services/analyticsTypes';
import { AnalysisEvent } from '../services/stream';

export interface UseDeepAnalyticsReturn {
  flashAnalytics: FastAnalytics | null;
  deepAnalytics: DeepAnalytics | null;
  isProcessing: boolean;
  processEvent: (event: AnalysisEvent, liveScore: LiveScoreData) => Promise<void>;
  reset: () => void;
  setTeamContext: (selectedTeam: string, filter: 'all' | 'offensive' | 'defensive') => void;
  stats: {
    eventCount: number;
    compactedPeriods: number;
  };
}

export function useDeepAnalytics(): UseDeepAnalyticsReturn {
  const [flashAnalytics, setFlashAnalytics] = useState<FastAnalytics | null>(null);
  const [deepAnalytics, setDeepAnalytics] = useState<DeepAnalytics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ eventCount: 0, compactedPeriods: 0 });

  // Track processed event timestamps to avoid duplicates
  const processedEventsRef = useRef<Set<string>>(new Set());

  const processEvent = useCallback(async (event: AnalysisEvent, liveScore: LiveScoreData) => {
    // Create unique key for this event
    const eventKey = `${event.timestamp}-${event.event}-${event.details.substring(0, 30)}`;

    // Skip if already processed
    if (processedEventsRef.current.has(eventKey)) {
      return;
    }

    // Mark as processed
    processedEventsRef.current.add(eventKey);

    // Limit stored keys to prevent memory growth
    if (processedEventsRef.current.size > 200) {
      const keysArray = Array.from(processedEventsRef.current);
      processedEventsRef.current = new Set(keysArray.slice(-100));
    }

    setIsProcessing(true);

    try {
      const result = await deepAnalyticsService.processNewEvent(event, liveScore);

      if (result.flash) {
        setFlashAnalytics(result.flash);
      }

      if (result.deep) {
        setDeepAnalytics(result.deep);
      }

      // Update stats
      const currentStats = deepAnalyticsService.getContextStats();
      setStats({
        eventCount: currentStats.eventCount,
        compactedPeriods: currentStats.compactedPeriods,
      });
    } catch (error) {
      console.error('useDeepAnalytics: Error processing event:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    deepAnalyticsService.reset();
    setFlashAnalytics(null);
    setDeepAnalytics(null);
    setStats({ eventCount: 0, compactedPeriods: 0 });
    processedEventsRef.current.clear();
  }, []);

  const setTeamContext = useCallback((selectedTeam: string, filter: 'all' | 'offensive' | 'defensive') => {
    deepAnalyticsService.setTeamContext(selectedTeam, filter);
  }, []);

  return {
    flashAnalytics,
    deepAnalytics,
    isProcessing,
    processEvent,
    reset,
    setTeamContext,
    stats,
  };
}
