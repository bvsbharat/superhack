/**
 * Live Commentary Panel Component
 *
 * Provides UI controls for starting/stopping live audio commentary
 * based on screen capture using Gemini Live API.
 */

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
  AlertCircle,
  Waves,
} from 'lucide-react';
import { useLiveCommentary } from '../hooks/useLiveCommentary';

interface LiveCommentaryPanelProps {
  liveStream?: MediaStream | null;
  compact?: boolean;
}

export const LiveCommentaryPanel: React.FC<LiveCommentaryPanelProps> = ({
  liveStream = null,
  compact = false,
}) => {
  const {
    status,
    isActive,
    isSpeaking,
    transcript,
    error,
    startCommentary,
    startFromStream,
    stopCommentary,
    sendPrompt,
  } = useLiveCommentary();

  const [isMuted, setIsMuted] = useState(false);

  const handleToggleCommentary = async () => {
    if (isActive) {
      await stopCommentary();
    } else {
      // If we have an existing live stream, use it
      if (liveStream) {
        await startFromStream(liveStream);
      } else {
        // Otherwise start our own screen capture
        await startCommentary();
      }
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'speaking':
        return 'text-amber-400';
      case 'connecting':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Ready';
      case 'speaking':
        return 'Speaking';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Off';
    }
  };

  // Compact mode for inline display
  if (compact) {
    return (
      <button
        onClick={handleToggleCommentary}
        disabled={status === 'connecting'}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
          isActive
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
      >
        {status === 'connecting' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isActive ? (
          <>
            <Waves size={14} className={isSpeaking ? 'animate-pulse' : ''} />
            <span>Live Commentary</span>
            {isSpeaking && (
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
                <span className="w-1 h-3 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_0.1s_infinite]" />
                <span className="w-1 h-3 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" />
              </span>
            )}
          </>
        ) : (
          <>
            <Mic size={14} />
            <span>Start Commentary</span>
          </>
        )}
      </button>
    );
  }

  // Full panel mode
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[24px] p-4 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isActive ? 'bg-amber-500/20' : 'bg-white/10'}`}>
            <Radio size={16} className={isActive ? 'text-amber-400' : 'text-white/40'} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Commentary</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Gemini Live Audio
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 ${getStatusColor()}`}>
          {status === 'speaking' && (
            <div className="flex gap-0.5 mr-1">
              <span className="w-1 h-3 bg-current rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
              <span className="w-1 h-3 bg-current rounded-full animate-[bounce_0.6s_ease-in-out_0.1s_infinite]" />
              <span className="w-1 h-3 bg-current rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" />
            </div>
          )}
          <span className="text-[10px] font-bold uppercase">{getStatusText()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleToggleCommentary}
          disabled={status === 'connecting'}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
          }`}
        >
          {status === 'connecting' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connecting...
            </>
          ) : isActive ? (
            <>
              <MicOff size={16} />
              Stop Commentary
            </>
          ) : (
            <>
              <Mic size={16} />
              Start Live Commentary
            </>
          )}
        </button>

        {isActive && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-xl transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
            <p className="text-xs text-red-200/80">{error}</p>
          </div>
        </div>
      )}

      {/* Transcript Preview */}
      {transcript.length > 0 && (
        <div className="bg-white/5 rounded-xl p-3 max-h-[120px] overflow-y-auto">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-2">
            Recent Commentary
          </p>
          <div className="space-y-1">
            {transcript.slice(-5).map((text, i) => (
              <p key={i} className="text-xs text-white/70 leading-snug">
                {text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      {isActive && (
        <div className="mt-3">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-2">
            Quick Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {['More excitement!', 'Focus on defense', 'Analyze the play', 'Score update'].map(
              (prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendPrompt(prompt)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-medium text-white/60 hover:text-white transition-all"
                >
                  {prompt}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Instructions when inactive */}
      {!isActive && !error && (
        <div className="text-center py-2">
          <p className="text-[10px] text-white/40">
            {liveStream
              ? 'Start AI commentary for the current stream'
              : 'Start screen capture with live AI sports commentary'}
          </p>
        </div>
      )}
    </div>
  );
};
