import { useState, useCallback } from 'react';
import { GameState } from '../types';

export interface PlayerRecommendation {
  name: string;
  position: string;
  action: string;
}

export interface StrategyInsight {
  title: string;
  description: string;
  confidence: number;
  player_recommendations: PlayerRecommendation[];
  play_types: string[];
  reasoning: string;
  quarter_context: string;
}

export interface ContextStats {
  total_items: number;
  max_items: number;
  items_by_importance: Record<string, number>;
  creation_time: string;
  last_compression: string;
}

const API_BASE = 'http://localhost:8000/api/deep-research';

export const useDeepResearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<StrategyInsight | null>(null);
  const [recommendations, setRecommendations] = useState<PlayerRecommendation[]>([]);
  const [contextStats, setContextStats] = useState<ContextStats | null>(null);

  // Add event to context store
  const addEvent = useCallback(
    async (
      eventType: string,
      description: string,
      timestamp: string,
      team?: string,
      playerName?: string,
      details?: Record<string, any>
    ) => {
      try {
        const response = await fetch(`${API_BASE}/add-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: eventType,
            description,
            timestamp,
            team,
            player_name: playerName,
            details,
          }),
        });

        if (!response.ok) throw new Error('Failed to add event');
        return await response.json();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Add event error:', err);
      }
    },
    []
  );

  // Analyze strategy
  const analyzeStrategy = useCallback(async (query: string, gameState: GameState, focusTeam?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/analyze-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          game_state: gameState,
          focus_team: focusTeam,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze strategy');
      const data = await response.json();
      setStrategy(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Strategy analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Ask question
  const askQuestion = useCallback(async (query: string, gameState: GameState, focusTeam?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ask-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          game_state: gameState,
          focus_team: focusTeam,
        }),
      });

      if (!response.ok) throw new Error('Failed to answer question');
      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Question error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get player recommendations
  const getPlayerRecommendations = useCallback(
    async (gameState: GameState, focusTeam?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          game_state_quarter: String(gameState.quarter),
          game_state_clock: gameState.clock,
          game_state_possession: gameState.possession,
          ...(focusTeam && { focus_team: focusTeam }),
        });

        const response = await fetch(`${API_BASE}/player-recommendations?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to get recommendations');
        const data = await response.json();
        setRecommendations(data.recommendations);
        return data.recommendations;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Player recommendations error:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get context stats
  const getContextStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/context-stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to get context stats');
      const data = await response.json();
      setContextStats(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Context stats error:', err);
      return null;
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/clear-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to clear conversation');
      return await response.json();
    } catch (err) {
      console.error('Clear conversation error:', err);
    }
  }, []);

  // Reset context
  const resetContext = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/reset-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to reset context');
      setStrategy(null);
      setRecommendations([]);
      return await response.json();
    } catch (err) {
      console.error('Reset context error:', err);
    }
  }, []);

  return {
    loading,
    error,
    strategy,
    recommendations,
    contextStats,
    addEvent,
    analyzeStrategy,
    askQuestion,
    getPlayerRecommendations,
    getContextStats,
    clearConversation,
    resetContext,
  };
};
