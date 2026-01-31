
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, ViewTab } from '../types';
import { Maximize2, Minimize2, Play, Timer, Radio, Camera, Monitor, StopCircle, Loader2, RotateCcw, Mic, MicOff, Waves, Brain, Zap } from 'lucide-react';
import { streamManager, createStreamSession, endStreamSession, AnalysisEvent, getStreamCapabilities, startFrameAnalysis } from '../services/stream';
import { MatchInfo } from '../services/match';
import { useLiveCommentary } from '../hooks/useLiveCommentary';
import { DeepResearch } from './DeepResearch';
import { captureAndAnalyzeFrame } from '../services/frameCapture';

interface MatchOverviewProps {
  gameState: GameState;
  selectedPlayerId: string;
  onPlayerSelect: (player: Player) => void;
  isSimulating: boolean;
  simCountdown: number;
  dynamicPositions: Record<string, {x: number, y: number}>;
  ballPos: { x: number, y: number };
  onStartSimulation: () => void;
  onStopSimulation?: () => void;
  onLoadPreviousSimulation?: () => void;
  isLiveMode: boolean;
  onLiveModeChange: (live: boolean) => void;
  liveStream: MediaStream | null;
  onLiveStreamChange: (stream: MediaStream | null) => void;
  onLiveAnalysis: (event: AnalysisEvent) => void;
  onRestartMatch?: () => Promise<void>;
  isLoadingMatch?: boolean;
  currentMatch?: MatchInfo | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  activeView: ViewTab;
  onViewChange: (view: ViewTab) => void;
}

const FieldSVG = ({
  mode,
  orientation = 'vertical',
  selectedPlayerId,
  onPlayerSelect,
  isSimulating,
  dynamicPositions,
  ballPos
}: {
  mode: 'offense' | 'defense' | 'live',
  orientation?: 'vertical' | 'horizontal',
  selectedPlayerId: string,
  onPlayerSelect: (player: Player) => void,
  isSimulating: boolean,
  dynamicPositions: Record<string, {x: number, y: number}>,
  ballPos: { x: number, y: number }
}) => {
  const isHoriz = orientation === 'horizontal';
  const sidePadding = 60;
  
  const yardLines = [
    { label: 'G', pos: 40 },
    { label: '10', pos: 90 },
    { label: '20', pos: 140 },
    { label: '30', pos: 190 },
    { label: '40', pos: 240 },
    { label: '50', pos: 290 },
    { label: '40', pos: 340 },
    { label: '30', pos: 390 },
    { label: '20', pos: 440 },
    { label: '10', pos: 490 },
    { label: 'G', pos: 540 },
  ];

  const mapPos = (x: number, y: number) => {
    return isHoriz ? { cx: y, cy: x } : { cx: x, cy: y };
  };

  const offenseKC = [
    { id: 'p1', x: 100, y: 320, label: 'QB', name: 'P. MAHOMES', team: 'KC', statA: '12 / 14 Pass', speed: 15.9, rate: 113, yards: 284 },
    { id: 'p2', x: 100, y: 305, label: 'C', name: 'C. HUMPHREY', team: 'KC', statA: '98% Snap', speed: 12.1, rate: 94, yards: 0 },
    { id: 'p3', x: 88, y: 305, label: 'G', name: 'J. THUNEY', team: 'KC', statA: '2 Blocks', speed: 10.5, rate: 88, yards: 0 },
    { id: 'p4', x: 112, y: 305, label: 'G', name: 'T. SMITH', team: 'KC', statA: '3 Blocks', speed: 10.8, rate: 91, yards: 0 },
    { id: 'p5', x: 74, y: 305, label: 'T', name: 'D. SMITH', team: 'KC', statA: '1 Sack Allowed', speed: 11.2, rate: 76, yards: 0 },
    { id: 'p6', x: 126, y: 305, label: 'T', name: 'J. TAYLOR', team: 'KC', statA: '0 Sack Allowed', speed: 11.5, rate: 84, yards: 0 },
    { id: 'p7', x: 45, y: 305, label: 'WR', name: 'X. WORTHY', team: 'KC', statA: '4 Rec / 82 Yds', speed: 22.4, rate: 105, yards: 82 },
    { id: 'p8', x: 155, y: 305, label: 'WR', name: 'R. RICE', team: 'KC', statA: '6 Rec / 74 Yds', speed: 19.8, rate: 98, yards: 74 },
    { id: 'p9', x: 140, y: 305, label: 'TE', name: 'T. KELCE', team: 'KC', statA: '5 Rec / 58 Yds', speed: 16.5, rate: 112, yards: 58 },
    { id: 'p10', x: 100, y: 345, label: 'RB', name: 'I. PACHECO', team: 'KC', statA: '14 Car / 65 Yds', speed: 21.1, rate: 89, yards: 65 },
    { id: 'p11', x: 60, y: 305, label: 'SL', name: 'J. WATSON', team: 'KC', statA: '1 Rec / 12 Yds', speed: 20.2, rate: 78, yards: 12 },
  ];

  const defenseSF = [
    { id: 'd1', x: 92, y: 295, label: 'DT', name: 'J. HARGRAVE', team: 'SF', statA: '2 Tackles', speed: 14.1, rate: 88, yards: 0 },
    { id: 'd2', x: 108, y: 295, label: 'DT', name: 'M. COLLINS', team: 'SF', statA: '1 Tackle', speed: 13.8, rate: 82, yards: 0 },
    { id: 'd3', x: 78, y: 295, label: 'DE', name: 'N. BOSA', team: 'SF', statA: '1 Sack / 3 Hur', speed: 18.2, rate: 124, yards: 0 },
    { id: 'd4', x: 122, y: 295, label: 'DE', name: 'L. FLOYD', team: 'SF', statA: '1 TFL', speed: 17.5, rate: 96, yards: 0 },
    { id: 'd5', x: 100, y: 270, label: 'LB', name: 'F. WARNER', team: 'SF', statA: '8 Tackles', speed: 19.4, rate: 115, yards: 0 },
    { id: 'd6', x: 80, y: 270, label: 'LB', name: 'D. GREENLAW', team: 'SF', statA: '6 Tackles', speed: 18.8, rate: 92, yards: 0 },
    { id: 'd7', x: 120, y: 270, label: 'LB', name: 'D. CAMPBELL', team: 'SF', statA: '4 Tackles', speed: 17.2, rate: 85, yards: 0 },
    { id: 'd8', x: 45, y: 280, label: 'CB', name: 'C. WARD', team: 'SF', statA: '2 PBU', speed: 21.6, rate: 102, yards: 0 },
    { id: 'd9', x: 155, y: 280, label: 'CB', name: 'I. YIADOM', team: 'SF', statA: '1 PBU', speed: 20.9, rate: 88, yards: 0 },
    { id: 'd10', x: 85, y: 220, label: 'FS', name: 'J. BROWN', team: 'SF', statA: '1 INT', speed: 20.1, rate: 118, yards: 0 },
    { id: 'd11', x: 115, y: 220, label: 'SS', name: 'T. HUFANGA', team: 'SF', statA: '5 Tackles', speed: 19.7, rate: 95, yards: 0 },
  ];

  const handlePlayerClick = (p: any) => {
    onPlayerSelect({
      id: p.id,
      name: p.name,
      role: p.label,
      team: p.team as 'KC' | 'SF',
      speed: p.speed,
      statA: p.statA,
      rate: p.rate,
      airYards: p.yards || 0,
      avatar: `https://picsum.photos/100/100?random=${p.id}`
    });
  };

  const viewBoxWidth = isHoriz ? 580 : 200 + (sidePadding * 2);
  const viewBoxHeight = isHoriz ? 200 + (sidePadding * 2) : 580;
  const viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
  const transform = isHoriz ? `translate(0, ${sidePadding})` : `translate(${sidePadding}, 0)`;

  return (
    <svg viewBox={viewBox} className="w-full h-full rounded-2xl shadow-2xl overflow-visible bg-[#050505]" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="grass-stripes" x="0" y="0" width={isHoriz ? 100 : 200} height={isHoriz ? 200 : 100} patternUnits="userSpaceOnUse">
          {isHoriz ? (
             <>
               <rect x="0" y="0" width="50" height="200" fill="#1d4d2f" />
               <rect x="50" y="0" width="50" height="200" fill="#1a4329" />
             </>
          ) : (
            <>
              <rect x="0" y="0" width="200" height="50" fill="#1d4d2f" />
              <rect x="0" y="50" width="200" height="50" fill="#1a4329" />
            </>
          )}
        </pattern>
        <linearGradient id="ball-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4a4a4a' }} />
          <stop offset="100%" style={{ stopColor: '#2d2d2d' }} />
        </linearGradient>
      </defs>

      {/* Stadium / Sidelines Context */}
      <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="#0a0a0a" />
      
      {/* Sideline markings/texture */}
      {isHoriz ? (
        <>
           {/* Top Sideline */}
           <rect x="0" y="0" width="580" height={sidePadding} fill="#1a1a1a" />
           <line x1="0" y1={sidePadding} x2="580" y2={sidePadding} stroke="white" strokeWidth="2" opacity="0.5" />
           <text x="290" y={sidePadding/2} fill="#333" fontSize="24" fontWeight="900" textAnchor="middle" dominantBaseline="middle">STADIUM SIDELINE</text>
           
           {/* Bottom Sideline */}
           <rect x="0" y={200 + sidePadding} width="580" height={sidePadding} fill="#1a1a1a" />
           <line x1="0" y1={200 + sidePadding} x2="580" y2={200 + sidePadding} stroke="white" strokeWidth="2" opacity="0.5" />
        </>
      ) : (
        <>
           {/* Left Sideline */}
           <rect x="0" y="0" width={sidePadding} height="580" fill="#1a1a1a" />
           <line x1={sidePadding} y1="0" x2={sidePadding} y2="580" stroke="white" strokeWidth="2" opacity="0.5" />
           <text x={sidePadding/2} y="290" fill="#333" fontSize="24" fontWeight="900" textAnchor="middle" transform={`rotate(-90, ${sidePadding/2}, 290)`}>STADIUM SIDELINE</text>

           {/* Right Sideline */}
           <rect x={200 + sidePadding} y="0" width={sidePadding} height="580" fill="#1a1a1a" />
           <line x1={200 + sidePadding} y1="0" x2={200 + sidePadding} y2="580" stroke="white" strokeWidth="2" opacity="0.5" />
        </>
      )}

      <g transform={transform}>
        <rect x="0" y="0" width={isHoriz ? 580 : 200} height={isHoriz ? 200 : 580} fill="url(#grass-stripes)" />
        
        {/* Endzones */}
      {isHoriz ? (
        <>
          <rect x="0" y="30" width="40" height="140" fill="#7f1d1d" opacity="0.9" />
          <rect x="540" y="30" width="40" height="140" fill="#a16207" opacity="0.9" />
          <rect x="0" y="30" width="580" height="140" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="30" y="0" width="140" height="40" fill="#7f1d1d" opacity="0.9" />
          <rect x="30" y="540" width="140" height="40" fill="#a16207" opacity="0.9" />
          <rect x="30" y="0" width="140" height="580" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
        </>
      )}
      
      {/* Yard lines */}
      {yardLines.map((line, i) => {
        const coords = isHoriz 
          ? { x1: line.pos, y1: 30, x2: line.pos, y2: 170, tx1: line.pos - 4, ty1: 42, tx2: line.pos - 4, ty2: 158 }
          : { x1: 30, y1: line.pos, x2: 170, y2: line.pos, tx1: 42, ty1: line.pos + 4, tx2: 158, ty2: line.pos + 4 };
        
        return (
          <React.Fragment key={i}>
            <line x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2} stroke="white" strokeWidth="1" opacity="0.6" />
            <text x={coords.tx1} y={coords.ty1} fill="white" fontSize="9" fontWeight="900" textAnchor="middle" opacity="0.5" className={`font-mono select-none ${isHoriz ? 'rotate-90' : 'rotate-180'}`}>{line.label}</text>
            <text x={coords.tx2} y={coords.ty2} fill="white" fontSize="9" fontWeight="900" textAnchor="middle" opacity="0.5" className={`font-mono select-none ${isHoriz ? 'rotate-90' : ''}`}>{line.label}</text>
          </React.Fragment>
        );
      })}

      {/* Players */}
      {offenseKC.map((p) => {
        const dPos = dynamicPositions[p.id] || { x: 0, y: 0 };
        const { cx, cy } = mapPos(p.x + dPos.x, p.y + dPos.y);
        const isSelected = p.id === selectedPlayerId;
        return (
          <g key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer group/player transition-all duration-1000 ease-linear">
            {isSelected && <circle cx={cx} cy={cy} r="8" fill="rgba(255,255,255,0.15)" />}
            <circle cx={cx} cy={cy} r="5.5" fill={isSelected ? "#fff" : "#ef4444"} stroke="white" strokeWidth={isSelected ? "2" : "1"} />
            <text x={cx} y={cy + 1.5} fill={isSelected ? "#000" : "#fff"} fontSize="3.5" fontWeight="bold" textAnchor="middle" className="select-none pointer-events-none">{p.label}</text>
          </g>
        );
      })}
      {defenseSF.map((p) => {
        const dPos = dynamicPositions[p.id] || { x: 0, y: 0 };
        const { cx, cy } = mapPos(p.x + dPos.x, p.y + dPos.y);
        const isSelected = p.id === selectedPlayerId;
        return (
          <g key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer group/player transition-all duration-1000 ease-linear">
             {isSelected && <circle cx={cx} cy={cy} r="8" fill="rgba(255,255,255,0.15)" />}
             <circle cx={cx} cy={cy} r="5.5" fill={isSelected ? "#fff" : "#facc15"} stroke="#451a03" strokeWidth={isSelected ? "2" : "1"} />
             <text x={cx} y={cy + 1.5} fill="#451a03" fontSize="3.5" fontWeight="bold" textAnchor="middle" className="select-none pointer-events-none">{p.label}</text>
          </g>
        );
      })}

      {/* Football Icon - High Fidelity Gray American Football */}
      {isSimulating && (
        <g className="transition-all duration-500 ease-out">
           <ellipse 
             cx={mapPos(100 + ballPos.x, ballPos.y).cx} 
             cy={mapPos(100 + ballPos.x, ballPos.y).cy} 
             rx="3.8" ry="2.4" 
             fill="url(#ball-gradient)" 
             stroke="#222" 
             strokeWidth="0.4" 
             className={isHoriz ? '' : 'rotate-90'}
             style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
           />
           {/* Laces */}
           <line 
             x1={mapPos(100 + ballPos.x, ballPos.y).cx - 1.5} 
             y1={mapPos(100 + ballPos.x, ballPos.y).cy} 
             x2={mapPos(100 + ballPos.x, ballPos.y).cx + 1.5} 
             y2={mapPos(100 + ballPos.x, ballPos.y).cy} 
             stroke="white" strokeWidth="0.4" strokeLinecap="round" opacity="0.9"
           />
           {[ -1.2, -0.4, 0.4, 1.2 ].map((off, i) => (
             <line 
               key={i}
               x1={mapPos(100 + ballPos.x, ballPos.y).cx + off} 
               y1={mapPos(100 + ballPos.x, ballPos.y).cy - 0.6} 
               x2={mapPos(100 + ballPos.x, ballPos.y).cx + off} 
               y2={mapPos(100 + ballPos.x, ballPos.y).cy + 0.6} 
               stroke="white" strokeWidth="0.2" opacity="0.8"
             />
           ))}
        </g>
      )}
    </g>
  </svg>
  );
};

export const MatchOverview: React.FC<MatchOverviewProps> = ({
  gameState,
  selectedPlayerId,
  onPlayerSelect,
  isSimulating,
  simCountdown,
  dynamicPositions,
  ballPos,
  onStartSimulation,
  onStopSimulation,
  onLoadPreviousSimulation,
  isLiveMode,
  onLiveModeChange,
  liveStream,
  onLiveStreamChange,
  onLiveAnalysis,
  onRestartMatch,
  isLoadingMatch,
  currentMatch,
  isExpanded,
  onToggleExpand,
  activeView,
  onViewChange
}) => {
  const [mode, setMode] = useState<'offense' | 'defense' | 'live'>('offense');
  // Local expanded state removed in favor of prop from App.tsx
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamAvailable, setStreamAvailable] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopAnalysisRef = useRef<(() => void) | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live Commentary hook
  const {
    status: commentaryStatus,
    isActive: isCommentaryActive,
    isSpeaking,
    startFromStream: startCommentaryFromStream,
    stopCommentary,
  } = useLiveCommentary();

  const toggleExpand = () => onToggleExpand?.();

  const mins = Math.floor(simCountdown / 60);
  const secs = simCountdown % 60;
  const timerStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Check streaming capabilities on mount
  useEffect(() => {
    const checkCaps = async () => {
      const caps = await getStreamCapabilities();
      setStreamAvailable(caps?.vision_agents_available && caps?.stream_configured || false);
    };
    checkCaps();
  }, []);

  // Update video element when stream changes and start analysis
  useEffect(() => {
    if (videoRef.current && liveStream) {
      videoRef.current.srcObject = liveStream;

      // Start frame analysis after video is playing
      const startAnalysis = () => {
        if (videoRef.current && !stopAnalysisRef.current) {
          setIsAnalyzing(true);
          stopAnalysisRef.current = startFrameAnalysis(
            videoRef.current,
            (events) => {
              events.forEach(event => onLiveAnalysis(event));
            },
            3000 // Analyze every 3 seconds
          );
        }
      };

      videoRef.current.onplaying = startAnalysis;

      // If already playing, start immediately
      if (!videoRef.current.paused) {
        startAnalysis();
      }
    }

    return () => {
      // Stop analysis when stream changes
      if (stopAnalysisRef.current) {
        stopAnalysisRef.current();
        stopAnalysisRef.current = null;
        setIsAnalyzing(false);
      }
    };
  }, [liveStream, mode, onLiveAnalysis]);

  // Sync mode with isLiveMode
  useEffect(() => {
    if (mode === 'live' && !isLiveMode) {
      onLiveModeChange(true);
    } else if (mode !== 'live' && isLiveMode) {
      onLiveModeChange(false);
    }
  }, [mode, isLiveMode, onLiveModeChange]);

  const handleStartCamera = useCallback(async () => {
    setStreamLoading(true);
    setStreamError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      onLiveStreamChange(mediaStream);

      // Create session on backend
      const session = await createStreamSession();
      if (!session || session.status === 'error') {
        throw new Error(session?.error || 'Failed to create session');
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Failed to start camera');
    } finally {
      setStreamLoading(false);
    }
  }, [onLiveStreamChange]);

  const handleStartScreen = useCallback(async () => {
    setStreamLoading(true);
    setStreamError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      onLiveStreamChange(mediaStream);

      // Create session on backend
      const session = await createStreamSession();
      if (!session || session.status === 'error') {
        throw new Error(session?.error || 'Failed to create session');
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Failed to start screen capture');
    } finally {
      setStreamLoading(false);
    }
  }, [onLiveStreamChange]);

  const handleStopStream = useCallback(async () => {
    // Stop frame analysis
    if (stopAnalysisRef.current) {
      stopAnalysisRef.current();
      stopAnalysisRef.current = null;
      setIsAnalyzing(false);
    }

    if (liveStream) {
      liveStream.getTracks().forEach(track => track.stop());
      onLiveStreamChange(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [liveStream, onLiveStreamChange]);

  const handleCaptureFrame = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setCaptureSuccess(false);

    try {
      // Capture and analyze the current frame
      const result = await captureAndAnalyzeFrame(videoRef.current);

      if (result.success && result.analysis && result.analysis.length > 0) {
        // Mark events as manual captures so they bypass significance filter in Statistics
        const manualCaptureEvents = result.analysis.map(event => ({
          ...event,
          isManualCapture: true  // Flag to identify manual captures
        }));

        // Emit captured events
        manualCaptureEvents.forEach(event => {
          onLiveAnalysis(event as AnalysisEvent);
        });

        // Show success indicator
        setCaptureSuccess(true);

        // Clear success indicator after 2 seconds
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
        }
        captureTimeoutRef.current = setTimeout(() => {
          setCaptureSuccess(false);
        }, 2000);

        console.log(`Captured and analyzed frame at ${result.timestamp} with ${result.analysis.length} events`);
      } else {
        console.error('Frame capture failed or no events detected:', result.error);
        setCaptureSuccess(false);
      }
    } catch (error) {
      console.error('Error during frame capture:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onLiveAnalysis]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col h-full bg-black transition-all duration-500 ${isExpanded ? 'p-0' : ''}`}>
      {!isExpanded && (
        <>
          <div className="flex gap-1 items-center mb-6 bg-[#111] p-1 rounded-full w-fit">
            <button 
              onClick={() => onViewChange('analytics')}
              className={`${activeView === 'analytics' ? 'bg-[#1e1e1e] text-white' : 'text-[#4d4d4d]'} px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all`}
            >
              Live Dynamics
            </button>
            <button 
              onClick={() => onViewChange('feed')}
              className={`${activeView === 'feed' ? 'bg-[#1e1e1e] text-white' : 'text-[#4d4d4d]'} px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:text-white transition-all`}
            >
              Tactics
            </button>
            <button 
              onClick={() => onViewChange('deep-research')}
              className={`${activeView === 'deep-research' ? 'bg-[#1e1e1e] text-white' : 'text-[#4d4d4d]'} px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:text-white transition-all flex items-center gap-1.5`}
            >
              <Brain size={12} className={activeView === 'deep-research' ? 'text-blue-400' : ''} />
              Deep Research
            </button>
            <button 
              onClick={() => onViewChange('highlights')}
              className={`${activeView === 'highlights' ? 'bg-[#1e1e1e] text-white' : 'text-[#4d4d4d]'} px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:text-white transition-all`}
            >
              Media
            </button>
          </div>

          {activeView !== 'deep-research' && (
            <div className="flex items-center justify-between mb-4 pr-1">
              <div className="flex flex-col">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Field Strategy</h1>
                <p className="text-[#4d4d4d] text-[9px] font-bold uppercase tracking-[0.4em] mt-1.5">LIX Integrated Feed</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-[#111] p-0.5 rounded-full border border-white/5">
                  <button
                    onClick={() => setMode('offense')}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${mode === 'offense' ? 'bg-[#ffe566] text-black shadow-lg shadow-yellow-500/10' : 'text-[#4d4d4d]'}`}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => setMode('defense')}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${mode === 'defense' ? 'bg-[#ef4444] text-white shadow-lg shadow-red-500/10' : 'text-[#4d4d4d]'}`}
                  >
                    DEF
                  </button>
                  <button
                    onClick={() => setMode('live')}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all flex items-center gap-1 ${mode === 'live' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-[#4d4d4d]'}`}
                  >
                    <Radio size={8} className={mode === 'live' ? 'animate-pulse' : ''} />
                    LIVE
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`relative flex-1 bg-[#0d0d0d] rounded-[48px] border border-white/5 p-4 flex flex-col overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]`}>
        {/* Simulation Banner Overlay */}
        {isSimulating && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-[#ffe566] text-black px-6 py-2 rounded-full font-black text-xs uppercase italic tracking-tighter shadow-2xl flex items-center gap-3 border border-black/10">
             <Timer size={14} className="animate-pulse" />
             FULL MATCH SIMULATION: {timerStr}
          </div>
        )}

        {isExpanded && (
           <div className="flex justify-between items-center mb-8 px-4">
              <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Tactical Wide-Angle</h2>
              <div className="flex items-center gap-4">
                 <button onClick={toggleExpand} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white">
                    <Minimize2 size={24} />
                 </button>
              </div>
           </div>
        )}

        <div className="flex-1 min-h-0 w-full relative group">
          {activeView === 'deep-research' ? (
            <DeepResearch gameState={gameState} />
          ) : mode === 'live' ? (
            /* Live Video Stream View */
            <div className="w-full h-full flex flex-col items-center justify-center">
              {liveStream ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-[10px] font-black uppercase">Live</span>
                    </div>
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                        <span className="text-white text-[10px] font-black uppercase">Analyzing</span>
                      </div>
                    )}
                    {isCommentaryActive && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        isSpeaking
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-amber-500/80'
                      }`}>
                        {isSpeaking ? (
                          <>
                            <Waves className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-white text-[10px] font-black uppercase">Speaking</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3 h-3 text-white" />
                            <span className="text-white text-[10px] font-black uppercase">AI Ready</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {/* Frame Capture Button */}
                    <button
                      onClick={handleCaptureFrame}
                      disabled={isCapturing || !liveStream}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all shadow-xl ${
                        captureSuccess
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                      title="Capture current frame and analyze"
                    >
                      {isCapturing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span className="hidden sm:inline">Capturing...</span>
                        </>
                      ) : captureSuccess ? (
                        <>
                          <Zap size={16} />
                          <span className="hidden sm:inline">Captured!</span>
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          <span className="hidden sm:inline">Capture</span>
                        </>
                      )}
                    </button>

                    {/* Live Commentary Toggle */}
                    <button
                      onClick={async () => {
                        if (isCommentaryActive) {
                          await stopCommentary();
                        } else if (liveStream) {
                          await startCommentaryFromStream(liveStream);
                        }
                      }}
                      disabled={commentaryStatus === 'connecting'}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all shadow-xl ${
                        isCommentaryActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
                      }`}
                      title={isCommentaryActive ? 'Stop Commentary' : 'Start Live Commentary'}
                    >
                      {commentaryStatus === 'connecting' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isCommentaryActive ? (
                        <>
                          {isSpeaking ? (
                            <Waves size={16} className="animate-pulse" />
                          ) : (
                            <MicOff size={16} />
                          )}
                          <span className="hidden sm:inline">Stop AI</span>
                        </>
                      ) : (
                        <>
                          <Mic size={16} />
                          <span className="hidden sm:inline">AI Commentary</span>
                        </>
                      )}
                    </button>
                    {isExpanded && (
                      <button
                        onClick={onToggleExpand}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-xl hidden"
                        title="Collapse"
                      >
                        <Minimize2 size={18} />
                      </button>
                    )}
                    {!isExpanded && (
                      <button
                        onClick={onToggleExpand}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-xl"
                        title="Expand"
                      >
                        <Maximize2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={handleStopStream}
                      className="p-3 bg-red-500 hover:bg-red-600 rounded-2xl text-white transition-all shadow-xl"
                      title="Stop Stream"
                    >
                      <StopCircle size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-6 p-8 relative w-full h-full">
                  {/* Expand/Collapse button for initial state */}
                  {isExpanded ? (
                    <button
                      onClick={onToggleExpand}
                      className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all hidden"
                    >
                      <Minimize2 size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={onToggleExpand}
                      className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all"
                    >
                      <Maximize2 size={18} />
                    </button>
                  )}
                  {streamLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-green-500" size={32} />
                      <p className="text-white/60 text-xs">Connecting to stream...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-2">
                        <Radio className="text-green-500 mx-auto mb-3" size={32} />
                        <p className="text-white/80 text-sm font-bold">Start Live Analysis</p>
                        <p className="text-white/40 text-[10px] mt-1">Share your screen or camera to analyze a match</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleStartCamera}
                          disabled={!streamAvailable}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/30 text-white font-bold py-3 px-5 rounded-xl transition-colors text-xs"
                        >
                          <Camera size={16} />
                          Camera
                        </button>
                        <button
                          onClick={handleStartScreen}
                          disabled={!streamAvailable}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white font-bold py-3 px-5 rounded-xl transition-colors text-xs"
                        >
                          <Monitor size={16} />
                          Screen
                        </button>
                      </div>
                      {streamError && (
                        <p className="text-red-400 text-[10px] mt-2">{streamError}</p>
                      )}
                      {!streamAvailable && (
                        <p className="text-amber-400 text-[10px] mt-2">WebRTC streaming not configured on backend</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Field SVG View */
            <>
              <FieldSVG
                mode={mode}
                orientation={isExpanded ? 'horizontal' : 'vertical'}
                selectedPlayerId={selectedPlayerId}
                onPlayerSelect={onPlayerSelect}
                isSimulating={isSimulating}
                dynamicPositions={dynamicPositions}
                ballPos={ballPos}
              />

              {isExpanded ? (
                <button
                  onClick={onToggleExpand}
                  className="absolute bottom-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all shadow-xl hidden"
                >
                  <Minimize2 size={18} />
                </button>
              ) : (
                <button
                  onClick={onToggleExpand}
                  className="absolute bottom-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                >
                  <Maximize2 size={18} />
                </button>
              )}
            </>
          )}

          <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>
        </div>

        {!isExpanded && activeView !== 'deep-research' && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
            {/* Session Info & Restart */}
            {currentMatch && (
              <div className="flex items-center justify-between px-1 py-2 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-white/60 font-medium">
                    Session: {currentMatch.id.slice(0, 8)}...
                  </span>
                  <span className="text-[8px] text-white/40">
                    ({currentMatch.event_count} events)
                  </span>
                </div>
                <button
                  onClick={onRestartMatch}
                  disabled={isLoadingMatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-[9px] font-bold uppercase transition-all disabled:opacity-50"
                >
                  {isLoadingMatch ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <RotateCcw size={10} />
                  )}
                  Restart Match
                </button>
              </div>
            )}

            {/* Simulation Trigger */}
            <div className="flex gap-2 flex-col">
              <div className="flex gap-2">
                <button
                  onClick={onStartSimulation}
                  disabled={isSimulating}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Play size={12} fill="currentColor" />
                  {isSimulating ? 'MATCH IN PROGRESS...' : 'START 15-MIN FULL MATCH SIMULATION'}
                </button>
                {isSimulating && onStopSimulation && (
                  <button
                    onClick={onStopSimulation}
                    className="px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500/30 active:scale-95 transition-all"
                    title="Stop simulation immediately"
                  >
                    <StopCircle size={12} />
                    Stop
                  </button>
                )}
              </div>
              {onLoadPreviousSimulation && (
                <button
                  onClick={onLoadPreviousSimulation}
                  disabled={isSimulating}
                  className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-2xl text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
                  title="Load and replay previous simulation"
                >
                  <Zap size={11} />
                  Load Previous Simulation
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center py-2.5 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-[#ffe566] text-sm font-black italic tabular-nums">84%</span>
                <span className="text-[#4d4d4d] text-[6px] font-black uppercase tracking-tighter">SUCCESS</span>
              </div>
              <div className="flex flex-col items-center py-2.5 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-white text-sm font-black italic tabular-nums">12.4</span>
                <span className="text-[#4d4d4d] text-[6px] font-black uppercase tracking-tighter">YDS/P</span>
              </div>
              <div className="flex flex-col items-center py-2.5 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-[#ffe566] text-sm font-black tabular-nums">{gameState.clock}</span>
                <span className="text-[#4d4d4d] text-[6px] font-black uppercase tracking-tighter">CLOCK</span>
              </div>
              <div className="flex flex-col items-center py-2.5 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-white text-sm font-black tabular-nums">{gameState.score.home}-{gameState.score.away}</span>
                <span className="text-[#4d4d4d] text-[6px] font-black uppercase tracking-tighter">SCORE</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 pb-1">
              <div className="flex flex-col">
                  <p className="text-[#4d4d4d] text-[8px] font-black uppercase tracking-widest mb-0.5">Down & Position</p>
                  <div className="text-xl font-black text-white italic tracking-tighter">
                    {gameState.down}<span className="text-[10px] text-[#4d4d4d] mx-0.5 uppercase not-italic">rd</span> & {gameState.distance}
                  </div>
              </div>
              <div className="flex flex-col items-end">
                  <p className="text-[#4d4d4d] text-[8px] font-black uppercase tracking-widest mb-0.5">Field Position</p>
                  <div className="text-xl font-black text-white italic tracking-tighter">
                    <span className="text-amber-500/60 text-xs mr-1 not-italic">{gameState.possession}</span>
                    42
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
