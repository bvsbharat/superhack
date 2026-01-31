import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Zap, Users, TrendingUp, Loader2, RefreshCw, ChevronDown, ChevronUp, Grid3x3, Shield, Target } from 'lucide-react';
import { GameState } from '../types';
import { useDeepResearch, StrategyInsight, PlayerRecommendation } from '../hooks/useDeepResearch';
import { motion } from 'motion/react';

interface HalftimeTactics {
  title: string;
  summary: string;
  offensive_strategy: string;
  defensive_strategy: string;
  key_formations: Array<{ name: string; when_to_use: string; success_rate: number }>;
  personnel_adjustments: Array<{ player: string; action: string; reason: string }>;
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

interface HalftimeStrategyPanelProps {
  gameState: GameState;
  isVisible?: boolean;
  showTacticsButton?: boolean;
}

export const HalftimeStrategyPanel: React.FC<HalftimeStrategyPanelProps> = ({
  gameState,
  isVisible = true,
  showTacticsButton = true,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showTacticsPanel, setShowTacticsPanel] = useState(false);
  const [tactics, setTactics] = useState<HalftimeTactics | null>(null);
  const [tacticsLoading, setTacticsLoading] = useState(false);
  const [expandedTacticsSections, setExpandedTacticsSections] = useState({
    offensive: true,
    defensive: true,
    formations: true,
    personnel: false,
    playbook: false,
  });
  const [activeTacticsTab, setActiveTacticsTab] = useState<'strategy' | 'simulation'>('strategy');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analyzeStrategy, askQuestion, getPlayerRecommendations, loading, strategy, recommendations } = useDeepResearch();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateHalftimeTactics = async () => {
    setTacticsLoading(true);
    try {
      const response = await fetch('/api/deep-research/halftime-tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_state: gameState,
          possession_team: gameState.possession,
          defense_team: gameState.possession === 'KC' ? 'SF' : 'KC',
        }),
      });

      if (response.ok) {
        const data: HalftimeTactics = await response.json();
        setTactics(data);
        setShowTacticsPanel(true);
      }
    } catch (err) {
      console.error('Failed to generate tactics:', err);
    } finally {
      setTacticsLoading(false);
    }
  };

  const toggleTacticsSection = (section: keyof typeof expandedTacticsSections) => {
    setExpandedTacticsSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SuccessProbabilityBar = ({ probability }: { probability: number }) => (
    <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${probability * 100}%`,
          backgroundColor: probability > 0.7 ? '#10b981' : probability > 0.5 ? '#f59e0b' : '#ef4444',
        }}
      />
    </div>
  );

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
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-blue-500/10 bg-black/40 space-y-2">
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
        {showTacticsButton && (
          <button
            type="button"
            onClick={generateHalftimeTactics}
            disabled={tacticsLoading}
            className="w-full p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-bold"
          >
            {tacticsLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating Deep Think Tactics...
              </>
            ) : (
              <>
                <Brain size={16} />
                Generate Halftime Tactics with Deep Think
              </>
            )}
          </button>
        )}
      </form>

      {/* Tactics Panel Modal */}
      {showTacticsPanel && tactics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTacticsPanel(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-blue-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tactics Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-blue-500/20 bg-black/60 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="text-purple-400" size={24} />
                <div>
                  <h3 className="text-lg font-black text-white uppercase">{tactics.title}</h3>
                  <p className="text-xs text-blue-300/60">Deep Think Analysis for Next Half</p>
                </div>
              </div>
              <button
                onClick={() => setShowTacticsPanel(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tactics Tabs */}
            <div className="flex gap-2 px-6 py-3 border-b border-blue-500/10 bg-black/30">
              <button
                onClick={() => setActiveTacticsTab('strategy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTacticsTab === 'strategy'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                <Target size={16} />
                Strategy
              </button>
              <button
                onClick={() => setActiveTacticsTab('simulation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTacticsTab === 'simulation'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                <Grid3x3 size={16} />
                Playbook
              </button>
            </div>

            {/* Tactics Content */}
            <div className="p-6 space-y-4">
              {activeTacticsTab === 'strategy' && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-white mb-2">📊 Strategy Summary</h4>
                    <p className="text-sm text-white/80 mb-3">{tactics.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-white/60 mb-1">Success Probability</p>
                        <SuccessProbabilityBar probability={tactics.probability_of_success} />
                        <p className="text-xs font-bold text-white">{Math.round(tactics.probability_of_success * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Confidence</p>
                        <SuccessProbabilityBar probability={tactics.confidence} />
                        <p className="text-xs font-bold text-white">{Math.round(tactics.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Offensive Strategy */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTacticsSection('offensive')}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-yellow-400" />
                        <span className="font-bold text-white">Offensive Strategy</span>
                      </div>
                      {expandedTacticsSections.offensive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedTacticsSections.offensive && (
                      <div className="px-4 pb-4 text-sm text-white/80 border-t border-blue-500/10">
                        <p className="mb-3">{tactics.offensive_strategy}</p>
                        <div>
                          <p className="font-bold text-white mb-2">Play-Calling Priorities:</p>
                          <ol className="space-y-1 text-xs">
                            {tactics.play_calling_priorities.map((priority, i) => (
                              <li key={i} className="ml-4">
                                {i + 1}. {priority}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Defensive Strategy */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTacticsSection('defensive')}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-red-400" />
                        <span className="font-bold text-white">Defensive Strategy</span>
                      </div>
                      {expandedTacticsSections.defensive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedTacticsSections.defensive && (
                      <div className="px-4 pb-4 text-sm text-white/80 border-t border-blue-500/10">
                        <p className="mb-3">{tactics.defensive_strategy}</p>
                        {tactics.counter_measures.length > 0 && (
                          <div>
                            <p className="font-bold text-white mb-2">Counter Measures:</p>
                            <ul className="space-y-1 text-xs">
                              {tactics.counter_measures.map((counter, i) => (
                                <li key={i}>• {counter}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Key Formations */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTacticsSection('formations')}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Grid3x3 size={16} className="text-green-400" />
                        <span className="font-bold text-white">Key Formations</span>
                      </div>
                      {expandedTacticsSections.formations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedTacticsSections.formations && (
                      <div className="px-4 pb-4 space-y-2 border-t border-blue-500/10">
                        {tactics.key_formations.map((formation, i) => (
                          <div key={i} className="bg-black/40 rounded p-3 text-sm">
                            <p className="font-bold text-white">{formation.name}</p>
                            <p className="text-xs text-white/60 mb-2">{formation.when_to_use}</p>
                            <SuccessProbabilityBar probability={formation.success_rate} />
                            <p className="text-xs font-bold text-white">{Math.round(formation.success_rate * 100)}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Personnel Adjustments */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTacticsSection('personnel')}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-cyan-400" />
                        <span className="font-bold text-white">Personnel Adjustments</span>
                      </div>
                      {expandedTacticsSections.personnel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedTacticsSections.personnel && (
                      <div className="px-4 pb-4 space-y-2 border-t border-blue-500/10">
                        {tactics.personnel_adjustments.map((adj, i) => (
                          <div key={i} className="bg-black/40 rounded p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-white">{adj.player}</p>
                              <span className="text-xs px-2 py-1 bg-blue-500/20 rounded text-blue-300">{adj.action}</span>
                            </div>
                            <p className="text-xs text-white/60">{adj.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reasoning */}
                  <div className="bg-black/40 border border-blue-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-white mb-2">💡 Analysis Reasoning</h4>
                    <p className="text-sm text-white/80">{tactics.reasoning}</p>
                  </div>
                </div>
              )}

              {activeTacticsTab === 'simulation' && (
                <div className="grid grid-cols-1 gap-3">
                  {tactics.simulation_playbook.map((play) => (
                    <div key={play.play_number} className="bg-black/40 border border-blue-500/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 font-bold">
                          Play #{play.play_number}
                        </span>
                        <span className="text-xs px-3 py-1 bg-blue-500/20 rounded text-blue-300 font-bold">
                          {play.play_type}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-2">{play.formation}</p>
                      <p className="text-xs text-white/60 mb-2">
                        <strong>Personnel:</strong> {play.key_personnel.join(', ')}
                      </p>
                      <p className="text-xs text-white/60 mb-3">
                        <strong>Expected Yards:</strong> {play.expected_yards}
                      </p>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Success Rate</p>
                        <SuccessProbabilityBar probability={play.success_probability} />
                        <p className="text-xs font-bold text-white">{Math.round(play.success_probability * 100)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-blue-500/10 bg-black/60 flex gap-2">
              <button
                onClick={generateHalftimeTactics}
                disabled={tacticsLoading}
                className="flex-1 p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-bold text-sm"
              >
                {tacticsLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Regenerate
                  </>
                )}
              </button>
              <button
                onClick={() => setShowTacticsPanel(false)}
                className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
