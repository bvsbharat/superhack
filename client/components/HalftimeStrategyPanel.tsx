import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Zap, Users, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { GameState } from '../types';
import { useDeepResearch, StrategyInsight, PlayerRecommendation } from '../hooks/useDeepResearch';
import { motion } from 'motion/react';

interface HalftimeStrategyPanelProps {
  gameState: GameState;
  isVisible?: boolean;
}

export const HalftimeStrategyPanel: React.FC<HalftimeStrategyPanelProps> = ({
  gameState,
  isVisible = true,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analyzeStrategy, askQuestion, getPlayerRecommendations, loading, strategy, recommendations } = useDeepResearch();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setQuery('');

    // Get strategy analysis
    const insight = await analyzeStrategy(query, gameState, gameState.possession);

    if (insight) {
      const responseText = `
**Strategy: ${insight.title}**

${insight.description}

**Confidence:** ${Math.round(insight.confidence * 100)}%

**Key Players:**
${insight.player_recommendations.map((p) => `• **${p.name}** (${p.position}): ${p.action}`).join('\n')}

**Recommended Plays:** ${insight.play_types.join(', ') || 'Adaptive based on defense'}

**Reasoning:** ${insight.reasoning}
      `.trim();

      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full w-full bg-gradient-to-b from-blue-900/10 to-purple-900/10 rounded-[24px] overflow-hidden border border-blue-500/20 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-blue-500/20 bg-black/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brain className="text-blue-400" size={24} />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Halftime Strategy</h2>
              <p className="text-xs text-blue-300/60">
                Q{gameState.quarter} {gameState.clock} • {gameState.possession}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-blue-300">LIVE ANALYSIS</span>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="px-6 py-3 bg-black/20 flex gap-4 items-center border-b border-blue-500/10">
        <div className="flex-1 flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/5">
          <span className="text-xs text-white/40 font-bold uppercase">Score</span>
          <span className="text-lg font-black text-white">{gameState.score.home} - {gameState.score.away}</span>
        </div>
        <div className="flex-1 flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/5">
          <span className="text-xs text-white/40 font-bold uppercase">Win Prob</span>
          <span className={`text-lg font-black ${gameState.winProb > 50 ? 'text-green-400' : 'text-red-400'}`}>
            {Math.round(gameState.winProb)}%
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Sparkles className="text-blue-400" size={32} />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Strategic Analysis Ready</h3>
              <p className="text-xs text-white/40">Ask about opponent weaknesses, player matchups, or play recommendations</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-500/80 text-white rounded-br-none'
                    : 'bg-black/40 border border-blue-500/20 text-white/90 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Player Recommendations Grid */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-3 border-t border-blue-500/10 bg-black/20 max-h-32 overflow-y-auto"
        >
          <p className="text-xs text-blue-300 font-bold mb-2 uppercase flex items-center gap-2">
            <Users size={12} /> Player Recommendations
          </p>
          <div className="grid grid-cols-1 gap-2">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{rec.name}</p>
                  <p className="text-[10px] text-blue-300/60">{rec.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-blue-500/10 bg-black/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about strategy, weaknesses, or plays..."
            className="flex-1 bg-black/40 border border-blue-500/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
