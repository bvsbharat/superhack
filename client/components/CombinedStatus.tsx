
import React, { useState, useEffect } from 'react';
import { Play, Maximize2, Minimize2, Zap, Target, BarChart3, MoreHorizontal, Camera, ChevronLeft, ChevronRight, Download, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Player, HighlightCapture } from '../types';
import { getTeam } from '../config/nflTeams';

interface CombinedStatusProps {
  image: string | null;
  loading: boolean;
  winProb: number;
  player: Player;
  isLiveMode?: boolean;
  highlights: HighlightCapture[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CombinedStatus: React.FC<CombinedStatusProps> = ({
  image,
  loading,
  winProb,
  player,
  isLiveMode = false,
  highlights,
  isExpanded = false,
  onToggleExpand
}) => {
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);

  // Auto-rotate through highlights
  useEffect(() => {
    if (highlights.length > 1 && showHighlight) {
      const interval = setInterval(() => {
        setCurrentHighlightIndex(prev => (prev + 1) % highlights.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [highlights.length, showHighlight]);

  // Show highlight when new one is captured
  useEffect(() => {
    if (highlights.length > 0) {
      setShowHighlight(true);
      setCurrentHighlightIndex(0);
    }
  }, [highlights.length]);

  const currentHighlight = highlights[currentHighlightIndex];
  // Use AI-generated image if available, otherwise fall back to captured frame
  const highlightDisplayImage = currentHighlight?.aiImageUrl || currentHighlight?.imageUrl;
  const displayImage = showHighlight && currentHighlight ? highlightDisplayImage : image;
  const isShowingAiImage = showHighlight && currentHighlight?.aiImageUrl;

  const handleDownload = () => {
    if (!displayImage) return;
    
    const link = document.createElement('a');
    link.href = displayImage;
    link.download = `superbowl-moment-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative h-full w-full rounded-[48px] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-black">
      {/* Visual Core */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-[#0a0a0a]">
            <div className="w-12 h-12 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-amber-500/40 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Live Sync</p>
          </div>
        ) : (
          displayImage && <img src={displayImage} alt={showHighlight && currentHighlight ? currentHighlight.event : player.name} className="w-full h-full object-cover transition-transform duration-[6000ms] group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Highlight Mode Info - When showing captured moment */}
      {showHighlight && currentHighlight && isLiveMode && currentHighlight.aiImageLoading && (
        <div className="absolute top-8 left-8 z-30">
          <div className="bg-[#ffe566] text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase animate-pulse shadow-lg">
            Generating...
          </div>
        </div>
      )}

      {/* Floating Header UI */}
      <div className="absolute top-8 right-8 flex justify-end items-center z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            disabled={!displayImage}
            className="p-4 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 hover:bg-white/15 transition-all text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download Image"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={onToggleExpand}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Bottom Profile Information Area */}
      <div className="absolute bottom-6 left-8 right-8 z-20">
        {/* Current Highlight Info - Shows when viewing a highlight */}
        {showHighlight && currentHighlight && isLiveMode && (
          <div className="mb-2 bg-black/60 backdrop-blur-xl border border-[#ffe566]/20 rounded-2xl p-3 shadow-2xl relative overflow-hidden group/highlight">
            <span className="absolute top-3 right-3 text-[8px] font-black bg-[#ffe566] text-black px-2 py-0.5 rounded-full uppercase shadow-lg z-10 group-hover/highlight:scale-105 transition-transform">
              {currentHighlight.event}
            </span>
            
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-[#ffe566]/80 uppercase tracking-widest mb-0.5">{currentHighlight.timestamp}</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1.5 leading-none pr-16">
                {currentHighlight.playerName || player.name}
              </h3>
              <div className="text-[11px] text-white/60 leading-tight max-h-[80px] overflow-y-auto custom-scrollbar pr-2">
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => <strong className="font-bold text-white/90">{children}</strong>,
                    p: ({ children }) => <p className="mb-1">{children}</p>,
                    em: ({ children }) => <em className="italic text-white/50">{children}</em>,
                  }}
                >
                  {currentHighlight.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Player Info - Shows when NOT viewing highlight */}
        {(!showHighlight || !currentHighlight || !isLiveMode) && (
          <div className="flex justify-between items-end mb-4">
             <div className="max-w-[70%]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[8px] font-black"
                    style={{
                      backgroundColor: getTeam(player.team).primaryColor,
                      color: getTeam(player.team).textColor,
                    }}
                  >
                    {player.team}
                  </span>
                  <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">{player.role}</span>
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-none">{player.name}</h2>
                <div className="flex items-center gap-4 text-white/70 text-[9px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
                  <span className="flex items-center gap-1.5"><Zap size={10} className="text-[#ffe566]" /> <span className="tabular-nums">{player.speed}</span> mph</span>
                  <span className="flex items-center gap-1.5"><Target size={10} className="text-[#ffe566]" /> {player.statA}</span>
                  <span className="flex items-center gap-1.5"><BarChart3 size={10} className="text-[#ffe566]" /> <span className="tabular-nums">{player.rate}</span> Rate</span>
                </div>
             </div>
             <button className="p-3 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all shadow-2xl">
                <MoreHorizontal size={20} />
             </button>
          </div>
        )}

        {/* Highlights Carousel - Apple Dock style container */}
        {isLiveMode && (
          <div className="mt-6 mb-2 relative group/carousel h-24 flex items-center justify-center px-12">
            <style>{`
              #highlight-carousel::-webkit-scrollbar {
                display: none;
              }
              #highlight-carousel {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            <div 
              className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/10 p-3 px-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-x-auto scroll-smooth max-w-[90%]" 
              id="highlight-carousel"
            >
              {highlights.length > 0 ? (
                highlights.map((highlight, index) => {
                  const thumbImage = highlight.aiImageUrl || highlight.imageUrl;
                  const hasAiImage = !!highlight.aiImageUrl;
                  const isLoading = highlight.aiImageLoading;
                  const isSelected = currentHighlightIndex === index && showHighlight;

                  return (
                    <button
                      key={highlight.id}
                      onClick={() => {
                        setCurrentHighlightIndex(index);
                        setShowHighlight(true);
                      }}
                      className={`flex-shrink-0 relative rounded-2xl overflow-hidden border-2 transition-all duration-500 transform hover:scale-125 hover:-translate-y-2 active:scale-95 ${
                        isSelected
                          ? 'border-[#ffe566] ring-4 ring-[#ffe566]/30 shadow-[0_0_20px_rgba(255,229,102,0.3)]'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="w-14 h-10 bg-gray-800">
                        <img
                          src={thumbImage}
                          alt={highlight.event}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Loading overlay for AI generation */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white/20 border-t-[#ffe566] rounded-full animate-spin" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {/* AI badge on thumbnail */}
                      {hasAiImage && !isLoading && (
                        <div className="absolute top-1 left-1 bg-[#ffe566] text-black px-1 py-0.5 rounded text-[4px] font-black uppercase shadow-sm">
                          AI
                        </div>
                      )}
                      <div className="absolute bottom-0.5 left-0 right-0">
                        <p className="text-[5px] text-white/60 text-center font-black tracking-tighter uppercase">{highlight.timestamp}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ffe566] rounded-full animate-pulse shadow-[0_0_8px_#ffe566]" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex items-center justify-center text-[8px] font-black text-white/20 uppercase tracking-[0.3em] italic px-12 py-2">
                  Awaiting Grid Highlights...
                </div>
              )}
            </div>

            {/* Navigation Arrows - Integrated into the Dock layout */}
            <button
              onClick={() => {
                if (highlights.length === 0) return;
                const el = document.getElementById('highlight-carousel');
                if (el) el.scrollBy({ left: -120, behavior: 'smooth' });
                setCurrentHighlightIndex(prev => prev === 0 ? highlights.length - 1 : prev - 1);
              }}
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-2xl rounded-full flex items-center justify-center text-white transition-all border border-white/10 z-20 shadow-2xl ${highlights.length === 0 ? 'opacity-10 cursor-not-allowed' : 'opacity-100 hover:bg-[#ffe566] hover:text-black hover:scale-110 active:scale-90'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                if (highlights.length === 0) return;
                const el = document.getElementById('highlight-carousel');
                if (el) el.scrollBy({ left: 120, behavior: 'smooth' });
                setCurrentHighlightIndex(prev => (prev + 1) % highlights.length);
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-2xl rounded-full flex items-center justify-center text-white transition-all border border-white/10 z-20 shadow-2xl ${highlights.length === 0 ? 'opacity-10 cursor-not-allowed' : 'opacity-100 hover:bg-[#ffe566] hover:text-black hover:scale-110 active:scale-90'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
