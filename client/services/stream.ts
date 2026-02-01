/**
 * Stream service for WebRTC-based video analysis.
 *
 * Provides functions to create streaming sessions, manage
 * WebRTC connections, and handle real-time analysis results.
 */

const API_BASE = "http://localhost:8000";

export interface StreamSession {
    session_id: string;
    status: string;
    stream_url: string | null;
    api_key?: string;
    error?: string;
}

export interface StreamCapabilities {
    vision_agents_available: boolean;
    stream_configured: boolean;
    gemini_configured: boolean;
    agent_initialized: boolean;
    features: {
        webrtc_streaming: boolean;
        real_time_analysis: boolean;
        sub_30ms_latency: boolean;
        camera_capture: boolean;
        screen_capture: boolean;
    };
}

export interface AnalysisEvent {
    timestamp: string;
    event: string;
    details: string;
    confidence: number;
    playerName?: string;
    team?: string;
    yards?: number;
    playType?: string;
    formation?: string;
    isExplosive?: boolean;
    isTurnover?: boolean;
    isScoring?: boolean;
    epaValue?: number;
    isManualCapture?: boolean;  // True if from manual frame capture
    detectedTeams?: {
        home?: string;
        away?: string;
    };
    // Live game state extracted from video frame
    gameInfo?: {
        homeTeam?: string;
        awayTeam?: string;
        homeScore?: number;
        awayScore?: number;
        quarter?: number;
        gameTime?: string;
        down?: number;
        distance?: number;
        yardLine?: number;
        possession?: string;
    };
}

/**
 * Check if streaming capabilities are available.
 */
export async function getStreamCapabilities(): Promise<StreamCapabilities | null> {
    try {
        const response = await fetch(`${API_BASE}/stream/capabilities`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to get stream capabilities:", error);
        return null;
    }
}

/**
 * Create a new streaming session for video analysis.
 */
export async function createStreamSession(): Promise<StreamSession | null> {
    try {
        const response = await fetch(`${API_BASE}/stream/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to create stream session:", error);
        return null;
    }
}

/**
 * End an active streaming session.
 */
export async function endStreamSession(sessionId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/stream/sessions/${sessionId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.stopped === true;
    } catch (error) {
        console.error("Failed to end stream session:", error);
        return false;
    }
}

/**
 * Get information about a specific session.
 */
export async function getSessionInfo(sessionId: string): Promise<StreamSession | null> {
    try {
        const response = await fetch(`${API_BASE}/stream/sessions/${sessionId}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to get session info:", error);
        return null;
    }
}

/**
 * List all active streaming sessions.
 */
export async function listSessions(): Promise<StreamSession[]> {
    try {
        const response = await fetch(`${API_BASE}/stream/sessions`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error("Failed to list sessions:", error);
        return [];
    }
}

/**
 * Connection status for the WebRTC stream.
 */
export type ConnectionStatus =
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error";

/**
 * Stream manager class for handling WebRTC connections.
 */
export class StreamManager {
    private sessionId: string | null = null;
    private mediaStream: MediaStream | null = null;
    private onStatusChange: ((status: ConnectionStatus) => void) | null = null;
    private onAnalysisResult: ((result: AnalysisEvent) => void) | null = null;

    constructor() {
        this.sessionId = null;
        this.mediaStream = null;
    }

    /**
     * Set callback for connection status changes.
     */
    setStatusCallback(callback: (status: ConnectionStatus) => void) {
        this.onStatusChange = callback;
    }

    /**
     * Set callback for analysis results.
     */
    setAnalysisCallback(callback: (result: AnalysisEvent) => void) {
        this.onAnalysisResult = callback;
    }

    /**
     * Start streaming from camera.
     */
    async startCamera(): Promise<boolean> {
        try {
            this.updateStatus("connecting");

            // Request camera access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                },
                audio: false,
            });

            // Create session on backend
            const session = await createStreamSession();
            if (!session || session.status === "error") {
                throw new Error(session?.error || "Failed to create session");
            }

            this.sessionId = session.session_id;
            this.updateStatus("connected");

            return true;
        } catch (error) {
            console.error("Failed to start camera:", error);
            this.updateStatus("error");
            return false;
        }
    }

    /**
     * Start streaming from screen capture.
     */
    async startScreenCapture(): Promise<boolean> {
        try {
            this.updateStatus("connecting");

            // Request screen capture access
            this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 },
                },
                audio: false,
            });

            // Create session on backend
            const session = await createStreamSession();
            if (!session || session.status === "error") {
                throw new Error(session?.error || "Failed to create session");
            }

            this.sessionId = session.session_id;
            this.updateStatus("connected");

            return true;
        } catch (error) {
            console.error("Failed to start screen capture:", error);
            this.updateStatus("error");
            return false;
        }
    }

    /**
     * Stop the current stream and end the session.
     */
    async stop(): Promise<void> {
        // Stop media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // End session on backend
        if (this.sessionId) {
            await endStreamSession(this.sessionId);
            this.sessionId = null;
        }

        this.updateStatus("disconnected");
    }

    /**
     * Get the current media stream for video preview.
     */
    getMediaStream(): MediaStream | null {
        return this.mediaStream;
    }

    /**
     * Get the current session ID.
     */
    getSessionId(): string | null {
        return this.sessionId;
    }

    private updateStatus(status: ConnectionStatus) {
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    }
}

// Singleton instance
export const streamManager = new StreamManager();

/**
 * Analyze a single video frame by sending it to the backend.
 */
export async function analyzeFrame(imageBase64: string): Promise<AnalysisEvent[] | null> {
    try {
        const response = await fetch(`${API_BASE}/analyze_frame`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: imageBase64 }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.analysis || [];
    } catch (error) {
        console.error("Failed to analyze frame:", error);
        return null;
    }
}

// 3-second delay between frame analysis requests to prevent rate limiting (user requirement)
const FRAME_ANALYSIS_INTERVAL_MS = 3000;

/**
 * Start continuous frame analysis from a video element.
 * Returns a stop function to end the analysis loop.
 * Analyzes frames every 3 seconds to respect rate limits.
 */
export function startFrameAnalysis(
    videoElement: HTMLVideoElement,
    onAnalysis: (events: AnalysisEvent[]) => void,
    intervalMs: number = FRAME_ANALYSIS_INTERVAL_MS // Analyze every 3 seconds
): () => void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let isRunning = true;
    let frameCount = 0;

    console.log(`Starting frame analysis with ${intervalMs}ms interval (${(intervalMs / 1000).toFixed(1)}s delay between requests)`);

    const analyzeLoop = async () => {
        if (!isRunning || !ctx) return;

        try {
            // Set canvas size to video size
            canvas.width = videoElement.videoWidth || 640;
            canvas.height = videoElement.videoHeight || 480;

            // Draw current video frame to canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Convert to base64 (JPEG for smaller size)
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

            // Send to backend for analysis
            const results = await analyzeFrame(imageBase64);

            // Only call callback if we have actual results (skip empty responses)
            if (results && results.length > 0) {
                // Add frame count to timestamp for uniqueness
                const timestampedResults = results.map(r => ({
                    ...r,
                    timestamp: r.timestamp || formatTimestamp(frameCount * (intervalMs / 1000))
                }));
                onAnalysis(timestampedResults);
            }

            frameCount++;
        } catch (err) {
            console.error("Frame analysis error:", err);
        }

        // Schedule next analysis with 3-second delay
        if (isRunning) {
            setTimeout(analyzeLoop, intervalMs);
        }
    };

    // Start the loop
    analyzeLoop();

    // Return stop function
    return () => {
        isRunning = false;
        console.log("Frame analysis stopped");
    };
}

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
