
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, Music, Shield, Activity, Radio, Video, BarChart3, Target, Zap, Clock, RefreshCw, AlertTriangle, Crosshair, Gauge, Users, Brain, Camera, Image, Loader2, Maximize2, Minimize2, Mic, Waves } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Player, GameState, ViewTab, HighlightCapture } from '../types';
import { AnalysisEvent } from '../services/stream';
import { NFL_TEAMS, getTeam, findTeam } from '../config/nflTeams';
import { generateSportImage } from '../services/gemini';
import { FastAnalytics, DeepAnalytics } from '../services/analyticsTypes';
import { LiveCommentaryPanel } from './LiveCommentaryPanel';
// TeamSelector moved to Sidebar

// Using NFL_TEAMS from config/nflTeams.ts for dynamic team colors

// Captured highlight shot with AI image support
// Interface moved to types.ts

interface StatisticsProps {
  improveImage: string | null;
  loading: boolean;
  gameState: GameState;
  isLiveMode?: boolean;
  liveAnalysis?: AnalysisEvent[];
  liveStream?: MediaStream | null;
  onCaptureHighlight?: (capture: HighlightCapture) => void;
  onUpdateHighlight?: (highlightId: string, updates: { aiImageUrl?: string; aiImageLoading?: boolean }) => void;
  flashAnalytics?: FastAnalytics | null;
  deepAnalytics?: DeepAnalytics | null;
  activeView: ViewTab;
  onViewChange: (view: ViewTab) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Comprehensive football analytics metrics
interface FootballMetrics {
  // Core Metrics
  epa: number;                    // Expected Points Added
  wpa: number;                    // Win Probability Added
  totalEvents: number;
  avgConfidence: number;

  // Turnover Analysis
  turnoversForced: number;
  turnoversLost: number;
  turnoverDifferential: number;

  // Red Zone Efficiency
  redZoneAttempts: number;
  redZoneTDs: number;
  redZoneEfficiency: number;

  // Time & Possession
  possessionTime: number;         // In seconds
  possessionPercentage: number;

  // Third Down
  thirdDownAttempts: number;
  thirdDownConversions: number;
  thirdDownRate: number;

  // Explosive Plays
  explosiveRuns: number;          // 12+ yards
  explosivePasses: number;        // 20+ yards
  totalExplosivePlays: number;

  // Play Distribution
  playTypes: { run: number; pass: number; special: number };

  // Formations & Tendencies
  formations: string[];
  formationFrequency: { name: string; count: number }[];

  // Player Tracking (Next Gen Stats style)
  avgPlayerSpeed: number;
  maxPlayerSpeed: number;
  routeEfficiency: number;

  // Opponent Prediction
  predictedNextPlay: string;
  blitzProbability: number;

  // Trend Data
  epaTrend: { val: number }[];
  wpaTrend: { val: number }[];
  confidenceTrend: { val: number }[];
}

export const Statistics: React.FC<StatisticsProps> = ({ 
  improveImage, 
  loading, 
  gameState, 
  isLiveMode = false, 
  liveAnalysis = [], 
  liveStream, 
  onCaptureHighlight, 
  onUpdateHighlight,
  flashAnalytics,
  deepAnalytics,
  activeView,
  onViewChange,
  isExpanded,
  onToggleExpand
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [highlightCaptures, setHighlightCaptures] = useState<HighlightCapture[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Track captured event timestamps to prevent duplicates
  const capturedEventsRef = useRef<Set<string>>(new Set());

  // Extract latest game info from live analysis (from video frames)
  const latestGameInfo = useMemo(() => {
    // Find the most recent event with game info
    for (const event of liveAnalysis) {
      if (event.gameInfo) {
        return event.gameInfo;
      }
    }
    return null;
  }, [liveAnalysis]);

  // Merge live game info with gameState (prefer live data from video)
  const liveScore = useMemo(() => ({
    homeTeam: latestGameInfo?.homeTeam || gameState.homeTeam || 'KC',
    awayTeam: latestGameInfo?.awayTeam || gameState.awayTeam || 'PHI',
    homeScore: latestGameInfo?.homeScore ?? gameState.score.home,
    awayScore: latestGameInfo?.awayScore ?? gameState.score.away,
    quarter: latestGameInfo?.quarter ?? gameState.quarter,
    gameTime: latestGameInfo?.gameTime || gameState.clock,
    down: latestGameInfo?.down ?? gameState.down,
    distance: latestGameInfo?.distance ?? gameState.distance,
    possession: latestGameInfo?.possession || gameState.possession,
    yardLine: latestGameInfo?.yardLine,
  }), [latestGameInfo, gameState]);

  // Get team configs based on live data (dynamic team detection)
  const homeTeam = getTeam(liveScore.homeTeam, 'KC');
  const awayTeam = getTeam(liveScore.awayTeam, 'PHI');

  // Attach live stream to video element
  useEffect(() => {
    if (videoRef.current && liveStream) {
      videoRef.current.srcObject = liveStream;
    }
  }, [liveStream, activeView]);

  // Auto-capture highlights when significant events detected
  useEffect(() => {
    if (!isLiveMode || liveAnalysis.length === 0) return;

    const latestEvent = liveAnalysis[0];

    // Create unique key for this event to prevent duplicates
    const eventKey = `${latestEvent.timestamp}-${latestEvent.event}-${latestEvent.details.substring(0, 50)}`;

    // Skip if already captured this event
    if (capturedEventsRef.current.has(eventKey)) {
      return;
    }

    const eventLower = latestEvent.event.toLowerCase();
    const detailsLower = latestEvent.details.toLowerCase();

    // Key events that should trigger highlight capture
    const significantEvents = [
      'touchdown', 'td', 'score',
      'interception', 'pick', 'int',
      'fumble', 'turnover',
      'sack',
      'big play', 'explosive',
      'field goal', 'fg',
      'safety'
    ];

    const isSignificant = significantEvents.some(e =>
      eventLower.includes(e) || detailsLower.includes(e)
    );

    // Only capture scoring plays or truly significant events
    const isScoring = latestEvent.isScoring || detailsLower.includes('touchdown') || detailsLower.includes('field goal');

    if ((isSignificant || isScoring) && !isCapturing) {
      // Mark as captured before triggering
      capturedEventsRef.current.add(eventKey);

      // Limit stored keys to prevent memory growth
      if (capturedEventsRef.current.size > 100) {
        const keysArray = Array.from(capturedEventsRef.current);
        capturedEventsRef.current = new Set(keysArray.slice(-50));
      }

      captureHighlight(latestEvent);
    }
  }, [liveAnalysis, isLiveMode, isCapturing]);

  // Extract player name from event details
  const extractPlayerName = (details: string): string | undefined => {
    // Common NFL player name patterns
    const patterns = [
      /([A-Z]\.\s*[A-Z][a-z]+)/,           // P. Mahomes, T. Kelce
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/,       // Patrick Mahomes
      /\b(QB|RB|WR|TE|K)\s+([A-Z][a-z]+)/, // QB Mahomes
      /#\d+\s+([A-Z][a-z]+)/,              // #15 Mahomes
    ];

    for (const pattern of patterns) {
      const match = details.match(pattern);
      if (match) {
        return match[1] || match[2];
      }
    }
    return undefined;
  };

  // NFL team jersey color descriptions for AI image generation
  const getTeamJerseyDescription = (teamAbbrev: string): string => {
    const jerseyColors: Record<string, string> = {
      PHI: "midnight green jerseys with silver pants, Eagles",
      KC: "red jerseys with gold trim and white pants, Chiefs",
      SF: "red and gold jerseys, 49ers",
      DAL: "silver and blue jerseys with star helmets, Cowboys",
      GB: "green and gold jerseys, Packers",
      BUF: "royal blue jerseys with red accents, Bills",
      BAL: "purple jerseys with black and gold, Ravens",
      DET: "honolulu blue jerseys with silver, Lions",
      MIA: "aqua and orange jerseys, Dolphins",
      NE: "navy blue jerseys with red and silver, Patriots",
      NYG: "blue jerseys with red accents, Giants",
      PIT: "black and gold jerseys, Steelers",
      DEN: "orange jerseys with blue accents, Broncos",
      SEA: "navy blue jerseys with neon green, Seahawks",
      LA: "blue and yellow jerseys, Rams",
      TB: "red and pewter jerseys, Buccaneers",
      NO: "black and gold jerseys, Saints",
      ATL: "red and black jerseys, Falcons",
      MIN: "purple jerseys with gold trim, Vikings",
      CIN: "orange and black striped jerseys, Bengals",
    };
    return jerseyColors[teamAbbrev] || "NFL team jerseys";
  };

  // Extract team names from event details
  const extractTeamsFromDetails = (details: string): { offense?: string; defense?: string } => {
    const teamPatterns: Record<string, string[]> = {
      PHI: ['philadelphia', 'eagles', 'phi'],
      KC: ['kansas city', 'chiefs', 'kc'],
      SF: ['san francisco', '49ers', 'sf', 'niners'],
      DAL: ['dallas', 'cowboys'],
      GB: ['green bay', 'packers'],
      BUF: ['buffalo', 'bills'],
      BAL: ['baltimore', 'ravens'],
      DET: ['detroit', 'lions'],
    };

    const detailsLower = details.toLowerCase();
    const foundTeams: string[] = [];

    for (const [abbrev, patterns] of Object.entries(teamPatterns)) {
      for (const pattern of patterns) {
        if (detailsLower.includes(pattern)) {
          foundTeams.push(abbrev);
          break;
        }
      }
    }

    // Use gameState teams as fallback
    if (foundTeams.length === 0) {
      return { offense: gameState.homeTeam, defense: gameState.awayTeam };
    }

    return { offense: foundTeams[0], defense: foundTeams[1] || gameState.awayTeam };
  };

  // Extract player name and number from details
  const extractPlayerInfo = (details: string): string => {
    // Match patterns like "Jalen Hurts (#1)", "P. Mahomes", "#15 Mahomes"
    const patterns = [
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\(#(\d+)\)/,  // "Jalen Hurts (#1)"
      /([A-Z]\.\s*[A-Z][a-z]+)/,                    // "P. Mahomes"
      /#(\d+)\s+([A-Z][a-z]+)/,                     // "#15 Mahomes"
      /\*\*([^*]+)\*\*/,                            // Bold text like **Player Name**
    ];

    for (const pattern of patterns) {
      const match = details.match(pattern);
      if (match) {
        return match[1] || match[2] || match[0];
      }
    }
    return "";
  };

  // Build a highlight-specific prompt for AI image generation with full context
  const buildHighlightPrompt = (event: AnalysisEvent): string => {
    const action = event.event.toLowerCase();
    const details = event.details;
    const detailsLower = details.toLowerCase();

    // Extract teams and player info
    const teams = extractTeamsFromDetails(details);
    const offenseJersey = getTeamJerseyDescription(teams.offense || gameState.homeTeam);
    const defenseJersey = getTeamJerseyDescription(teams.defense || gameState.awayTeam);
    const playerInfo = extractPlayerInfo(details);

    // Determine the camera angle and composition
    let cameraAngle = "broadcast camera angle, slightly elevated view";
    let composition = "action in center frame";

    // Build action-specific description
    let actionDescription = "";
    let playerAction = "";

    if (action.includes('touchdown') || detailsLower.includes('touchdown')) {
      actionDescription = "touchdown celebration in the end zone";
      playerAction = "player raising arms in victory, teammates rushing to celebrate";
      cameraAngle = "end zone camera angle, dramatic low angle looking up";
      composition = "player silhouette against stadium lights";
    } else if (action.includes('interception') || detailsLower.includes('interception')) {
      actionDescription = "dramatic interception catch";
      playerAction = "defensive player leaping to catch the ball mid-air, arms fully extended";
      cameraAngle = "sideline camera angle, capturing the athletic leap";
    } else if (action.includes('sack') || detailsLower.includes('sack')) {
      actionDescription = "quarterback being sacked";
      playerAction = "defensive player tackling quarterback from behind, moment of impact";
      cameraAngle = "behind the line of scrimmage, action shot";
    } else if (action.includes('fumble') || detailsLower.includes('fumble')) {
      actionDescription = "fumble recovery scramble";
      playerAction = "multiple players diving for loose football on the ground";
      cameraAngle = "ground level camera, chaos and intensity";
    } else if (action.includes('pass') || action.includes('completion') || detailsLower.includes('pass')) {
      actionDescription = "pass completion";
      playerAction = "receiver catching football with defender nearby, ball in hands";
      cameraAngle = "sideline angle, tracking the catch";
    } else if (action.includes('run') || action.includes('rush') || detailsLower.includes('run')) {
      actionDescription = "explosive running play";
      playerAction = "running back bursting through defensive line, stiff-arming defender";
      cameraAngle = "behind the play, showing the hole and runners path";
    } else if (detailsLower.includes('formation') || detailsLower.includes('shotgun') || detailsLower.includes('i-form')) {
      actionDescription = "pre-snap formation";
      playerAction = "quarterback calling the play at the line, offense set";
      cameraAngle = "all-22 camera angle, showing full formation";
      composition = "wide shot showing both teams lined up";
    } else {
      actionDescription = "intense football action";
      playerAction = "players engaged in physical play";
    }

    // Extract formation if mentioned
    let formationContext = "";
    if (detailsLower.includes('shotgun')) {
      formationContext = "quarterback in shotgun formation";
    } else if (detailsLower.includes('i-form') || detailsLower.includes('i form')) {
      formationContext = "I-formation with fullback leading";
    } else if (detailsLower.includes('spread')) {
      formationContext = "spread formation with receivers split wide";
    }

    // Extract yard line context
    let fieldPosition = "";
    const yardMatch = details.match(/(\d+)-yard line/i);
    if (yardMatch) {
      fieldPosition = `near the ${yardMatch[1]}-yard line`;
    }
    if (detailsLower.includes('red zone') || detailsLower.includes('goal line')) {
      fieldPosition = "in the red zone near the goal line";
    }

    // Get live game state for context - prefer event gameInfo, fallback to liveScore
    const gameInfo = event.gameInfo;
    const liveHomeTeam = gameInfo?.homeTeam || liveScore.homeTeam;
    const liveAwayTeam = gameInfo?.awayTeam || liveScore.awayTeam;
    const liveHomeScore = gameInfo?.homeScore ?? liveScore.homeScore;
    const liveAwayScore = gameInfo?.awayScore ?? liveScore.awayScore;
    const liveQuarter = gameInfo?.quarter ?? liveScore.quarter;
    const liveGameTime = gameInfo?.gameTime || liveScore.gameTime;
    const liveDown = gameInfo?.down ?? liveScore.down;
    const liveDistance = gameInfo?.distance ?? liveScore.distance;

    // Build game situation context
    let gameSituation = "";
    if (liveQuarter && liveGameTime) {
      const quarterText = liveQuarter === 5 ? "OT" : `Q${liveQuarter}`;
      gameSituation = `${quarterText} ${liveGameTime}, Score: ${liveHomeTeam} ${liveHomeScore} - ${liveAwayTeam} ${liveAwayScore}`;
    }

    let downContext = "";
    if (liveDown && liveDistance) {
      downContext = `${liveDown}${liveDown === 1 ? 'st' : liveDown === 2 ? 'nd' : liveDown === 3 ? 'rd' : 'th'} & ${liveDistance}`;
    }

    // Build the complete prompt with game context
    const prompt = `Photorealistic NFL game action photograph, Super Bowl LIX atmosphere:

GAME SITUATION: ${gameSituation}
${downContext ? `DOWN & DISTANCE: ${downContext}` : ""}

SCENE: ${actionDescription} ${fieldPosition}
ACTION: ${playerAction}
${playerInfo ? `FEATURED PLAYER: ${playerInfo}` : ""}

TEAMS PLAYING:
- ${liveHomeTeam} (Home): ${getTeamJerseyDescription(liveHomeTeam)}
- ${liveAwayTeam} (Away): ${getTeamJerseyDescription(liveAwayTeam)}

TEAM JERSEYS IN FRAME:
- Offense: Players wearing ${offenseJersey}
- Defense: Players wearing ${defenseJersey}

${formationContext ? `FORMATION: ${formationContext}` : ""}

VISUAL STYLE:
- ${cameraAngle}
- ${composition}
- Packed stadium with 70,000+ fans in background
- Dramatic stadium lighting with slight lens flare
- Sharp focus on main action, slight motion blur on movement
- Vibrant team colors clearly visible
- Green grass field with white yard markers
- Professional sports photography quality
- ESPN/NFL broadcast quality image

MOOD: High-intensity championship game moment, electric atmosphere`;

    return prompt;
  };

  // Capture current frame as highlight with AI image generation
  const captureHighlight = async (event: AnalysisEvent) => {
    if (!videoRef.current || isCapturing) return;

    const video = videoRef.current;

    // Check if video has valid dimensions (not 0x0)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // If video isn't ready or has no dimensions, skip frame capture but still generate AI image
    const hasValidVideo = videoWidth > 0 && videoHeight > 0 && video.readyState >= 2;

    setIsCapturing(true);
    try {
      let imageUrl = '';

      if (hasValidVideo) {
        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      // If no valid frame, use a placeholder or just rely on AI image
      if (!imageUrl) {
        // Create a simple placeholder gradient image
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#1a1a2e');
          gradient.addColorStop(1, '#16213e');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Generating AI Image...', canvas.width / 2, canvas.height / 2);
          imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      // Try to extract player name from event details
      const playerName = extractPlayerName(event.details);

      const captureId = `highlight-${Date.now()}`;
      const capture: HighlightCapture = {
        id: captureId,
        timestamp: event.timestamp,
        imageUrl,
        aiImageLoading: true,
        description: event.details,
        event: event.event,
        confidence: event.confidence,
        playerName,
      };

      // Add capture with frame image immediately
      setHighlightCaptures(prev => [capture, ...prev].slice(0, 10));
      onCaptureHighlight?.(capture);

      // Generate AI image asynchronously
      const prompt = buildHighlightPrompt(event);
      generateSportImage(prompt).then(aiImage => {
        if (aiImage) {
          // Update the local capture with AI-generated image
          setHighlightCaptures(prev => prev.map(c =>
            c.id === captureId
              ? { ...c, aiImageUrl: aiImage, aiImageLoading: false }
              : c
          ));
          // Update parent state so CombinedStatus gets the AI image
          onUpdateHighlight?.(captureId, { aiImageUrl: aiImage, aiImageLoading: false });
        } else {
          // Mark loading as complete even if generation failed
          setHighlightCaptures(prev => prev.map(c =>
            c.id === captureId
              ? { ...c, aiImageLoading: false }
              : c
          ));
          onUpdateHighlight?.(captureId, { aiImageLoading: false });
        }
      }).catch(() => {
        // Mark loading as complete on error
        setHighlightCaptures(prev => prev.map(c =>
          c.id === captureId
            ? { ...c, aiImageLoading: false }
            : c
        ));
        onUpdateHighlight?.(captureId, { aiImageLoading: false });
      });
    } finally {
      setTimeout(() => setIsCapturing(false), 2000); // Cooldown
    }
  };

  // Compute comprehensive football metrics from live analysis events
  const metrics = useMemo<FootballMetrics>(() => {
    const defaultMetrics: FootballMetrics = {
      epa: 0, wpa: 50, totalEvents: 0, avgConfidence: 0,
      turnoversForced: 0, turnoversLost: 0, turnoverDifferential: 0,
      redZoneAttempts: 0, redZoneTDs: 0, redZoneEfficiency: 0,
      possessionTime: 0, possessionPercentage: 50,
      thirdDownAttempts: 0, thirdDownConversions: 0, thirdDownRate: 0,
      explosiveRuns: 0, explosivePasses: 0, totalExplosivePlays: 0,
      playTypes: { run: 0, pass: 0, special: 0 },
      formations: [], formationFrequency: [],
      avgPlayerSpeed: 0, maxPlayerSpeed: 0, routeEfficiency: 0,
      predictedNextPlay: 'Pass', blitzProbability: 35,
      epaTrend: [], wpaTrend: [], confidenceTrend: [],
    };

    if (liveAnalysis.length === 0) return defaultMetrics;

    let totalConfidence = 0;
    let epaSum = 0;
    let wpaSum = 50;
    const formations = new Map<string, number>();
    const playTypes = { run: 0, pass: 0, special: 0 };
    let turnoversForced = 0, turnoversLost = 0;
    let redZoneAttempts = 0, redZoneTDs = 0;
    let thirdDownAttempts = 0, thirdDownConversions = 0;
    let explosiveRuns = 0, explosivePasses = 0;
    let speedSum = 0, maxSpeed = 0, speedCount = 0;
    let successfulRoutes = 0, totalRoutes = 0;

    liveAnalysis.forEach((event, index) => {
      const details = event.details.toLowerCase();
      const eventType = event.event.toLowerCase();
      totalConfidence += event.confidence;

      // EPA Calculation: Based on play success/failure patterns
      // Positive events add EPA, negative events subtract
      let playEpa = 0;
      if (details.includes('touchdown') || details.includes('score')) {
        playEpa = 6.0 + (Math.random() * 1);
        redZoneTDs++;
      } else if (details.includes('first down') || details.includes('conversion')) {
        playEpa = 1.5 + (Math.random() * 0.5);
        if (details.includes('third')) thirdDownConversions++;
      } else if (details.includes('gain') || details.includes('yard')) {
        const yardMatch = details.match(/(\d+)\s*yard/i);
        const yards = yardMatch ? parseInt(yardMatch[1]) : Math.floor(Math.random() * 8) + 2;
        playEpa = (yards - 4) * 0.15; // Average play is ~4 yards

        // Check for explosive plays
        if (details.includes('run') || details.includes('rush')) {
          if (yards >= 12) explosiveRuns++;
        } else if (details.includes('pass') || details.includes('reception')) {
          if (yards >= 20) explosivePasses++;
        }
      } else if (details.includes('incomplete') || details.includes('no gain')) {
        playEpa = -0.5;
      } else if (details.includes('sack') || details.includes('loss')) {
        playEpa = -1.5;
      } else if (details.includes('interception') || details.includes('fumble')) {
        if (details.includes('forced') || details.includes('recovered')) {
          playEpa = 3.0;
          turnoversForced++;
        } else {
          playEpa = -4.5;
          turnoversLost++;
        }
      } else if (details.includes('penalty')) {
        playEpa = details.includes('against') ? 0.5 : -0.8;
      }
      epaSum += playEpa;

      // WPA Calculation: Win probability shifts based on game situation
      const wpaShift = playEpa * 1.5 * (1 + (index / liveAnalysis.length) * 0.5); // Late game = higher impact
      wpaSum = Math.max(5, Math.min(95, wpaSum + wpaShift));

      // Red Zone Detection
      if (details.includes('red zone') || details.includes('goal line') || details.includes('inside 20')) {
        redZoneAttempts++;
      }

      // Third Down Detection
      if (details.includes('third down') || details.includes('3rd down') || eventType.includes('third')) {
        thirdDownAttempts++;
      }

      // Formation Detection
      const formationPatterns = [
        /shotgun/i, /i-form/i, /spread/i, /pistol/i, /singleback/i,
        /empty/i, /jumbo/i, /goal line/i, /nickel/i, /dime/i,
        /4-3/i, /3-4/i, /cover \d/i, /man coverage/i, /zone/i
      ];
      formationPatterns.forEach(pattern => {
        const match = details.match(pattern);
        if (match) {
          const formationName = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
          formations.set(formationName, (formations.get(formationName) || 0) + 1);
        }
      });

      // Play Type Classification
      if (details.includes('run') || details.includes('rush') || details.includes('handoff') || details.includes('scramble')) {
        playTypes.run++;
      } else if (details.includes('pass') || details.includes('throw') || details.includes('reception') || details.includes('catch')) {
        playTypes.pass++;
      } else if (details.includes('kick') || details.includes('punt') || details.includes('field goal') || details.includes('extra point')) {
        playTypes.special++;
      }

      // Player Speed/Tracking Simulation (Next Gen Stats style)
      const speedMatch = details.match(/(\d+\.?\d*)\s*mph/i);
      if (speedMatch) {
        const speed = parseFloat(speedMatch[1]);
        speedSum += speed;
        speedCount++;
        maxSpeed = Math.max(maxSpeed, speed);
      } else if (details.includes('sprint') || details.includes('fast') || details.includes('speed')) {
        const simSpeed = 18 + Math.random() * 5;
        speedSum += simSpeed;
        speedCount++;
        maxSpeed = Math.max(maxSpeed, simSpeed);
      }

      // Route Efficiency
      if (details.includes('route') || details.includes('open') || details.includes('separation')) {
        totalRoutes++;
        if (details.includes('open') || details.includes('separation') || event.confidence > 0.7) {
          successfulRoutes++;
        }
      }
    });

    // Convert formations map to sorted array
    const formationFrequency = Array.from(formations.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Generate trend data
    const trendLength = Math.min(12, liveAnalysis.length);
    const epaTrend: { val: number }[] = [];
    const wpaTrend: { val: number }[] = [];
    const confidenceTrend: { val: number }[] = [];

    let runningEpa = 0;
    let runningWpa = 50;
    for (let i = trendLength - 1; i >= 0; i--) {
      const event = liveAnalysis[i];
      runningEpa += (event.confidence - 0.5) * 2;
      runningWpa += (event.confidence - 0.5) * 5;
      epaTrend.push({ val: runningEpa });
      wpaTrend.push({ val: Math.max(0, Math.min(100, runningWpa)) });
      confidenceTrend.push({ val: event.confidence * 100 });
    }

    // Predict next play based on tendencies
    const totalPlays = playTypes.run + playTypes.pass + playTypes.special;
    const passRatio = totalPlays > 0 ? playTypes.pass / totalPlays : 0.5;
    const predictedNextPlay = passRatio > 0.55 ? 'Pass' : passRatio < 0.45 ? 'Run' : 'Play Action';

    // Blitz probability based on down/distance patterns
    const blitzProbability = Math.round(25 + (thirdDownAttempts * 5) + (Math.random() * 20));

    return {
      epa: Math.round(epaSum * 100) / 100,
      wpa: Math.round(wpaSum * 10) / 10,
      totalEvents: liveAnalysis.length,
      avgConfidence: totalConfidence / liveAnalysis.length,
      turnoversForced,
      turnoversLost,
      turnoverDifferential: turnoversForced - turnoversLost,
      redZoneAttempts,
      redZoneTDs,
      redZoneEfficiency: redZoneAttempts > 0 ? Math.round((redZoneTDs / redZoneAttempts) * 100) : 0,
      possessionTime: liveAnalysis.length * 2, // Approximate seconds per event
      possessionPercentage: 50 + (epaSum > 0 ? Math.min(15, epaSum * 2) : Math.max(-15, epaSum * 2)),
      thirdDownAttempts,
      thirdDownConversions,
      thirdDownRate: thirdDownAttempts > 0 ? Math.round((thirdDownConversions / thirdDownAttempts) * 100) : 0,
      explosiveRuns,
      explosivePasses,
      totalExplosivePlays: explosiveRuns + explosivePasses,
      playTypes,
      formations: Array.from(formations.keys()),
      formationFrequency,
      avgPlayerSpeed: speedCount > 0 ? Math.round((speedSum / speedCount) * 10) / 10 : 15.5,
      maxPlayerSpeed: maxSpeed > 0 ? Math.round(maxSpeed * 10) / 10 : 21.2,
      routeEfficiency: totalRoutes > 0 ? Math.round((successfulRoutes / totalRoutes) * 100) : 75,
      predictedNextPlay,
      blitzProbability: Math.min(85, blitzProbability),
      epaTrend,
      wpaTrend,
      confidenceTrend,
    };
  }, [liveAnalysis]);

  // Generate slightly fluctuating chart data based on epa
  const sentimentData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      val: 60 + (Math.sin(i + gameState.offensiveEpa * 10) * 20) + (Math.random() * 10)
    }));
  }, [gameState.offensiveEpa]);

  return (
    <div className="h-full bg-white rounded-[48px] text-black p-6 flex flex-col overflow-hidden shadow-2xl">
      {/* Tab Switcher - Always visible in live mode */}
      {isLiveMode && (
        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => onViewChange('analytics')}
              className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                activeView === 'analytics'
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={14} className="inline mr-1.5" />
              Analytics
            </button>
            <button
              onClick={() => onViewChange('feed')}
              className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center ${
                activeView === 'feed'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              <Video size={14} className="mb-0.5" />
              <span>LiveFeed</span>
            </button>
            <button
              onClick={() => onViewChange('highlights')}
              className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                activeView === 'highlights'
                  ? 'bg-[#ffe566] text-black shadow-lg'
                  : 'text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              <Camera size={14} className="inline mr-1.5" />
              Highlights
            </button>
            <button
              onClick={() => onViewChange('deep-research')}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                activeView === 'deep-research'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              <Brain size={12} className="inline mr-1" />
              Deep Analysis
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {activeView !== 'deep-research' && activeView !== 'feed' && (
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {activeView === 'highlights' ? 'Key Moments' : 'Grid Analytics'}
            </h2>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
              {activeView === 'highlights' ? 'AI-Captured Highlights' : 'Super Bowl Performance Engine'}
            </p>
          </div>

          {/* Team Selection moved to Sidebar */}
        </div>
      )}

      {/* Live Feed View - Full Event Log (NOT video) */}
      {activeView === 'feed' && isLiveMode ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header with stats summary */}
          <div className="flex items-center justify-between gap-3 mb-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-3 text-white">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-tight">Live Feed</h3>
                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider">Real-Time Video Stream</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-bold text-gray-400">{liveAnalysis.length} Events</span>
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-700">
              <div className="flex flex-col items-center">
                <p className="text-[7px] font-bold text-gray-400 uppercase">EPA</p>
                <p className={`text-sm font-black ${metrics.epa >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.epa >= 0 ? '+' : ''}{metrics.epa}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[7px] font-bold text-gray-400 uppercase">TO</p>
                <p className={`text-sm font-black ${metrics.turnoverDifferential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.turnoverDifferential >= 0 ? '+' : ''}{metrics.turnoverDifferential}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[7px] font-bold text-gray-400 uppercase">P/R</p>
                <p className="text-sm font-black text-white">{metrics.playTypes.pass}/{metrics.playTypes.run}</p>
              </div>
            </div>
          </div>

          {/* Full Event Log */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <SimpleBar style={{ height: '100%' }}>
              <div className="space-y-2 pr-2">
              {liveAnalysis.length > 0 ? (
                liveAnalysis.map((event, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border transition-all ${
                      event.details.toLowerCase().includes('touchdown') || event.details.toLowerCase().includes('score')
                        ? 'bg-green-50 border-green-200'
                        : event.details.toLowerCase().includes('interception') || event.details.toLowerCase().includes('fumble')
                        ? 'bg-red-50 border-red-200'
                        : event.details.toLowerCase().includes('sack')
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{event.timestamp}</span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                          event.event.toLowerCase().includes('touchdown') ? 'bg-green-500 text-white' :
                          event.event.toLowerCase().includes('interception') ? 'bg-red-500 text-white' :
                          event.event.toLowerCase().includes('formation') ? 'bg-blue-500 text-white' :
                          'bg-gray-800 text-white'
                        }`}>{event.event}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400">{Math.round(event.confidence * 100)}%</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                          p: ({ children }) => <span className="block">{children}</span>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                        }}
                      >
                        {event.details}
                      </ReactMarkdown>
                    </div>
                    {/* EPA indicator for the event */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${event.confidence > 0.7 ? 'bg-green-500' : event.confidence > 0.5 ? 'bg-amber-500' : 'bg-gray-400'}`}
                          style={{ width: `${event.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Radio size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Waiting for Events</p>
                  <p className="text-[10px] text-gray-400 mt-1">Analysis events will appear here in real-time</p>
                </div>
              )}
              </div>
            </SimpleBar>
          </div>

          {/* Video thumbnail (hidden but capturing) */}
          {liveStream && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="hidden"
            />
          )}
        </div>
      ) : activeView === 'highlights' && isLiveMode ? (
        /* Highlights View - AI Captured Key Moments */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[#ffe566]" />
              <span className="text-[10px] font-bold text-gray-500">{highlightCaptures.length} Captures</span>
            </div>
            {liveStream && (
              <button
                onClick={() => {
                  if (liveAnalysis.length > 0) {
                    captureHighlight(liveAnalysis[0]);
                  }
                }}
                disabled={isCapturing}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
                  isCapturing
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#ffe566] text-black hover:bg-[#ffe566]/90 active:scale-95'
                }`}
              >
                <Camera size={12} />
                {isCapturing ? 'Capturing...' : 'Capture Now'}
              </button>
            )}
          </div>

          {highlightCaptures.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <SimpleBar style={{ height: '100%' }}>
                <div className="grid grid-cols-2 gap-3 pr-2">
                {highlightCaptures.map((capture) => (
                  <div key={capture.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="relative aspect-video">
                      <img
                        src={capture.aiImageUrl || capture.imageUrl}
                        alt={capture.event}
                        className="w-full h-full object-cover"
                      />
                      {/* AI Image Loading Overlay */}
                      {capture.aiImageLoading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <Loader2 size={24} className="text-white animate-spin mb-2" />
                          <span className="text-white text-[8px] font-bold uppercase tracking-wider">Generating AI Image...</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[8px] font-bold">
                        {capture.timestamp}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-[#ffe566] text-black px-2 py-1 rounded-full text-[8px] font-bold">
                        {Math.round(capture.confidence * 100)}%
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-black uppercase text-[#ffe566] mb-1">{capture.event}</p>
                      <div className="text-[9px] text-gray-600 line-clamp-2">
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                            p: ({ children }) => <span>{children}</span>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                          }}
                        >
                          {capture.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </SimpleBar>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Image size={32} className="text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400 mb-2">No Highlights Yet</p>
              <p className="text-[10px] text-gray-400 max-w-[200px]">
                Key moments will be automatically captured or click "Capture Now" to save the current frame
              </p>
            </div>
          )}
        </div>
      ) : activeView === 'deep-research' ? (
        /* Deep Analysis View - Strategic Analysis & Predictions */
        <div className="flex-1 min-h-0 overflow-hidden">
          <SimpleBar style={{ height: '100%' }}>
            <div className="flex flex-col pr-2">
              {/* Deep LLM Strategic Insights */}
              {deepAnalytics ? (
                <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-[24px] p-4 mb-4 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-cyan-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      Deep Strategic Analysis
                      <span className="ml-2 text-[8px] bg-cyan-500/30 px-2 py-0.5 rounded">GEMINI PRO</span>
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed mb-3">{deepAnalytics.strategicInsight}</p>
                  <p className="text-xs text-white/70 italic">{deepAnalytics.gameNarrative}</p>

                  {/* Key Player Impact */}
                  {deepAnalytics.keyPlayerImpact && deepAnalytics.keyPlayerImpact.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[8px] text-cyan-300 uppercase font-bold">Key Player Impact</p>
                      {deepAnalytics.keyPlayerImpact.slice(0, 3).map((player, idx) => (
                        <div key={idx} className="bg-white/10 rounded-xl p-2 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold">{player.playerName}</p>
                            <p className="text-[8px] text-white/60">{player.impact}</p>
                          </div>
                          <div className={`text-sm font-black ${player.rating >= 70 ? 'text-green-400' : player.rating >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {player.rating}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Predictive Modeling */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-cyan-300 uppercase">Drive Success</p>
                      <p className="text-lg font-black">{deepAnalytics.predictiveModeling.driveSuccessProbability}%</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-cyan-300 uppercase">Scoring Prob</p>
                      <p className="text-lg font-black">{deepAnalytics.predictiveModeling.scoringProbability}%</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-cyan-300 uppercase">Turnover Risk</p>
                      <p className="text-lg font-black text-red-400">{deepAnalytics.predictiveModeling.turnoverRisk}%</p>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[7px] text-cyan-300/70 uppercase">Offensive Efficiency</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${deepAnalytics.detailedMetrics.offensiveEfficiency}%` }} />
                        </div>
                        <span className="text-[9px] font-bold">{deepAnalytics.detailedMetrics.offensiveEfficiency}%</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[7px] text-cyan-300/70 uppercase">Defensive Pressure</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400" style={{ width: `${deepAnalytics.detailedMetrics.defensivePressure}%` }} />
                        </div>
                        <span className="text-[9px] font-bold">{deepAnalytics.detailedMetrics.defensivePressure}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Brain size={32} className="mx-auto mb-2 text-blue-400" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Generating Deep Analysis...</p>
                  </div>
                </div>
              )}

              {/* Flash Quick Analytics */}
              {flashAnalytics && (
                <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-[24px] p-4 mb-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-amber-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      Flash Analytics
                      <span className="ml-2 text-[8px] bg-amber-500/30 px-2 py-0.5 rounded">GEMINI FLASH</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[8px] text-amber-300 uppercase">Next Play Prediction</p>
                      <p className="text-base font-black capitalize">{flashAnalytics.predictedNextPlay.type}</p>
                      <p className="text-[9px] text-white/60">{flashAnalytics.predictedNextPlay.reasoning}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${flashAnalytics.predictedNextPlay.confidence}%` }} />
                        </div>
                        <span className="text-[8px] text-amber-300">{flashAnalytics.predictedNextPlay.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-amber-300 uppercase">Momentum</p>
                      <p className={`text-lg font-black ${flashAnalytics.momentumShift > 0 ? 'text-green-400' : flashAnalytics.momentumShift < 0 ? 'text-red-400' : 'text-white'}`}>
                        {flashAnalytics.momentumShift > 0 ? '+' : ''}{flashAnalytics.momentumShift}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[7px] text-amber-300/70 uppercase">EPA Trend</p>
                      <p className={`text-sm font-black capitalize ${flashAnalytics.epaTrend === 'up' ? 'text-green-400' : flashAnalytics.epaTrend === 'down' ? 'text-red-400' : 'text-white'}`}>
                        {flashAnalytics.epaTrend === 'up' ? '↑' : flashAnalytics.epaTrend === 'down' ? '↓' : '→'} {flashAnalytics.epaTrend}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[7px] text-amber-300/70 uppercase">Blitz %</p>
                      <p className="text-sm font-black">{flashAnalytics.blitzProbability}%</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-[7px] text-amber-300/70 uppercase">Formation</p>
                      <p className="text-[9px] font-bold truncate">{flashAnalytics.formationTendency}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleBar>
        </div>
      ) : (
        /* Analytics View */
        <div className="flex-1 min-h-0 overflow-hidden">
          <SimpleBar style={{ height: '100%' }}>
            <div className="flex flex-col pr-2">
            {/* Live Mode Analytics - Comprehensive Football Metrics */}
          {isLiveMode && liveAnalysis.length > 0 ? (
            <>
              {/* EPA Metric */}
              <div className={`rounded-3xl p-4 mb-4 border ${metrics.epa >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className={metrics.epa >= 0 ? 'text-green-600' : 'text-red-600'} />
                      <p className={`text-[8px] font-bold uppercase tracking-widest ${metrics.epa >= 0 ? 'text-green-600' : 'text-red-600'}`}>Expected Points Added</p>
                    </div>
                    <p className={`text-3xl font-black ${metrics.epa >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {metrics.epa >= 0 ? '+' : ''}{metrics.epa}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black"
                    style={{ backgroundColor: homeTeam.primaryColor }}
                  >
                    {homeTeam.shortName}
                  </div>
                </div>
              </div>

              {/* EPA/WPA Trend Chart */}
              {metrics.epaTrend.length > 0 && (
                <div className="mb-4 h-[80px] bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">EPA Trend</span>
                    <span className="text-[8px] font-bold text-green-500 flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                      LIVE
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.epaTrend}>
                      <defs>
                        <linearGradient id="epaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fill="url(#epaGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Secondary Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
                  <RefreshCw size={14} className={`mx-auto mb-1 ${metrics.turnoverDifferential >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <p className="text-[7px] font-bold text-gray-400 uppercase">Turnover +/-</p>
                  <p className={`text-lg font-black ${metrics.turnoverDifferential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.turnoverDifferential >= 0 ? '+' : ''}{metrics.turnoverDifferential}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
                  <Target size={14} className="mx-auto mb-1 text-red-500" />
                  <p className="text-[7px] font-bold text-gray-400 uppercase">Red Zone %</p>
                  <p className="text-lg font-black text-red-600">{metrics.redZoneEfficiency}%</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
                  <Crosshair size={14} className="mx-auto mb-1 text-amber-500" />
                  <p className="text-[7px] font-bold text-gray-400 uppercase">3rd Down %</p>
                  <p className="text-lg font-black text-amber-600">{metrics.thirdDownRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
                  <Zap size={14} className="mx-auto mb-1 text-purple-500" />
                  <p className="text-[7px] font-bold text-gray-400 uppercase">Explosive</p>
                  <p className="text-lg font-black text-purple-600">{metrics.totalExplosivePlays}</p>
                </div>
              </div>

              {/* Time of Possession & Play Distribution */}
              <div className="bg-gray-50 rounded-[24px] p-4 mb-4 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-500" />
                    <h3 className="font-black text-[10px] uppercase tracking-wider">Possession & Plays</h3>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400">{Math.floor(metrics.possessionTime / 60)}:{(metrics.possessionTime % 60).toString().padStart(2, '0')} TOP</span>
                </div>
                {/* Possession Bar with Team Colors */}
                <div className="mb-3">
                  <div className="flex justify-between text-[8px] font-bold mb-1">
                    <span style={{ color: homeTeam.primaryColor }}>{homeTeam.shortName} {Math.round(metrics.possessionPercentage)}%</span>
                    <span style={{ color: awayTeam.primaryColor }}>{100 - Math.round(metrics.possessionPercentage)}% {awayTeam.shortName}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: awayTeam.primaryColor }}>
                    <div className="h-full transition-all" style={{ width: `${metrics.possessionPercentage}%`, backgroundColor: homeTeam.primaryColor }} />
                  </div>
                </div>
                {/* Play Type Bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-500 w-12">Pass</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(metrics.playTypes.pass / Math.max(metrics.totalEvents, 1)) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black w-6">{metrics.playTypes.pass}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-500 w-12">Run</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(metrics.playTypes.run / Math.max(metrics.totalEvents, 1)) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black w-6">{metrics.playTypes.run}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-500 w-12">Special</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(metrics.playTypes.special / Math.max(metrics.totalEvents, 1)) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black w-6">{metrics.playTypes.special}</span>
                  </div>
                </div>
              </div>

              {/* Next Gen Stats Style - Player Tracking */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[24px] p-4 mb-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-cyan-400" />
                  <h3 className="font-black text-[10px] uppercase tracking-wider text-cyan-400">Next Gen Stats</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Avg Speed</p>
                    <p className="text-xl font-black text-white">{metrics.avgPlayerSpeed}<span className="text-[10px] text-gray-400 ml-1">mph</span></p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Max Speed</p>
                    <p className="text-xl font-black text-cyan-400">{metrics.maxPlayerSpeed}<span className="text-[10px] text-gray-400 ml-1">mph</span></p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Route Eff.</p>
                    <p className="text-xl font-black text-green-400">{metrics.routeEfficiency}%</p>
                  </div>
                </div>
              </div>

              {/* AI Prediction Panel */}
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[24px] p-4 mb-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-purple-300" />
                  <h3 className="font-black text-[10px] uppercase tracking-wider text-purple-300">AI Predictions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-[8px] font-bold text-purple-300 uppercase mb-1">Predicted Next Play</p>
                    <p className="text-lg font-black">{metrics.predictedNextPlay}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-[8px] font-bold text-purple-300 uppercase mb-1">Blitz Probability</p>
                    <p className="text-lg font-black">{metrics.blitzProbability}%</p>
                  </div>
                </div>
              </div>

              {/* Live Audio Commentary Panel */}
              {liveStream && (
                <div className="mb-4">
                  <LiveCommentaryPanel liveStream={liveStream} compact={false} />
                </div>
              )}

              {/* Formations Detected */}
              {metrics.formationFrequency.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-black text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Shield size={12} className="text-gray-500" />
                    Formation Tendencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {metrics.formationFrequency.map((f, i) => (
                      <div key={i} className="bg-gray-100 px-3 py-1.5 rounded-full text-[9px] font-bold border border-gray-200 flex items-center gap-1.5">
                        <span>{f.name}</span>
                        <span className="bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded-full text-[8px]">{f.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Events Feed */}
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Radio size={12} className="text-green-500 animate-pulse" />
                    Live Feed
                  </h3>
                  <span className="text-[8px] font-black text-green-500 uppercase">{metrics.totalEvents} Events</span>
                </div>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {liveAnalysis.slice(0, 4).map((event, i) => (
                    <div key={i} className="bg-gray-50 p-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-gray-500">{event.timestamp}</span>
                        <span className="text-[7px] font-black bg-black text-white px-1.5 py-0.5 rounded-full uppercase">{event.event}</span>
                      </div>
                      <div className="text-[10px] text-gray-700 leading-snug truncate">
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            p: ({ children }) => <span>{children}</span>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                          }}
                        >
                          {event.details}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Default Analytics View - No live data */
            <>
              {/* Offensive EPA Metric */}
              <div className="bg-gray-50 rounded-[32px] p-6 mb-6 border border-gray-100 flex items-center justify-between group hover:bg-gray-100 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Offensive EPA</div>
                  <div className="text-2xl font-black italic tabular-nums">{gameState.offensiveEpa > 0 ? '+' : ''}{gameState.offensiveEpa}</div>
                </div>
                <div className={`flex items-center gap-1.5 ${gameState.offensiveEpa > 0.4 ? 'text-green-500' : 'text-amber-500'}`}>
                  <TrendingUp size={20} className="animate-bounce" />
                </div>
              </div>

              {/* Tactical KPI Grid */}
              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all cursor-default group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Shield size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Defensive Stop %</p>
                      <p className="text-lg font-black italic tabular-nums">{gameState.defensiveStopRate}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all cursor-default group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:-rotate-12 transition-transform">
                      <Music size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Global Engagement</p>
                      <p className="text-lg font-black italic">{gameState.engagement} Peak</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                </div>
              </div>

              {/* Sentiment Chart */}
              <div className="mb-10 flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-baseline mb-4">
                   <h3 className="font-black text-[11px] uppercase tracking-wider">Live Media Sentiment</h3>
                   <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1">
                     <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                     +12.4% Vol
                   </span>
                </div>
                <div className="flex-1 w-full min-h-[100px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={sentimentData}>
                       <defs>
                         <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <Area
                         type="monotone"
                         dataKey="val"
                         stroke="#000"
                         strokeWidth={3}
                         fill="url(#colorVal)"
                         animationDuration={1500}
                       />
                     </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* Strategy Insights Widget */}
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="font-black text-[11px] uppercase tracking-widest">Current Strategy</h3>
                   <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                   </div>
                </div>
                <div className="relative h-40 w-full rounded-[32px] overflow-hidden bg-gray-100 group border border-gray-100">
                  {loading ? (
                     <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center text-[8px] font-black text-gray-400 uppercase tracking-widest">Initialising Tactical Link</div>
                  ) : (
                     improveImage && <img src={improveImage} alt="Tactical" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute bottom-4 left-6">
                     <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-lg flex items-center gap-2">
                       <Shield size={10} />
                       Playbook V4.2 ACTIVE
                     </p>
                  </div>
                </div>
              </div>
            </>
          )}
            </div>
          </SimpleBar>
        </div>
      )}
    </div>
  );
};
