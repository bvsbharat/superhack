/**
 * Simulation Service - Manages simulation snapshots and data capture
 */

const API_BASE = "http://localhost:8000";

export interface SimulationSnapshot {
  id: string;
  timestamp: string;
  play_cycle: number;
  sim_seconds_remaining: number;
  quarter: number;
  clock: string;
  score: {
    home: number;
    away: number;
  };
  down: number;
  distance: number;
  possession: string;
  line_of_scrimmage_y: number;
  player_positions: Record<string, { x: number; y: number }> | null;
  ball_position: {
    x: number;
    y: number;
  };
}

/**
 * Save a simulation snapshot to the database
 */
export async function saveSimulationSnapshot(
  matchId: string,
  snapshot: {
    timestamp: string;
    play_cycle: number;
    sim_seconds_remaining: number;
    quarter: number;
    clock: string;
    score_home: number;
    score_away: number;
    down: number;
    distance: number;
    possession: string;
    line_of_scrimmage_y: number;
    player_positions?: Record<string, { x: number; y: number }>;
    ball_x: number;
    ball_y: number;
  }
): Promise<SimulationSnapshot | null> {
  try {
    const response = await fetch(`${API_BASE}/match/${matchId}/simulation/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      console.error(`Failed to save simulation snapshot: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving simulation snapshot:", error);
    return null;
  }
}

/**
 * Get all simulation snapshots for a match
 */
export async function getSimulationSnapshots(
  matchId: string,
  limit: number = 500
): Promise<SimulationSnapshot[]> {
  try {
    const response = await fetch(
      `${API_BASE}/match/${matchId}/simulation/snapshots?limit=${limit}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch simulation snapshots: ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching simulation snapshots:", error);
    return [];
  }
}

/**
 * Replay a simulation from saved snapshots
 */
export function* replaySimulationSnapshots(snapshots: SimulationSnapshot[]) {
  for (const snapshot of snapshots) {
    yield {
      gameState: {
        clock: snapshot.clock,
        quarter: snapshot.quarter,
        score: {
          home: snapshot.score.home,
          away: snapshot.score.away,
        },
        down: snapshot.down,
        distance: snapshot.distance,
        possession: snapshot.possession,
      },
      dynamicPositions: snapshot.player_positions || {},
      ballPos: snapshot.ball_position,
      losY: snapshot.line_of_scrimmage_y,
    };
  }
}
