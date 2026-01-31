/**
 * React hook for Live Audio Commentary feature
 *
 * Provides real-time sports commentary based on screen capture
 * using Gemini Live API with native audio output.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  liveCommentaryService,
  CommentaryStatus,
} from '../services/liveCommentary';

export interface UseLiveCommentaryReturn {
  status: CommentaryStatus;
  isActive: boolean;
  isSpeaking: boolean;
  transcript: string[];
  error: string | null;
  startCommentary: () => Promise<boolean>;
  startFromStream: (stream: MediaStream) => Promise<boolean>;
  stopCommentary: () => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
}

export function useLiveCommentary(): UseLiveCommentaryReturn {
  const [status, setStatus] = useState<CommentaryStatus>('disconnected');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Set up callbacks on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    liveCommentaryService.setCallbacks({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus !== 'error') {
          setError(null);
        }
      },
      onTranscript: (text) => {
        setTranscript((prev) => [...prev, text].slice(-20));
      },
      onError: (err) => {
        setError(err);
      },
    });

    // Cleanup on unmount
    return () => {
      liveCommentaryService.stop();
    };
  }, []);

  const startCommentary = useCallback(async (): Promise<boolean> => {
    setError(null);
    setTranscript([]);
    return await liveCommentaryService.startScreenCapture();
  }, []);

  const startFromStream = useCallback(async (stream: MediaStream): Promise<boolean> => {
    setError(null);
    setTranscript([]);
    return await liveCommentaryService.startFromStream(stream);
  }, []);

  const stopCommentary = useCallback(async (): Promise<void> => {
    await liveCommentaryService.stop();
  }, []);

  const sendPrompt = useCallback(async (text: string): Promise<void> => {
    await liveCommentaryService.sendPrompt(text);
  }, []);

  return {
    status,
    isActive: status === 'connected' || status === 'speaking' || status === 'connecting',
    isSpeaking: status === 'speaking',
    transcript,
    error,
    startCommentary,
    startFromStream,
    stopCommentary,
    sendPrompt,
  };
}
