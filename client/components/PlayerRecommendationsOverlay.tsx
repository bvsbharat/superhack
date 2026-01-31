import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { GameState } from '../types';
import { useDeepResearch, PlayerRecommendation } from '../hooks/useDeepResearch';

interface PlayerPosition {
  x: number;
  y: number;
  playerName: string;
  position: string;
  team: 'home' | 'away';
}

interface PlayerRecommendationsOverlayProps {
  gameState: GameState;
  isVisible?: boolean;
  onDismiss?: () => void;
}

// Simulated player positions on field (normalized 0-100)
const SIMULATED_POSITIONS: PlayerPosition[] = [
  // Offensive line
  { x: 50, y: 20, playerName: 'QB', position: 'Quarterback', team: 'home' },
  { x: 35, y: 25, playerName: 'LT', position: 'Left Tackle', team: 'home' },
  { x: 65, y: 25, playerName: 'RT', position: 'Right Tackle', team: 'home' },

  // Receivers
  { x: 20, y: 15, playerName: 'WR1', position: 'Wide Receiver', team: 'home' },
  { x: 80, y: 15, playerName: 'WR2', position: 'Wide Receiver', team: 'home' },
  { x: 50, y: 10, playerName: 'TE', position: 'Tight End', team: 'home' },

  // Running back
  { x: 45, y: 28, playerName: 'RB', position: 'Running Back', team: 'home' },
];

interface RecommendedPlayerAction {
  playerName: string;
  action: string;
  position: string;
  priority: 'high' | 'medium' | 'low';
  x: number;
  y: number;
}

export const PlayerRecommendationsOverlay: React.FC<PlayerRecommendationsOverlayProps> = ({
  gameState,
  isVisible = true,
  onDismiss,
}) => {
  const { recommendations, getPlayerRecommendations, loading } = useDeepResearch();
  const [activeRecommendations, setActiveRecommendations] = useState<RecommendedPlayerAction[]>([]);

  useEffect(() => {
    if (isVisible && gameState) {
      loadRecommendations();
    }
  }, [isVisible, gameState.quarter, gameState.clock]);

  const loadRecommendations = async () => {
    const recs = await getPlayerRecommendations(gameState, gameState.possession);

    if (recs && recs.length > 0) {
      const mapped: RecommendedPlayerAction[] = recs.map((rec, idx) => {
        const playerPos = SIMULATED_POSITIONS[idx % SIMULATED_POSITIONS.length];
        return {
          playerName: rec.name,
          action: rec.action,
          position: rec.position,
          priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
          x: playerPos.x,
          y: playerPos.y,
        };
      });
      setActiveRecommendations(mapped);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {activeRecommendations.map((rec, idx) => (
          <motion.div
            key={`${rec.playerName}-${idx}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: idx * 0.1 }}
            className="absolute pointer-events-auto"
            style={{
              left: `${rec.x}%`,
              top: `${rec.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Player Badge */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-black border-2 cursor-pointer shadow-lg backdrop-blur-sm ${
                rec.priority === 'high'
                  ? 'bg-red-500/80 border-red-400 text-white'
                  : rec.priority === 'medium'
                  ? 'bg-yellow-500/80 border-yellow-400 text-white'
                  : 'bg-blue-500/80 border-blue-400 text-white'
              }`}
            >
              {idx + 1}
            </motion.div>

            {/* Recommendation Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.1 }}
              className="absolute top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/90 border border-white/20 rounded-lg px-3 py-2 pointer-events-auto"
            >
              <p className="text-xs font-bold text-white mb-1">{rec.playerName}</p>
              <p className="text-[10px] text-white/60 max-w-xs">{rec.action}</p>

              {/* Priority Indicator */}
              <div className="mt-2 flex items-center gap-1 text-[9px] text-white/40">
                <Zap size={10} />
                <span className="capitalize font-bold">{rec.priority} Priority</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summary Card */}
      {activeRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-black/80 border border-white/10 rounded-lg p-4 backdrop-blur-xl pointer-events-auto max-w-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Key Players</h3>
          </div>

          <div className="space-y-2">
            {activeRecommendations.slice(0, 3).map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded border ${
                  rec.priority === 'high'
                    ? 'bg-red-500/10 border-red-500/20'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    rec.priority === 'high'
                      ? 'bg-red-500 text-white'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{rec.playerName}</p>
                  <p className="text-[10px] text-white/50 truncate">{rec.action}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {activeRecommendations.length > 3 && (
            <p className="text-[10px] text-white/40 mt-2 text-center">
              +{activeRecommendations.length - 3} more recommendations
            </p>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 bg-black/80 border border-white/10 rounded-lg p-3 backdrop-blur-xl pointer-events-auto flex items-center gap-2"
        >
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-white/60">Analyzing strategy...</span>
        </motion.div>
      )}
    </div>
  );
};
