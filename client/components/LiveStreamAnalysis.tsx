import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Camera,
    Monitor,
    StopCircle,
    Loader2,
    AlertCircle,
    Wifi,
    WifiOff,
    Video,
} from "lucide-react";
import {
    streamManager,
    ConnectionStatus,
    AnalysisEvent,
    getStreamCapabilities,
    StreamCapabilities,
} from "../services/stream";

interface LiveStreamAnalysisProps {
    onAnalysisResult?: (result: AnalysisEvent) => void;
}

export const LiveStreamAnalysis: React.FC<LiveStreamAnalysisProps> = ({
    onAnalysisResult,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [capabilities, setCapabilities] = useState<StreamCapabilities | null>(null);
    const [analysisResults, setAnalysisResults] = useState<AnalysisEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Check capabilities on mount
    useEffect(() => {
        const checkCapabilities = async () => {
            const caps = await getStreamCapabilities();
            setCapabilities(caps);
        };
        checkCapabilities();
    }, []);

    // Set up stream manager callbacks
    useEffect(() => {
        streamManager.setStatusCallback(setStatus);
        streamManager.setAnalysisCallback((result) => {
            setAnalysisResults((prev) => [result, ...prev].slice(0, 20));
            if (onAnalysisResult) {
                onAnalysisResult(result);
            }
        });

        return () => {
            streamManager.stop();
        };
    }, [onAnalysisResult]);

    // Update video element when stream starts
    useEffect(() => {
        const mediaStream = streamManager.getMediaStream();
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [status]);

    const handleStartCamera = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const success = await streamManager.startCamera();
            if (!success) {
                setError("Failed to start camera. Please check permissions.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleStartScreenCapture = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const success = await streamManager.startScreenCapture();
            if (!success) {
                setError("Failed to start screen capture. Please check permissions.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleStop = useCallback(async () => {
        setLoading(true);
        await streamManager.stop();
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setLoading(false);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case "connected":
                return "text-green-500";
            case "connecting":
            case "reconnecting":
                return "text-amber-500";
            case "error":
                return "text-red-500";
            default:
                return "text-white/40";
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case "connected":
                return <Wifi className="text-green-500" size={14} />;
            case "connecting":
            case "reconnecting":
                return <Loader2 className="text-amber-500 animate-spin" size={14} />;
            case "error":
                return <AlertCircle className="text-red-500" size={14} />;
            default:
                return <WifiOff className="text-white/40" size={14} />;
        }
    };

    // Check if streaming is available
    const streamingAvailable = capabilities?.vision_agents_available && capabilities?.stream_configured;

    return (
        <div className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Video className="text-amber-400" size={18} />
                    <h3 className="text-sm font-bold text-white/80">Live Analysis</h3>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className={`text-xs font-medium ${getStatusColor()}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
            </div>

            {/* Capability warning */}
            {capabilities && !streamingAvailable && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
                        <div className="text-xs text-amber-200/80">
                            <p className="font-medium">WebRTC streaming not available</p>
                            <p className="mt-1 text-amber-200/60">
                                {!capabilities.vision_agents_available
                                    ? "vision-agents package not installed on backend"
                                    : "Stream API keys not configured"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Video preview */}
            <div className="relative aspect-video bg-black/50 rounded-2xl overflow-hidden border border-white/10">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                {status === "disconnected" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-xs text-white/30">No stream active</p>
                    </div>
                )}
                {status === "connecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-amber-500" size={24} />
                            <p className="text-xs text-white/60">Connecting...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                {status === "disconnected" ? (
                    <>
                        <button
                            onClick={handleStartCamera}
                            disabled={loading || !streamingAvailable}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3 px-4 rounded-xl transition-colors text-xs"
                        >
                            <Camera size={16} />
                            Camera
                        </button>
                        <button
                            onClick={handleStartScreenCapture}
                            disabled={loading || !streamingAvailable}
                            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white font-bold py-3 px-4 rounded-xl transition-colors text-xs"
                        >
                            <Monitor size={16} />
                            Screen
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleStop}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors text-xs"
                    >
                        <StopCircle size={16} />
                        Stop Stream
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                        <p className="text-xs text-red-200/80">{error}</p>
                    </div>
                </div>
            )}

            {/* Analysis results */}
            {analysisResults.length > 0 && (
                <div className="space-y-2 mt-4">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        Live Events
                    </p>
                    {analysisResults.slice(0, 5).map((result, i) => (
                        <div
                            key={i}
                            className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono text-amber-500">
                                    {result.timestamp}
                                </span>
                                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded text-white/60">
                                    {result.event}
                                </span>
                            </div>
                            <p className="text-xs text-white/70 leading-snug">
                                {result.details}
                            </p>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full"
                                    style={{ width: `${result.confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            {status === "disconnected" && !error && (
                <div className="text-center py-4">
                    <p className="text-xs text-white/40">
                        {streamingAvailable
                            ? "Start camera or screen capture to analyze video in real-time"
                            : "Configure vision-agents backend for live streaming"}
                    </p>
                </div>
            )}
        </div>
    );
};
