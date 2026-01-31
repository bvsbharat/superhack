
import React, { useState } from 'react';
import { X, Search, Sparkles, ExternalLink, Loader2, Upload, Video, Youtube, Radio } from 'lucide-react';
import { getLiveInsights, AISearchResult, analyzeMatchVideo, analyzeYoutubeVideo, AnalysisResult } from '../services/gemini';
import { LiveStreamAnalysis } from './LiveStreamAnalysis';

type TabType = 'search' | 'live';

interface AIInsightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [query, setQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<AnalysisResult[] | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setVideoAnalysis(null);
    setResult(null);
    setVideoInfo(null);
    const data = await getLiveInsights(query);
    setResult(data);
    setLoading(false);
  };

  const handleYoutubeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    setLoading(true);
    setVideoAnalysis(null);
    setResult(null);
    setVideoInfo(null);
    
    const data = await analyzeYoutubeVideo(youtubeUrl);
    if (data) {
        setVideoAnalysis(data.analysis);
        setVideoInfo(data.video_info);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setResult(null);
      setVideoAnalysis(null);
      setVideoInfo(null);
      const data = await analyzeMatchVideo(file);
      setVideoAnalysis(data);
      setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-6 top-6 bottom-6 w-96 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[40px] z-50 shadow-[0_0_100px_rgba(0,0,0,0.9)] p-8 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-400" size={20} />
          <h2 className="text-xl font-black uppercase tracking-tight">AI Command</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'search'
              ? 'bg-amber-500 text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Search size={14} />
          Search & Upload
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'live'
              ? 'bg-amber-500 text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Radio size={14} />
          Live Analysis
        </button>
      </div>

      {/* Search & Upload Tab */}
      {activeTab === 'search' && (
        <>
          <div className="space-y-4 mb-8">
            <form onSubmit={handleSearch}>
                <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about Super Bowl LIX..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-amber-500/50 transition-all"
                />
                </div>
            </form>

            <form onSubmit={handleYoutubeSearch}>
                <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/80" size={18} />
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Paste YouTube URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-amber-500/50 transition-all"
                />
                </div>
            </form>

            <div className="relative group">
                 <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl py-3 flex items-center justify-center gap-2 group-hover:bg-white/10 transition-colors">
                     <Upload size={16} className="text-white/40" />
                     <span className="text-xs font-medium text-white/40 group-hover:text-white/60">Upload Match Clip for Analysis</span>
                 </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Processing Data...</p>
              </div>
            ) : videoAnalysis ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="text-amber-400" size={18} />
                        <h3 className="text-sm font-bold text-white/80">Video Insights</h3>
                    </div>

                    {videoInfo && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                            {videoInfo.thumbnail && <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full h-32 object-cover opacity-80" />}
                            <div className="p-3 bg-white/5">
                                 <h4 className="text-xs font-bold text-white/90 truncate">{videoInfo.title}</h4>
                            </div>
                        </div>
                    )}

                    {videoAnalysis.map((item, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono text-amber-500">{item.timestamp}</span>
                                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded text-white/60">{item.event}</span>
                            </div>
                            <p className="text-sm text-white/80 leading-snug">{item.details}</p>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2">
                                <div className="bg-amber-500 h-full" style={{ width: `${item.confidence * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-sm leading-relaxed text-white/80">{result.text}</p>
                </div>

                {result.sources.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Grounding Sources</p>
                    {result.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-xs border border-white/5"
                      >
                        <span className="truncate w-64 text-white/60 font-medium">{src.title}</span>
                        <ExternalLink size={14} className="text-white/30" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Sparkles className="text-white/20" size={24} />
                </div>
                <p className="text-sm text-white/40">Try: "Latest weather in New Orleans" or Upload a match clip.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Live Analysis Tab */}
      {activeTab === 'live' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <LiveStreamAnalysis />
        </div>
      )}
    </div>
  );
};
