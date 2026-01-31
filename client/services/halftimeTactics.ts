/**
 * Halftime Tactics Service
 *
 * Provides client-side API calls for generating and managing
 * deep think-based halftime strategies and play recommendations.
 */

import { GameState } from '../types';

export interface HalftimeTactics {
  title: string;
  summary: string;
  offensive_strategy: string;
  defensive_strategy: string;
  key_formations: Array<{
    name: string;
    when_to_use: string;
    success_rate: number;
  }>;
  personnel_adjustments: Array<{
    player: string;
    action: string;
    reason: string;
  }>;
  play_calling_priorities: string[];
  counter_measures: string[];
  probability_of_success: number;
  confidence: number;
  reasoning: string;
  simulation_playbook: Array<{
    play_number: number;
    play_type: string;
    formation: string;
    key_personnel: string[];
    expected_yards: number;
    success_probability: number;
  }>;
}

export interface PlaySuggestion {
  play_type: string;
  formation: string;
  key_personnel: string[];
  success_probability: number;
  reasoning: string;
  [key: string]: any;
}

class HalftimeTacticsService {
  private baseUrl = '/api/deep-research';

  /**
   * Generate halftime tactics using deep think model
   *
   * @param gameState Current game state
   * @param possessionTeam Team with ball (e.g., 'KC')
   * @param defenseTeam Defending team (e.g., 'SF')
   * @returns Halftime tactics or null if generation fails
   */
  async generateHalftimeTactics(
    gameState: GameState,
    possessionTeam: string = 'KC',
    defenseTeam: string = 'SF'
  ): Promise<HalftimeTactics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/halftime-tactics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_state: gameState,
          possession_team: possessionTeam,
          defense_team: defenseTeam,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HalftimeTactics = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to generate halftime tactics:', error);
      return null;
    }
  }

  /**
   * Get next play suggestion based on game situation
   *
   * @param gameState Current game state
   * @param recentPlays Last 5-10 plays from game
   * @param possessionTeam Team with ball
   * @returns Play suggestion or null if generation fails
   */
  async getNextPlaySuggestion(
    gameState: GameState,
    recentPlays: Array<Record<string, any>> = [],
    possessionTeam: string = 'KC'
  ): Promise<PlaySuggestion | null> {
    try {
      const response = await fetch(`${this.baseUrl}/next-play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_state: gameState,
          recent_plays: recentPlays,
          possession_team: possessionTeam,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PlaySuggestion = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get next play suggestion:', error);
      return null;
    }
  }

  /**
   * Format halftime tactics for display
   *
   * @param tactics Halftime tactics data
   * @returns Formatted string representation
   */
  formatTacticsForDisplay(tactics: HalftimeTactics): string {
    const sections = [
      `## ${tactics.title}`,
      `\n### Summary\n${tactics.summary}`,
      `\n### Offensive Strategy\n${tactics.offensive_strategy}`,
      `\n### Defensive Strategy\n${tactics.defensive_strategy}`,
    ];

    if (tactics.play_calling_priorities.length > 0) {
      sections.push(
        `\n### Play-Calling Priorities\n${tactics.play_calling_priorities
          .map((p, i) => `${i + 1}. ${p}`)
          .join('\n')}`
      );
    }

    if (tactics.counter_measures.length > 0) {
      sections.push(
        `\n### Counter Measures\n${tactics.counter_measures.map((c) => `• ${c}`).join('\n')}`
      );
    }

    sections.push(
      `\n### Confidence Metrics`,
      `- Success Probability: ${Math.round(tactics.probability_of_success * 100)}%`,
      `- Analysis Confidence: ${Math.round(tactics.confidence * 100)}%`
    );

    sections.push(`\n### Analysis Reasoning\n${tactics.reasoning}`);

    return sections.join('');
  }

  /**
   * Format play suggestion for display
   *
   * @param suggestion Play suggestion data
   * @returns Formatted string representation
   */
  formatPlaySuggestionForDisplay(suggestion: PlaySuggestion): string {
    const sections = [
      `**Play Type:** ${suggestion.play_type}`,
      `**Formation:** ${suggestion.formation}`,
    ];

    if (suggestion.key_personnel && Array.isArray(suggestion.key_personnel)) {
      sections.push(`**Key Personnel:** ${suggestion.key_personnel.join(', ')}`);
    }

    if (suggestion.success_probability) {
      sections.push(
        `**Success Probability:** ${Math.round(suggestion.success_probability * 100)}%`
      );
    }

    if (suggestion.reasoning) {
      sections.push(`**Reasoning:** ${suggestion.reasoning}`);
    }

    return sections.join('\n');
  }

  /**
   * Get formation analysis from tactics
   *
   * @param tactics Halftime tactics
   * @returns Formatted formations list
   */
  getFormationAnalysis(tactics: HalftimeTactics): string {
    if (!tactics.key_formations || tactics.key_formations.length === 0) {
      return 'No formations specified';
    }

    return tactics.key_formations
      .map(
        (f) =>
          `**${f.name}**: ${f.when_to_use} (${Math.round(f.success_rate * 100)}% success rate)`
      )
      .join('\n');
  }

  /**
   * Get personnel recommendations from tactics
   *
   * @param tactics Halftime tactics
   * @returns Formatted personnel adjustments
   */
  getPersonnelAdjustments(tactics: HalftimeTactics): string {
    if (!tactics.personnel_adjustments || tactics.personnel_adjustments.length === 0) {
      return 'No personnel adjustments recommended';
    }

    return tactics.personnel_adjustments
      .map((p) => `**${p.player}**: ${p.action} - ${p.reason}`)
      .join('\n');
  }

  /**
   * Get simulation playbook from tactics
   *
   * @param tactics Halftime tactics
   * @returns Formatted playbook
   */
  getSimulationPlaybook(tactics: HalftimeTactics): string {
    if (!tactics.simulation_playbook || tactics.simulation_playbook.length === 0) {
      return 'No simulation playbook generated';
    }

    return tactics.simulation_playbook
      .map(
        (play) =>
          `**Play #${play.play_number}**: ${play.play_type} from ${play.formation} (${Math.round(
            play.success_probability * 100
          )}% success, ${play.expected_yards} yards expected)`
      )
      .join('\n');
  }

  /**
   * Determine if tactics should be regenerated based on game state change
   *
   * @param previousGameState Previous game state
   * @param currentGameState Current game state
   * @returns True if significant change detected
   */
  shouldRegenerateTactics(
    previousGameState: GameState,
    currentGameState: GameState
  ): boolean {
    // Regenerate on quarter change or major score shift
    if (previousGameState.quarter !== currentGameState.quarter) return true;

    const scoreDiff =
      Math.abs(
        currentGameState.score.home - currentGameState.score.away -
          (previousGameState.score.home - previousGameState.score.away)
      ) >= 7;

    if (scoreDiff) return true;

    // Regenerate on possession change
    if (previousGameState.possession !== currentGameState.possession) return true;

    return false;
  }
}

// Export singleton instance
export const halftimeTacticsService = new HalftimeTacticsService();
