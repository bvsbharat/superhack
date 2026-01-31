/**
 * Deep Research Integration Service
 *
 * Bridges live analysis events with the RAG context store
 * Automatically adds events to context for real-time analysis
 */

import { AnalysisResult, GameState } from '../types';
import { useDeepResearch } from '../hooks/useDeepResearch';

class DeepResearchIntegrationService {
  private lastEventTime = 0;
  private eventThrottleMs = 500; // Throttle events to prevent API overload

  /**
   * Process a detected event and add to context store
   */
  async processDetectedEvent(
    event: AnalysisResult,
    gameState: GameState,
    deepResearchService: ReturnType<typeof useDeepResearch>
  ): Promise<void> {
    const now = Date.now();

    // Throttle events
    if (now - this.lastEventTime < this.eventThrottleMs) {
      return;
    }
    this.lastEventTime = now;

    try {
      // Determine importance and categorization
      const eventType = this.categorizeEvent(event);
      const details = this.extractEventDetails(event);

      // Add to context store
      await deepResearchService.addEvent(
        eventType,
        event.details,
        `${gameState.clock}`,
        event.team,
        event.player_name,
        details
      );
    } catch (error) {
      console.error('Failed to process event for deep research:', error);
    }
  }

  /**
   * Categorize event type for context store importance ranking
   */
  private categorizeEvent(event: AnalysisResult): string {
    if (event.is_turnover) return 'turnover';
    if (event.is_scoring) return 'scoring';
    if (event.is_explosive) return 'explosive_play';

    const eventLower = event.event.toLowerCase();

    if (eventLower.includes('pass')) return 'pass';
    if (eventLower.includes('run')) return 'run';
    if (eventLower.includes('sack')) return 'sack';
    if (eventLower.includes('interception')) return 'interception';
    if (eventLower.includes('fumble')) return 'fumble';
    if (eventLower.includes('touchdown')) return 'touchdown';
    if (eventLower.includes('field goal')) return 'field_goal';
    if (eventLower.includes('formation')) return 'formation_change';
    if (eventLower.includes('tackle')) return 'tackle';

    return 'play';
  }

  /**
   * Extract relevant details from event
   */
  private extractEventDetails(event: AnalysisResult): Record<string, any> {
    return {
      confidence: event.confidence,
      yards: event.yards,
      play_type: event.play_type,
      formation: event.formation,
      is_explosive: event.is_explosive,
      is_turnover: event.is_turnover,
      is_scoring: event.is_scoring,
      epa_value: event.epa_value,
    };
  }

  /**
   * Generate natural language summary for recent events (for UI display)
   */
  generateEventSummary(events: AnalysisResult[], gameState: GameState): string {
    if (events.length === 0) {
      return `No significant plays detected in Q${gameState.quarter}`;
    }

    const recent = events.slice(-5);
    const turnovers = recent.filter((e) => e.is_turnover).length;
    const scoring = recent.filter((e) => e.is_scoring).length;
    const explosive = recent.filter((e) => e.is_explosive).length;

    const parts: string[] = [];

    if (turnovers > 0) parts.push(`${turnovers} turnover${turnovers > 1 ? 's' : ''}`);
    if (scoring > 0) parts.push(`${scoring} scoring play${scoring > 1 ? 's' : ''}`);
    if (explosive > 0) parts.push(`${explosive} explosive play${explosive > 1 ? 's' : ''}`);

    const summary = parts.length > 0 ? `${parts.join(', ')} in recent plays` : 'Steady pace of play detected';

    return summary;
  }

  /**
   * Build context for halftime analysis
   */
  buildHalftimeContext(
    gameState: GameState,
    recentEvents: AnalysisResult[]
  ): {
    summary: string;
    keyStats: Record<string, number>;
    trends: string[];
  } {
    const keyStats = {
      total_plays: recentEvents.length,
      turnovers: recentEvents.filter((e) => e.is_turnover).length,
      scoring_plays: recentEvents.filter((e) => e.is_scoring).length,
      explosive_plays: recentEvents.filter((e) => e.is_explosive).length,
      total_yards: recentEvents.reduce((sum, e) => sum + (e.yards || 0), 0),
      avg_epa: recentEvents.length > 0 ? recentEvents.reduce((sum, e) => sum + e.epa_value, 0) / recentEvents.length : 0,
    };

    const trends: string[] = [];

    if (keyStats.turnovers > 2) {
      trends.push('High turnover rate - focus on ball security');
    }
    if (keyStats.explosive_plays > 3) {
      trends.push('Strong offensive explosiveness - maintain tempo');
    }
    if (keyStats.avg_epa < -0.1) {
      trends.push('Negative EPA trend - adjust play calling');
    }

    const summary = `
Q${gameState.quarter} Summary:
- ${keyStats.total_plays} plays (${keyStats.turnovers} turnovers, ${keyStats.scoring_plays} scoring plays)
- ${keyStats.total_yards} total yards
- Average EPA: ${keyStats.avg_epa.toFixed(2)}
    `.trim();

    return { summary, keyStats, trends };
  }

  /**
   * Generate strategic question suggestions based on game state
   */
  generateStrategicQuestions(gameState: GameState, team: string): string[] {
    const questions: string[] = [
      `What are ${team}'s defensive weaknesses we should exploit?`,
      `How should we attack against their formation?`,
      `Which offensive players should we feature more?`,
      `What adjustments should we make for the next half?`,
      `How is their secondary playing coverage?`,
      `Are they vulnerable to the run game?`,
      `What formations have been most successful?`,
      `How should we manage the clock in critical situations?`,
    ];

    // Add contextual questions based on game state
    if (gameState.quarter === 4 && Math.abs(gameState.score.home - gameState.score.away) <= 7) {
      questions.push('What's our best strategy for a close finish?');
    }

    if (gameState.down === 3 || gameState.down === 4) {
      questions.push('What play has the best chance of success here?');
    }

    if (gameState.winProb < 30) {
      questions.push('How do we improve our win probability?');
    }

    return questions.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  /**
   * Format player recommendation for field display
   */
  formatPlayerForDisplay(playerName: string, action: string, position: string): {
    displayName: string;
    displayAction: string;
    icon: string;
  } {
    return {
      displayName: playerName.toUpperCase(),
      displayAction: action.length > 50 ? action.substring(0, 47) + '...' : action,
      icon: this.getPositionIcon(position),
    };
  }

  /**
   * Get icon for position
   */
  private getPositionIcon(position: string): string {
    const pos = position.toUpperCase();
    if (pos.includes('QB')) return '🎯';
    if (pos.includes('WR')) return '📍';
    if (pos.includes('RB')) return '⚡';
    if (pos.includes('TE')) return '🎪';
    if (pos.includes('OL') || pos.includes('TACKLE') || pos.includes('GUARD')) return '🛡️';
    if (pos.includes('DE') || pos.includes('END')) return '🔥';
    if (pos.includes('DB') || pos.includes('CB') || pos.includes('S')) return '👁️';
    if (pos.includes('LB')) return '⚔️';
    return '👤';
  }
}

export const deepResearchIntegration = new DeepResearchIntegrationService();
