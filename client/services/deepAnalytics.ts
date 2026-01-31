/**
 * Deep Analytics Service - Dual-Model LLM Orchestration
 *
 * Implements parallel execution of:
 * - Flash Model (gemini-3-flash): Fast analytics every 2 events
 * - Pro Model (gemini-pro): Deep strategic analysis every 3 events
 *
 * Context compaction happens every 15 events to reduce token usage (~85% reduction)
 */

import { GoogleGenAI } from "@google/genai";
import { AnalysisEvent } from './stream';
import {
  FastAnalytics,
  DeepAnalytics,
  CompactedSummary,
  AnalyticsContext,
  LiveScoreData,
  AnalyticsResult
} from './analyticsTypes';

const API_KEY = process.env.API_KEY;

// Thresholds for model execution
const FLASH_EVERY = 2;   // Run flash model every 2 events
const DEEP_EVERY = 3;    // Run pro model every 3 events
const COMPACT_EVERY = 15; // Compact context every 15 events
const RECENT_EVENTS_KEEP = 5; // Keep last 5 events in full detail

class DeepAnalyticsService {
  private context: AnalyticsContext;
  private ai: GoogleGenAI | null = null;
  private selectedTeam: string = '';
  private analyticsFilter: 'all' | 'offensive' | 'defensive' = 'all';

  constructor() {
    this.context = {
      compactedHistory: [],
      recentEvents: [],
      eventCount: 0,
      lastFlashRun: 0,
      lastDeepRun: 0,
      lastCompaction: 0,
    };

    if (API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    }
  }

  /**
   * Set the team focus and analytics filter for subsequent analysis
   */
  setTeamContext(selectedTeam: string, filter: 'all' | 'offensive' | 'defensive' = 'all'): void {
    this.selectedTeam = selectedTeam;
    this.analyticsFilter = filter;
  }

  /**
   * Reset the analytics context (e.g., when starting a new game)
   */
  reset(): void {
    this.context = {
      compactedHistory: [],
      recentEvents: [],
      eventCount: 0,
      lastFlashRun: 0,
      lastDeepRun: 0,
      lastCompaction: 0,
    };
  }

  /**
   * Process a new event and run analytics models as needed
   */
  async processNewEvent(event: AnalysisEvent, liveScore: LiveScoreData): Promise<AnalyticsResult> {
    if (!this.ai) {
      console.warn('DeepAnalytics: No API key configured');
      return {};
    }

    // Add event to recent events
    this.context.recentEvents.push(event);
    this.context.eventCount++;

    // Check if compaction needed first
    if (this.shouldCompact()) {
      await this.compactContext();
    }

    // Determine which models to run
    const runFlash = (this.context.eventCount - this.context.lastFlashRun) >= FLASH_EVERY;
    const runDeep = (this.context.eventCount - this.context.lastDeepRun) >= DEEP_EVERY;

    // Run models in PARALLEL when both thresholds are met
    const promises: Promise<FastAnalytics | DeepAnalytics | null>[] = [];

    if (runFlash) {
      promises.push(this.runFlashAnalysis(liveScore));
      this.context.lastFlashRun = this.context.eventCount;
    }

    if (runDeep) {
      promises.push(this.runDeepAnalysis(liveScore));
      this.context.lastDeepRun = this.context.eventCount;
    }

    if (promises.length === 0) {
      return {};
    }

    // Execute in parallel
    const results = await Promise.all(promises);

    // Parse results
    const result: AnalyticsResult = {};
    let idx = 0;

    if (runFlash && results[idx]) {
      result.flash = results[idx] as FastAnalytics;
      idx++;
    }

    if (runDeep && results[idx]) {
      result.deep = results[idx] as DeepAnalytics;
    }

    return result;
  }

  /**
   * Check if context compaction is needed
   */
  private shouldCompact(): boolean {
    return (this.context.eventCount - this.context.lastCompaction) >= COMPACT_EVERY
      && this.context.recentEvents.length > RECENT_EVENTS_KEEP;
  }

  /**
   * Compact older events into a summary to reduce token usage
   */
  private async compactContext(): Promise<void> {
    if (!this.ai || this.context.recentEvents.length <= RECENT_EVENTS_KEEP) {
      return;
    }

    try {
      // Get events to compact (oldest, keep last 5)
      const eventsToCompact = this.context.recentEvents.slice(0, -RECENT_EVENTS_KEEP);
      const eventsStr = eventsToCompact.map(e =>
        `[${e.timestamp}] ${e.event}: ${e.details} (confidence: ${Math.round(e.confidence * 100)}%)`
      ).join('\n');

      const prompt = `You are an NFL game summarizer. Summarize these game events into a compact summary.

Events to summarize:
${eventsStr}

Respond with JSON only:
{
  "summary": "Brief 2-3 sentence summary of these events",
  "keyPlays": ["Array of 3-5 most important plays"],
  "cumulativeStats": {
    "totalPlays": number,
    "turnovers": number,
    "scoringPlays": number
  }
}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const summary: CompactedSummary = JSON.parse(text);

      // Store summary and trim recent events
      this.context.compactedHistory.push(summary);
      this.context.recentEvents = this.context.recentEvents.slice(-RECENT_EVENTS_KEEP);
      this.context.lastCompaction = this.context.eventCount;

      console.log('DeepAnalytics: Context compacted successfully');
    } catch (error) {
      console.error('DeepAnalytics: Compaction failed:', error);
    }
  }

  /**
   * Build context string for prompts
   */
  private buildContextString(liveScore: LiveScoreData): string {
    // Include compacted summaries (historical context)
    const compactedStr = this.context.compactedHistory.length > 0
      ? this.context.compactedHistory.map((s, i) =>
          `### Period ${i + 1} Summary:\n${s.summary}\nKey plays: ${s.keyPlays.join(', ')}\nStats: ${s.cumulativeStats.totalPlays} plays, ${s.cumulativeStats.turnovers} turnovers, ${s.cumulativeStats.scoringPlays} scores`
        ).join('\n\n')
      : 'No historical summary yet (early game)';

    // Include recent events (last 5 in full detail)
    const recentStr = this.context.recentEvents.length > 0
      ? this.context.recentEvents.map(e =>
          `- [${e.timestamp}] **${e.event}**: ${e.details} (${Math.round(e.confidence * 100)}% confidence)`
        ).join('\n')
      : 'No events yet';

    // Format down and distance
    const downSuffix = liveScore.down === 1 ? 'st' : liveScore.down === 2 ? 'nd' : liveScore.down === 3 ? 'rd' : 'th';

    // Build team context string if a team is selected
    let teamContextStr = '';
    if (this.selectedTeam) {
      let filterStr = 'all plays';
      if (this.analyticsFilter === 'offensive') {
        filterStr = 'offensive plays by the selected team';
      } else if (this.analyticsFilter === 'defensive') {
        filterStr = 'defensive plays by the selected team';
      }
      teamContextStr = `\n## Analysis Focus:\nTeam: ${this.selectedTeam}\nFilter: ${filterStr}`;
    }

    return `## Game Context:
${compactedStr}

## Recent Events (Last ${this.context.recentEvents.length}):
${recentStr}

## Live Score:
${liveScore.homeTeam} ${liveScore.homeScore} - ${liveScore.awayTeam} ${liveScore.awayScore}
Q${liveScore.quarter} ${liveScore.gameTime} | ${liveScore.down}${downSuffix} & ${liveScore.distance} | Possession: ${liveScore.possession}${teamContextStr}`;
  }

  /**
   * Run Flash model for quick analytics
   */
  private async runFlashAnalysis(liveScore: LiveScoreData): Promise<FastAnalytics | null> {
    if (!this.ai) return null;

    try {
      const contextStr = this.buildContextString(liveScore);

      const prompt = `You are an NFL analytics AI providing FAST real-time insights.

${contextStr}

Analyze the current game situation and provide quick analytics.

Respond with JSON only:
{
  "timestamp": "${new Date().toISOString()}",
  "epaTrend": "up" | "down" | "stable",
  "predictedNextPlay": {
    "type": "pass" | "run" | "play-action" | "screen",
    "confidence": 0-100,
    "reasoning": "Brief 10-15 word explanation"
  },
  "blitzProbability": 0-100,
  "formationTendency": "Most likely formation (e.g., Shotgun, I-Form, Spread)",
  "momentumShift": -100 to 100 (negative = away team momentum, positive = home team)
}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      return JSON.parse(text) as FastAnalytics;
    } catch (error) {
      console.error('DeepAnalytics: Flash analysis failed:', error);
      return null;
    }
  }

  /**
   * Run Pro model for deep strategic analysis
   */
  private async runDeepAnalysis(liveScore: LiveScoreData): Promise<DeepAnalytics | null> {
    if (!this.ai) return null;

    try {
      const contextStr = this.buildContextString(liveScore);

      const prompt = `You are an elite NFL strategic analyst providing DEEP game insights for Super Bowl coverage.

${contextStr}

Provide comprehensive strategic analysis of the current game situation.

Respond with JSON only:
{
  "timestamp": "${new Date().toISOString()}",
  "strategicInsight": "2-3 sentence strategic recommendation for the offense",
  "gameNarrative": "Compelling 2-3 sentence story of the game so far",
  "keyPlayerImpact": [
    {"playerName": "Player Name", "impact": "What they're doing well/poorly", "rating": 0-100}
  ],
  "predictiveModeling": {
    "driveSuccessProbability": 0-100,
    "scoringProbability": 0-100,
    "turnoverRisk": 0-100
  },
  "detailedMetrics": {
    "offensiveEfficiency": 0-100,
    "defensivePressure": 0-100
  }
}

Include 2-4 key players in the keyPlayerImpact array.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      return JSON.parse(text) as DeepAnalytics;
    } catch (error) {
      console.error('DeepAnalytics: Deep analysis failed:', error);
      return null;
    }
  }

  /**
   * Get current context stats (for debugging/monitoring)
   */
  getContextStats(): {
    eventCount: number;
    compactedPeriods: number;
    recentEventsCount: number;
    lastFlashRun: number;
    lastDeepRun: number;
  } {
    return {
      eventCount: this.context.eventCount,
      compactedPeriods: this.context.compactedHistory.length,
      recentEventsCount: this.context.recentEvents.length,
      lastFlashRun: this.context.lastFlashRun,
      lastDeepRun: this.context.lastDeepRun,
    };
  }
}

// Export singleton instance
export const deepAnalyticsService = new DeepAnalyticsService();
