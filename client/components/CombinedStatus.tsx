
import React, { useState, useEffect } from 'react';
import { Play, Maximize2, Minimize2, Zap, Target, BarChart3, MoreHorizontal, Camera, ChevronLeft, ChevronRight, Download, TrendingUp, Film, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Player, HighlightCapture } from '../types';
import { getTeam } from '../config/nflTeams';
import { generateHalftimeVideo } from '../services/videoGeneration';

interface CombinedStatusProps {
  image: string | null;
  loading: boolean;
  winProb: number;
  player: Player;
  isLiveMode?: boolean;
  highlights: HighlightCapture[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  gameState?: {
    homeTeam: string;
    awayTeam: string;
    quarter: number;
    score: { home: number; away: number };
  };
}

export const CombinedStatus: React.FC<CombinedStatusProps> = ({
  image,
  loading,
  winProb,
  player,
  isLiveMode = false,
  highlights,
  isExpanded = false,
  onToggleExpand,
  gameState
}) => {
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);
  const [generatingHalftimeVideo, setGeneratingHalftimeVideo] = useState(false);
  const [halftimeVideoGenerated, setHalftimeVideoGenerated] = useState(false);

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

  // Auto-trigger halftime video generation when 4+ images are available
  useEffect(() => {
    const shouldGenerateVideo = () => {
      // Check if we have 4+ reference images with URLs
      const readyImages = highlights.slice(0, 4).filter(h => h.imageUrl || h.aiImageUrl);

      // Only generate once and when we have enough images
      if (
        readyImages.length >= 4 &&
        isLiveMode &&
        !generatingHalftimeVideo &&
        !halftimeVideoGenerated &&
        gameState
      ) {
        return true;
      }
      return false;
    };

    if (shouldGenerateVideo()) {
      generateHalftimeVideoAutomatically();
    }
  }, [highlights, generatingHalftimeVideo, halftimeVideoGenerated, isLiveMode, gameState]);

  const generateHalftimeVideoAutomatically = async () => {
    if (!gameState || generatingHalftimeVideo || halftimeVideoGenerated) return;

    setGeneratingHalftimeVideo(true);

    try {
      // Get up to 4 reference images
      const referenceImages = highlights
        .slice(0, 4)
        .map(h => h.aiImageUrl || h.imageUrl)
        .filter(Boolean) as string[];

      if (referenceImages.length < 4) {
        console.log("Not enough images for halftime video yet");
        setGeneratingHalftimeVideo(false);
        return;
      }

      console.log(`Generating halftime video with ${referenceImages.length} reference images...`);

      const videoUrl = await generateHalftimeVideo(referenceImages, {
        homeTeam: gameState.homeTeam,
        awayTeam: gameState.awayTeam,
        quarter: gameState.quarter,
        homeScore: gameState.score.home,
        awayScore: gameState.score.away,
      });

      if (videoUrl) {
        console.log("Halftime video generated successfully!");
        setHalftimeVideoGenerated(true);
        // Update highlights with video URL
        const updatedHighlights = highlights.map((h, idx) =>
          idx < 4 ? { ...h, videoUrl } : h
        );
        // Note: In a real app, you'd update the highlights in parent component
      } else {
        console.error("Failed to generate halftime video");
      }
    } catch (error) {
      console.error("Error generating halftime video:", error);
    } finally {
      setGeneratingHalftimeVideo(false);
    }
  };

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

      {/* Halftime Video Indicator - When generating or ready */}
      {(generatingHalftimeVideo || halftimeVideoGenerated) && (
        <div className="absolute top-8 left-8 z-30">
          <div className={`${
            generatingHalftimeVideo
              ? 'bg-blue-500 text-white animate-pulse'
              : 'bg-green-500 text-black'
          } px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1.5`}>
            <Film size={12} />
            {generatingHalftimeVideo ? 'Generating Halftime Video' : 'Halftime Video Ready'}
          </div>
        </div>
      )}

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
          {halftimeVideoGenerated && currentHighlight?.videoUrl && (
            <button
              onClick={() => {
                window.open(currentHighlight.videoUrl, '_blank');
              }}
              className="p-4 bg-green-500/20 backdrop-blur-3xl rounded-full border border-green-500/30 hover:bg-green-500/30 transition-all text-green-400 shadow-xl"
              title="Play Halftime Video"
            >
              <Play size={18} />
            </button>
          )}
          {generatingHalftimeVideo && (
            <button
              disabled
              className="p-4 bg-blue-500/20 backdrop-blur-3xl rounded-full border border-blue-500/30 transition-all text-blue-400 shadow-xl opacity-50 cursor-not-allowed"
              title="Generating Video..."
            >
              <Loader size={18} className="animate-spin" />
            </button>
          )}
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
    </div>
  );
};
