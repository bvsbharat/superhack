
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate } from 'motion';
import { Sidebar } from './components/Sidebar';
import { MatchOverview } from './components/MatchOverview';
import { CombinedStatus } from './components/CombinedStatus';
import { Statistics } from './components/Statistics';
import { LoginPage } from './components/LoginPage';
import { AIInsightPanel } from './components/AIInsightPanel';
import TeamSelector, { TeamSelectionConfig } from './components/TeamSelector';
import { AnalysisEvent } from './services/stream';
import { DEFAULT_HOME_TEAM, DEFAULT_AWAY_TEAM } from './config/nflTeams';
import { useDeepAnalytics } from './hooks/useDeepAnalytics';
import { Player, GameState, ViewTab, HighlightCapture } from './types';
import {
  restartMatch,
  getCurrentMatch,
  addEvent as addEventToDb,
  addHighlight as addHighlightToDb,
  getFullMatchData,
  MatchInfo,
} from './services/match';
import { saveSimulationSnapshot, getSimulationSnapshots, replaySimulationSnapshots } from './services/simulation';

// Types moved to ./types.ts

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>('/images/center-paceholder.jpg');
  const [improveImage, setImproveImage] = useState<string | null>('/images/superbowl-stadium.jpg');
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Refs for Motion animations
  const mainRef = useRef<HTMLDivElement>(null);
  const liveExpandedRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);

  // Deep LLM Analytics hook
  const { flashAnalytics, deepAnalytics, processEvent: processDeepAnalytics, reset: resetDeepAnalytics, setTeamContext: setDeepAnalyticsTeamContext } = useDeepAnalytics();

  // Match/Session state for PostgreSQL persistence
  const [currentMatch, setCurrentMatch] = useState<MatchInfo | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSeconds, setSimSeconds] = useState(900); // 15 Minutes
  const [dynamicPositions, setDynamicPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [playCycle, setPlayCycle] = useState(0);
  const [losY, setLosY] = useState(0);
  const [isReplayingSimulation, setIsReplayingSimulation] = useState(false);
  const [replaySnapshots, setReplaySnapshots] = useState<any[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);

  // Live streaming state
  const [isLiveMode, setIsLiveMode] = useState(false);
  // Layout expansion states
  const [isLiveExpanded, setIsLiveExpanded] = useState(false);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('analytics');
  const [rightPanelTab, setRightPanelTab] = useState<ViewTab>('analytics');
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisEvent[]>([]);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [highlights, setHighlights] = useState<HighlightCapture[]>([]);

  // Team Selection & Analytics Configuration
  const [teamSelection, setTeamSelection] = useState<TeamSelectionConfig>(() => {
    const saved = localStorage.getItem('teamSelection');
    return saved ? JSON.parse(saved) : { selectedTeam: DEFAULT_HOME_TEAM, analyticsFilter: 'all' };
  });
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<Player>({
    id: 'p1',
    name: 'P. MAHOMES',
    role: 'QB',
    team: 'KC',
    speed: 15.9,
    statA: '12 / 14 Pass',
    rate: 113,
    airYards: 284,
    avatar: 'https://picsum.photos/100/100?random=1'
  });

  const [gameState, setGameState] = useState<GameState>({
    clock: "15:00",
    quarter: 4,
    score: { home: 24, away: 21 },
    down: 1,
    distance: 10,
    possession: DEFAULT_HOME_TEAM,
    homeTeam: DEFAULT_HOME_TEAM,
    awayTeam: DEFAULT_AWAY_TEAM,
    lastPlay: "Ready for kickoff.",
    winProb: 72.4,
    offensiveEpa: 0.42,
    defensiveStopRate: 68.2,
    engagement: "9.8M"
  });

  const startSimulation = () => {
    setIsSimulating(true);
    setSimSeconds(900);
    setPlayCycle(0);
    setLosY(0);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimSeconds(0);
    setPlayCycle(0);
  };

  const loadAndPlaybackPreviousSimulation = async () => {
    if (!currentMatch?.id) return;

    try {
      const snapshots = await getSimulationSnapshots(currentMatch.id);
      if (snapshots.length === 0) {
        console.log('No previous simulations found');
        return;
      }

      setReplaySnapshots(snapshots);
      setReplayIndex(0);
      setIsReplayingSimulation(true);

      // Apply first snapshot
      if (snapshots[0]) {
        const snapshot = snapshots[0];
        setGameState(prev => ({
          ...prev,
          clock: snapshot.clock,
          quarter: snapshot.quarter,
          score: { home: snapshot.score.home, away: snapshot.score.away },
          down: snapshot.down,
          distance: snapshot.distance,
          possession: snapshot.possession,
        }));
        setDynamicPositions(snapshot.player_positions || {});
        setBallPos(snapshot.ball_position);
        setLosY(snapshot.line_of_scrimmage_y);
      }
    } catch (error) {
      console.error('Failed to load previous simulation:', error);
    }
  };

  const stopReplay = () => {
    setIsReplayingSimulation(false);
    setReplaySnapshots([]);
    setReplayIndex(0);
  };

  // Persist team selection to localStorage
  useEffect(() => {
    localStorage.setItem('teamSelection', JSON.stringify(teamSelection));
  }, [teamSelection]);

  // Handler for team selection changes
  const handleTeamSelectionChange = (config: TeamSelectionConfig) => {
    setTeamSelection(config);
    // Update the deep analytics service with the new team context
    setDeepAnalyticsTeamContext(config.selectedTeam, config.analyticsFilter);
  };

  // Animate layout panels on mount and expansion changes
  useEffect(() => {
    if (!mainRef.current) return;

    // Animate main container on auth
    if (isAuthenticated) {
      animate(mainRef.current, { opacity: [0, 1] }, { duration: 0.8 });
    }
  }, [isAuthenticated]);

  // Smooth animation for panel width changes
  useEffect(() => {
    if (liveExpandedRef.current && mediaRef.current && statisticsRef.current) {
      animate(
        liveExpandedRef.current,
        { width: isLiveExpanded ? '65%' : '40%' },
        { duration: 0.5, easing: 'ease-in-out' }
      );
      animate(
        statisticsRef.current,
        { width: isLiveExpanded ? '35%' : '30%' },
        { duration: 0.5, easing: 'ease-in-out' }
      );
    }
  }, [isLiveExpanded]);

  // Load current match data on mount and when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadMatchData = async () => {
      setIsLoadingMatch(true);
      try {
        const fullData = await getFullMatchData(100);
        if (fullData) {
          setCurrentMatch(fullData.match);
          // Load persisted events into liveAnalysis
          if (fullData.events && fullData.events.length > 0) {
            const events: AnalysisEvent[] = fullData.events.map(e => ({
              timestamp: e.timestamp,
              event: e.event,
              details: e.details,
              confidence: e.confidence,
              playerName: e.player_name || undefined,
              team: e.team || undefined,
              yards: e.yards || undefined,
              playType: e.play_type || undefined,
              formation: e.formation || undefined,
              isExplosive: e.is_explosive,
              isTurnover: e.is_turnover,
              isScoring: e.is_scoring,
              epaValue: e.epa_value,
            }));
            setLiveAnalysis(events);
          }
          // Load persisted highlights
          if (fullData.highlights && fullData.highlights.length > 0) {
            const loadedHighlights = fullData.highlights.map(h => ({
              id: h.id,
              timestamp: h.timestamp,
              imageUrl: h.imageUrl || '',
              description: h.description,
              event: h.event,
              confidence: h.confidence,
              playerName: h.player_name || undefined,
            }));
            setHighlights(loadedHighlights);
          }
          // Update game state from match data
          if (fullData.match) {
            setGameState(prev => ({
              ...prev,
              quarter: fullData.match.quarter,
              clock: fullData.match.clock,
              score: {
                home: fullData.match.home_score,
                away: fullData.match.away_score,
              },
              down: fullData.match.down,
              distance: fullData.match.distance,
              possession: fullData.match.possession || prev.possession,
              homeTeam: fullData.match.home_team || prev.homeTeam,
              awayTeam: fullData.match.away_team || prev.awayTeam,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load match data:', err);
      } finally {
        setIsLoadingMatch(false);
      }
    };

    loadMatchData();
  }, [isAuthenticated]);

  // Handler for restarting match - clears session and starts fresh
  const handleRestartMatch = useCallback(async () => {
    setIsLoadingMatch(true);
    try {
      const newMatch = await restartMatch();
      if (newMatch) {
        setCurrentMatch(newMatch);
        // Clear all local state
        setLiveAnalysis([]);
        setHighlights([]);
        setGameState({
          clock: "15:00",
          quarter: 1,
          score: { home: 0, away: 0 },
          down: 1,
          distance: 10,
          possession: DEFAULT_HOME_TEAM,
          homeTeam: DEFAULT_HOME_TEAM,
          awayTeam: DEFAULT_AWAY_TEAM,
          lastPlay: "Ready for kickoff.",
          winProb: 50.0,
          offensiveEpa: 0.0,
          defensiveStopRate: 50.0,
          engagement: "0"
        });
        // Reset deep analytics context
        resetDeepAnalytics();
        console.log('Match restarted:', newMatch.id);
      }
    } catch (err) {
      console.error('Failed to restart match:', err);
    } finally {
      setIsLoadingMatch(false);
    }
  }, [resetDeepAnalytics]);

  // Handler for new live analysis events - persist to database
  const handleLiveAnalysis = useCallback(async (event: AnalysisEvent) => {
    // Add to local state
    setLiveAnalysis(prev => [event, ...prev].slice(0, 100));

    // Update game state from detected info (teams, score, time, etc.)
    const gameInfo = event.gameInfo;
    const detectedTeams = event.detectedTeams;

    // Build updated game state for deep analytics
    let updatedGameState = gameState;

    if (gameInfo || detectedTeams) {
      updatedGameState = {
        ...gameState,
        // Update teams from detected teams or game info
        homeTeam: gameInfo?.homeTeam || detectedTeams?.home || gameState.homeTeam,
        awayTeam: gameInfo?.awayTeam || detectedTeams?.away || gameState.awayTeam,
        // Update score if detected from scoreboard
        score: {
          home: gameInfo?.homeScore ?? gameState.score.home,
          away: gameInfo?.awayScore ?? gameState.score.away,
        },
        // Update quarter and clock if detected
        quarter: gameInfo?.quarter ?? gameState.quarter,
        clock: gameInfo?.gameTime || gameState.clock,
        // Update down and distance
        down: gameInfo?.down ?? gameState.down,
        distance: gameInfo?.distance ?? gameState.distance,
        // Update possession
        possession: gameInfo?.possession || gameState.possession,
      };

      setGameState(updatedGameState);
    }

    // Trigger deep analytics processing
    processDeepAnalytics(event, {
      homeTeam: updatedGameState.homeTeam,
      awayTeam: updatedGameState.awayTeam,
      homeScore: updatedGameState.score.home,
      awayScore: updatedGameState.score.away,
      quarter: updatedGameState.quarter,
      gameTime: updatedGameState.clock,
      down: updatedGameState.down,
      distance: updatedGameState.distance,
      possession: updatedGameState.possession,
    });

    // Persist to database
    try {
      await addEventToDb(
        event.timestamp,
        event.event,
        event.details,
        event.confidence
      );
    } catch (err) {
      console.error('Failed to persist event:', err);
    }
  }, [gameState, processDeepAnalytics]);

  // Handler for capturing highlights - persist to database
  const handleCaptureHighlight = useCallback(async (capture: HighlightCapture) => {
    // Add to local state
    setHighlights(prev => [capture, ...prev].slice(0, 10));

    // Persist to database
    try {
      await addHighlightToDb(
        capture.timestamp,
        capture.event,
        capture.description,
        capture.confidence,
        capture.imageUrl,
        capture.playerName
      );
    } catch (err) {
      console.error('Failed to persist highlight:', err);
    }
  }, []);

  // Handler for updating highlight with AI image
  const handleUpdateHighlight = useCallback((highlightId: string, updates: {
    aiImageUrl?: string;
    aiImageLoading?: boolean;
  }) => {
    setHighlights(prev => prev.map(h =>
      h.id === highlightId
        ? { ...h, ...updates }
        : h
    ));
  }, []);

  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setSimSeconds(prev => {
        if (prev <= 1) {
          setIsSimulating(false);
          return 0;
        }
        return prev - 1;
      });

      const nextCycle = (playCycle + 1) % 40; // 40-second comprehensive play cycle
      setPlayCycle(nextCycle);

      // Save snapshot every 5 seconds (every 5th update)
      if (nextCycle % 5 === 0 && currentMatch?.id) {
        setDynamicPositions(prev => {
          const mins = Math.floor((simSeconds - 1) / 60);
          const secs = (simSeconds - 1) % 60;
          const timestamp = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          saveSimulationSnapshot(currentMatch.id, {
            timestamp,
            play_cycle: nextCycle,
            sim_seconds_remaining: simSeconds - 1,
            quarter: gameState.quarter,
            clock: gameState.clock,
            score_home: gameState.score.home,
            score_away: gameState.score.away,
            down: gameState.down,
            distance: gameState.distance,
            possession: gameState.possession,
            line_of_scrimmage_y: losY,
            player_positions: prev,
            ball_x: ballPos.x,
            ball_y: ballPos.y,
          }).catch(err => console.error('Failed to save simulation snapshot:', err));

          return prev;
        });
      }

      // Simulation Engine: Movement & Ball Tracking
      setDynamicPositions(prev => {
        const next: Record<string, {x: number, y: number}> = {};
        const kcIds = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'];
        const sfIds = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11'];

        // Phase Logic:
        // 0-10s: Pre-snap (Setting up)
        // 10-25s: Active Play (Moving downfield)
        // 25-40s: Post-play (Returning to line)

        const isActive = nextCycle >= 10 && nextCycle < 25;
        const actionTime = nextCycle - 10;

        kcIds.forEach(id => {
          let dx = 0, dy = losY;
          if (isActive) {
             if (id === 'p1') dy += actionTime * 0.4; // QB drops
             if (id === 'p7' || id === 'p8') {
               dy -= actionTime * 4.2; // Deep threat routes
               dx = Math.sin(actionTime * 0.5) * 12;
             }
             if (id === 'p10') {
               dy -= actionTime * 2.8; // Explosive running back
               dx = Math.cos(actionTime * 0.3) * 8;
             }
             if (id.startsWith('p') && ['p2','p3','p4','p5','p6'].includes(id)) {
               dy -= actionTime * 0.2; // O-Line pushing
             }
          } else if (nextCycle >= 25) {
             dy = losY - (15 * 0.8); // Stay at the new spot roughly
          }
          next[id] = { x: dx, y: dy };
        });

        sfIds.forEach(id => {
          let dx = 0, dy = losY;
          if (isActive) {
             dy -= actionTime * 1.1; // Aggressive defensive push
             dx = (Math.random() - 0.5) * 6;
          } else if (nextCycle >= 25) {
             dy = losY - (15 * 0.8) - 10;
          }
          next[id] = { x: dx, y: dy };
        });

        // Refined Ball Physics: Real-time Player Association
        if (nextCycle < 10) {
          // Centered at Line of Scrimmage
          setBallPos({ x: 0, y: losY + 10 }); 
        } else if (nextCycle < 15) {
          // Handed to QB (p1)
          const qbPos = next['p1'];
          setBallPos({ x: qbPos.x, y: qbPos.y + 10 });
        } else if (nextCycle < 25) {
          // Ball in flight or in WR hands
          const wrPos = next['p7'];
          // Simulate air-time interpolation
          const progress = (nextCycle - 15) / 10;
          const startX = 0, startY = losY + 15;
          const endX = wrPos.x - 55, endY = wrPos.y; 
          setBallPos({ 
            x: startX + (endX - startX) * progress, 
            y: startY + (endY - startY) * progress 
          });
        }

        // Advance Line of Scrimmage at end of play
        if (nextCycle === 39) {
           const gain = Math.floor(Math.random() * 15) + 5;
           setLosY(prev => prev - gain);
           setGameState(gs => ({
             ...gs,
             down: (gs.down % 4) + 1,
             distance: Math.max(1, gs.distance - (gain / 3)),
             score: Math.random() > 0.95 ? { ...gs.score, home: gs.score.home + 7 } : gs.score,
             lastPlay: `Gain of ${gain} yards. Down progressed.`
           }));
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulating, playCycle, losY]);

  // Replay simulation from snapshots
  useEffect(() => {
    if (!isReplayingSimulation || replaySnapshots.length === 0) return;

    const replayTimer = setInterval(() => {
      setReplayIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= replaySnapshots.length) {
          // Replay finished
          setIsReplayingSimulation(false);
          return 0;
        }

        const snapshot = replaySnapshots[nextIndex];
        setGameState(prevState => ({
          ...prevState,
          clock: snapshot.clock,
          quarter: snapshot.quarter,
          score: { home: snapshot.score.home, away: snapshot.score.away },
          down: snapshot.down,
          distance: snapshot.distance,
          possession: snapshot.possession,
        }));
        setDynamicPositions(snapshot.player_positions || {});
        setBallPos(snapshot.ball_position);
        setLosY(snapshot.line_of_scrimmage_y);

        return nextIndex;
      });
    }, 250); // Playback at 4x speed (every 250ms instead of 1s)

    return () => clearInterval(replayTimer);
  }, [isReplayingSimulation, replaySnapshots]);

  useEffect(() => {
    const mins = Math.floor(simSeconds / 60);
    const secs = simSeconds % 60;
    setGameState(prev => ({
      ...prev,
      clock: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }));
  }, [simSeconds]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadAssets = async () => {
      // We no longer generate AI images for placeholders as per user request
      // Hero image: /images/center-paceholder.jpg
      // Strategy image: /images/superbowl-stadium.jpg
    };
    loadAssets();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div ref={mainRef} className="flex h-screen w-full bg-[#050505] text-white overflow-hidden p-6 gap-6 relative" style={{ opacity: 0 }}>
      <Sidebar
        onToggleAI={() => setShowAI(!showAI)}
        teamSelection={teamSelection}
        onTeamSelectionChange={handleTeamSelectionChange}
      />

      <main className="flex-1 flex gap-6 overflow-hidden" ref={mainRef}>
        {!isMediaExpanded && (
          <div ref={liveExpandedRef} className="flex flex-col h-full min-w-[320px]" style={{ width: isLiveExpanded ? '65%' : '40%' }}>
            <MatchOverview
              gameState={gameState}
              selectedPlayerId={selectedPlayer.id}
              onPlayerSelect={setSelectedPlayer}
              isSimulating={isSimulating}
              simCountdown={simSeconds}
              dynamicPositions={dynamicPositions}
              ballPos={ballPos}
              onStartSimulation={startSimulation}
              onStopSimulation={stopSimulation}
              onLoadPreviousSimulation={loadAndPlaybackPreviousSimulation}
              isLiveMode={isLiveMode}
              onLiveModeChange={setIsLiveMode}
              liveStream={liveStream}
              onLiveStreamChange={setLiveStream}
              onLiveAnalysis={handleLiveAnalysis}
              onRestartMatch={handleRestartMatch}
              isLoadingMatch={isLoadingMatch}
              currentMatch={currentMatch}
              isExpanded={isLiveExpanded}
              onToggleExpand={() => setIsLiveExpanded(!isLiveExpanded)}
              activeView={activeTab}
              onViewChange={(view) => {
                setActiveTab(view);
                if (view === 'highlights') {
                  setIsMediaExpanded(true);
                }
              }}
            />
          </div>
        )}

        {!isLiveExpanded && (
          <div ref={mediaRef} className="flex flex-col h-full min-w-[380px]" style={{ width: isMediaExpanded ? '100%' : '30%' }}>
            <CombinedStatus
              image={heroImage}
              loading={loading}
              winProb={gameState.winProb}
              player={selectedPlayer}
              isLiveMode={isLiveMode}
              highlights={highlights}
              isExpanded={isMediaExpanded}
              onToggleExpand={() => setIsMediaExpanded(!isMediaExpanded)}
            />
          </div>
        )}

        <div ref={statisticsRef} className="min-w-[380px] flex flex-col h-full" style={{ width: '30%' }}>
          <Statistics
            improveImage={improveImage}
            loading={loading}
            gameState={gameState}
            isLiveMode={isLiveMode}
            liveAnalysis={liveAnalysis}
            liveStream={liveStream}
            onCaptureHighlight={handleCaptureHighlight}
            onUpdateHighlight={handleUpdateHighlight}
            flashAnalytics={flashAnalytics}
            deepAnalytics={deepAnalytics}
            activeView={rightPanelTab}
            onViewChange={setRightPanelTab}
            isExpanded={isLiveExpanded}
            onToggleExpand={() => setIsLiveExpanded(!isLiveExpanded)}
          />
        </div>
      </main>

      <AIInsightPanel isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  );
};

export default App;
