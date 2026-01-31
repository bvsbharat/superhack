/**
 * TypeScript interfaces for Deep LLM Analytics System
 *
 * Supports dual-model analysis:
 * - Flash Model (gemini-3-flash): Fast analytics every 2 events
 * - Pro Model (gemini-pro): Deep strategic analysis every 3 events
 */

import { AnalysisEvent } from './stream';

export interface FastAnalytics {
  timestamp: string;
  epaTrend: 'up' | 'down' | 'stable';
  predictedNextPlay: {
    type: 'pass' | 'run' | 'play-action' | 'screen';
    confidence: number;
    reasoning: string;
  };
  blitzProbability: number;
  formationTendency: string;
  momentumShift: number; // -100 to 100
}

export interface DeepAnalytics {
  timestamp: string;
  strategicInsight: string;
  gameNarrative: string;
  keyPlayerImpact: { playerName: string; impact: string; rating: number }[];
  predictiveModeling: {
    driveSuccessProbability: number;
    scoringProbability: number;
    turnoverRisk: number;
  };
  detailedMetrics: {
    offensiveEfficiency: number;
    defensivePressure: number;
  };
}

export interface CompactedSummary {
  summary: string;
  keyPlays: string[];
  cumulativeStats: {
    totalPlays: number;
    turnovers: number;
    scoringPlays: number;
  };
}

export interface AnalyticsContext {
  compactedHistory: CompactedSummary[];
  recentEvents: AnalysisEvent[];  // Last 5 events in full
  eventCount: number;
  lastFlashRun: number;
  lastDeepRun: number;
  lastCompaction: number;
}

export interface LiveScoreData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  gameTime: string;
  down: number;
  distance: number;
  possession: string;
}

export interface AnalyticsResult {
  flash?: FastAnalytics;
  deep?: DeepAnalytics;
}
