import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { GameState } from '../types';
import { chatWithAnalyst, ChatMessage } from '../services/geminiChat';

interface DeepResearchProps {
  gameState: GameState;
}

export const DeepResearch: React.FC<DeepResearchProps> = ({ gameState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: "I'm analyzing the live match feed. Ask me anything about player performance, strategic trends, or predictive outcomes.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await chatWithAnalyst(input, messages, gameState);

    const modelMsg: ChatMessage = {
      role: 'model',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] rounded-[32px] overflow-hidden border border-white/5 relative">
      {/* Header Section with Live Analytics */}
      <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                <Brain className="text-blue-400" size={20} />
                Deep Research
              </h1>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest whitespace-nowrap">
                  Gemini Pro
                </span>
                <span className="text-white/40 text-[9px] uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"/>
                  Live Context
                </span>
              </div>
            </div>
            <p className="text-white/50 text-[10px] max-w-lg leading-relaxed line-clamp-1">
              Real-time strategic analysis engine leveraging live tracking data for predictive outcomes.
            </p>
          </div>
          
          {/* Live Data Summary Card */}
          <div className="flex gap-2">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Score</span>
                <span className="text-sm font-black text-white leading-none">{gameState.score.home}-{gameState.score.away}</span>
             </div>
             <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Win Prob</span>
                <span className="text-sm font-black text-[#ffe566] leading-none">{Math.round(gameState.winProb * 100)}%</span>
             </div>
             <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider mb-0.5">EPA</span>
                <span className="text-sm font-black text-green-400 leading-none">+{gameState.offensiveEpa}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-blue-400" />
              </div>
            )}
            
            <div className={`max-w-[70%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-[#ffe566] text-black rounded-tr-none' 
                : 'bg-[#1a1a1a] border border-white/10 text-white rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed font-medium">
                {msg.content}
              </p>
              <span className={`text-[10px] mt-2 block opacity-50 font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-black' : 'text-white'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#ffe566]/20 border border-[#ffe566]/30 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-[#ffe566]" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Loader2 size={16} className="text-blue-400 animate-spin" />
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about coverage schemes, next play prediction, or player stats..."
            className="w-full bg-[#111] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm font-medium"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-center mt-3 gap-6">
           <button className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest flex items-center gap-1">
              <RefreshCw size={10} /> Reset Context
           </button>
           <span className="text-[10px] text-white/20 uppercase tracking-widest">Model: Gemini 1.5 Pro</span>
        </div>
      </div>
    </div>
  );
};
