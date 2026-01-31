/**
 * Match Service - API client for match/session management
 *
 * Handles communication with backend for:
 * - Match session management (start, restart, end)
 * - Analysis events storage and retrieval
 * - Highlights management
 * - Metrics aggregation
 */

const API_BASE = "http://localhost:8000";

// Types
export interface MatchInfo {
    id: string;
    created_at: string | null;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
    quarter: number;
    clock: string;
    possession: string;
    down: number;
    distance: number;
    status: string;
    event_count: number;
    highlight_count: number;
}

export interface AnalysisEventData {
    id: number;
    timestamp: string;
    event: string;
    details: string;
    confidence: number;
    player_name: string | null;
    team: string | null;
    yards: number | null;
    play_type: string | null;
    formation: string | null;
    is_explosive: boolean;
    is_turnover: boolean;
    is_scoring: boolean;
    epa_value: number;
}

export interface HighlightData {
    id: string;
    timestamp: string;
    event: string;
    description: string;
    confidence: number;
    player_name: string | null;
    imageUrl: string | null;
}

export interface MetricsData {
    epa: number;
    wpa: number;
    totalEvents: number;
    turnoversForced: number;
    turnoversLost: number;
    turnoverDifferential: number;
    redZoneAttempts: number;
    redZoneTDs: number;
    redZoneEfficiency: number;
    thirdDownAttempts: number;
    thirdDownConversions: number;
    thirdDownRate: number;
    explosiveRuns: number;
    explosivePasses: number;
    totalExplosivePlays: number;
    playTypes: {
        pass: number;
        run: number;
        special: number;
    };
    possessionPercentage: number;
    avgPlayerSpeed: number;
    maxPlayerSpeed: number;
    routeEfficiency: number;
    formations: Array<{ name: string; count: number }>;
}

export interface FullMatchData {
    match: MatchInfo;
    events: AnalysisEventData[];
    highlights: HighlightData[];
    metrics: MetricsData | null;
}

/**
 * Start a new match session
 */
export async function startMatch(homeTeam = "KC", awayTeam = "SF"): Promise<MatchInfo | null> {
    try {
        const response = await fetch(`${API_BASE}/match/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        return data.match;
    } catch (error) {
        console.error("Failed to start match:", error);
        return null;
    }
}

/**
 * Restart match - ends current session and starts fresh
 * Previous data is preserved in database for history
 */
export async function restartMatch(): Promise<MatchInfo | null> {
    try {
        const response = await fetch(`${API_BASE}/match/restart`, {
            method: "POST",
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        return data.match;
    } catch (error) {
        console.error("Failed to restart match:", error);
        return null;
    }
}

/**
 * Get current active match
 */
export async function getCurrentMatch(): Promise<MatchInfo | null> {
    try {
        const response = await fetch(`${API_BASE}/match/current`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to get current match:", error);
        return null;
    }
}

/**
 * Get current match with all data (events, highlights, metrics)
 */
export async function getFullMatchData(eventLimit = 50): Promise<FullMatchData | null> {
    try {
        const response = await fetch(`${API_BASE}/match/current/full?event_limit=${eventLimit}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to get full match data:", error);
        return null;
    }
}

/**
 * Add an analysis event to the current match
 */
export async function addEvent(
    timestamp: string,
    event: string,
    details: string,
    confidence: number
): Promise<AnalysisEventData | null> {
    try {
        const response = await fetch(`${API_BASE}/match/current/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp, event, details, confidence }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        return data.event;
    } catch (error) {
        console.error("Failed to add event:", error);
        return null;
    }
}

/**
 * Add a highlight to the current match
 */
export async function addHighlight(
    timestamp: string,
    event: string,
    description: string,
    confidence: number,
    imageData?: string,
    playerName?: string
): Promise<HighlightData | null> {
    try {
        const response = await fetch(`${API_BASE}/match/current/highlight`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                timestamp,
                event,
                description,
                confidence,
                image_data: imageData,
                player_name: playerName,
            }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        return data.highlight;
    } catch (error) {
        console.error("Failed to add highlight:", error);
        return null;
    }
}

/**
 * Get events for current match
 */
export async function getEvents(limit = 100, offset = 0): Promise<AnalysisEventData[]> {
    try {
        const response = await fetch(`${API_BASE}/match/current/events?limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to get events:", error);
        return [];
    }
}

/**
 * Get highlights for current match
 */
export async function getHighlights(): Promise<HighlightData[]> {
    try {
        const response = await fetch(`${API_BASE}/match/current/highlights`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to get highlights:", error);
        return [];
    }
}

/**
 * Get metrics for current match
 */
export async function getMetrics(): Promise<MetricsData | null> {
    try {
        const response = await fetch(`${API_BASE}/match/current/metrics`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        // Return null if empty object
        if (Object.keys(data).length === 0) return null;
        return data;
    } catch (error) {
        console.error("Failed to get metrics:", error);
        return null;
    }
}

/**
 * Get match history
 */
export async function getMatchHistory(limit = 20): Promise<MatchInfo[]> {
    try {
        const response = await fetch(`${API_BASE}/match/history?limit=${limit}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to get match history:", error);
        return [];
    }
}

/**
 * End a specific match
 */
export async function endMatch(matchId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/match/end/${matchId}`, {
            method: "POST",
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to end match:", error);
        return false;
    }
}
