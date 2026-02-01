/**
 * Live Audio Commentary Service
 *
 * Uses Gemini Live API with native audio output (gemini-3-flash-preview-native-audio-preview)
 * to provide real-time sports commentary based on screen capture.
 */

import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Audio configuration
const OUTPUT_SAMPLE_RATE = 24000;
const FRAME_INTERVAL_MS = 2000; // Send frame every 2 seconds
const AUDIO_BUFFER_MIN = 3; // Minimum chunks before starting playback
const AUDIO_BUFFER_MAX = 8; // Max chunks to combine per play
const VIDEO_SCALE = 0.5; // Scale video to 50%

export type CommentaryStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'error';

export interface CommentaryCallbacks {
  onStatusChange?: (status: CommentaryStatus) => void;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

class LiveCommentaryService {
  private ai: GoogleGenAI | null = null;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private status: CommentaryStatus = 'disconnected';
  private callbacks: CommentaryCallbacks = {};
  private isRunning = false;
  private ownMediaStream = false; // Track if we created the stream

  // Audio playback queues
  private responseQueue: any[] = [];
  private audioQueue: ArrayBuffer[] = [];
  private messageLoopRunning = false;
  private playbackLoopRunning = false;
  private messageCount = 0; // For debug logging

  constructor() {
    if (API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    }

    // Create canvas for frame capture
    this.canvas = document.createElement('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
  }

  /**
   * Set callbacks for status changes and transcripts
   */
  setCallbacks(callbacks: CommentaryCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Get current status
   */
  getStatus(): CommentaryStatus {
    return this.status;
  }

  /**
   * Start live commentary from screen capture
   */
  async startScreenCapture(): Promise<boolean> {
    if (!this.ai) {
      this.updateStatus('error');
      this.callbacks.onError?.('No API key configured');
      return false;
    }

    try {
      this.updateStatus('connecting');

      // Request screen capture
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 },
        },
        audio: false,
      });
      this.ownMediaStream = true;

      // Listen for screen share end
      this.setupStreamEndListener();

      return await this.initializeSession();
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      this.updateStatus('error');
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to start');
      return false;
    }
  }

  /**
   * Start live commentary from existing media stream
   */
  async startFromStream(stream: MediaStream): Promise<boolean> {
    if (!this.ai) {
      this.updateStatus('error');
      this.callbacks.onError?.('No API key configured');
      return false;
    }

    try {
      this.updateStatus('connecting');

      this.mediaStream = stream;
      this.ownMediaStream = false;

      // Listen for screen share end
      this.setupStreamEndListener();

      return await this.initializeSession();
    } catch (error) {
      console.error('Failed to start from stream:', error);
      this.updateStatus('error');
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to start');
      return false;
    }
  }

  /**
   * Setup listener for when stream ends (user stops sharing)
   */
  private setupStreamEndListener(): void {
    if (!this.mediaStream) return;

    const tracks = this.mediaStream.getVideoTracks();
    tracks.forEach(track => {
      track.onended = () => {
        console.log('Screen share ended by user');
        this.stop();
      };
    });
  }

  /**
   * Initialize the session after stream is ready
   */
  private async initializeSession(): Promise<boolean> {
    try {
      // Create video element to capture frames
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.muted = true;
      await this.videoElement.play();

      // Initialize audio context for playback
      this.audioContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });

      // Connect to Gemini Live API
      await this.connectToGemini();

      // Start processing loops
      this.isRunning = true;
      this.startMessageLoop();
      this.startPlaybackLoop();

      // Send first frame immediately, then start the loop
      await this.captureAndSendFrame();

      // Now send initial prompt AFTER the first frame
      await this.sendInitialPrompt();

      // Start the frame loop for continuous updates
      this.startFrameLoop();

      this.updateStatus('connected');
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      this.updateStatus('error');
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to initialize');
      return false;
    }
  }

  /**
   * Connect to Gemini Live API with sports commentary system prompt
   */
  private async connectToGemini(): Promise<void> {
    if (!this.ai) throw new Error('AI not initialized');

    const systemInstruction = `You are an NFL play-by-play announcer. Describe what you see in the video. Read the score, describe the play. Keep it to 1-2 sentences. Sound excited.`;

    // Use native audio model with thinking disabled for pure audio output
    this.session = await this.ai.live.connect({
      model: 'gemini-2.5-flash',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Charon',
            },
          },
        },
        // Disable thinking mode to get pure audio output instead of text+thought
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
      callbacks: {
        onopen: () => {
          console.log('Connected to Gemini Live API');
        },
        onmessage: (message: any) => {
          if (this.isRunning) {
            this.responseQueue.push(message);
          }
        },
        onerror: (e: ErrorEvent) => {
          // Log the full error for debugging
          console.error('Gemini Live error:', e.message, e);
          // Don't immediately stop on error - some errors are recoverable
          if (this.isRunning && e.message && !e.message.includes('interrupted')) {
            // Only show error to user for serious errors
            if (e.message.includes('closed') || e.message.includes('failed')) {
              this.updateStatus('error');
              this.callbacks.onError?.(e.message || 'Connection error');
            }
          }
        },
        onclose: (e: CloseEvent) => {
          console.log('Gemini Live session closed:', e.code, e.reason);
          // Only stop if we're still running and it's not a normal close
          if (this.isRunning) {
            // Code 1000 is normal closure, 1001 is going away
            if (e.code !== 1000 && e.code !== 1001) {
              console.error('Abnormal session close, code:', e.code);
            }
            this.stop();
          }
        },
      },
    });

    console.log('Gemini Live session established');
  }

  /**
   * Message loop - processes incoming messages and extracts audio
   */
  private async startMessageLoop(): Promise<void> {
    if (this.messageLoopRunning) return;
    this.messageLoopRunning = true;

    const processMessages = async () => {
      while (this.isRunning) {
        if (this.responseQueue.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        }

        const message = this.responseQueue.shift();

        // Debug log the full message structure (first few messages only)
        this.messageCount++;
        if (this.messageCount <= 10) {
          // Log all keys at each level to understand structure
          console.log('Message keys:', Object.keys(message || {}));
          if (message?.serverContent) {
            console.log('serverContent keys:', Object.keys(message.serverContent));
            if (message.serverContent.modelTurn) {
              console.log('modelTurn keys:', Object.keys(message.serverContent.modelTurn));
              if (message.serverContent.modelTurn.parts) {
                console.log('parts count:', message.serverContent.modelTurn.parts.length);
                message.serverContent.modelTurn.parts.forEach((p: any, i: number) => {
                  console.log(`part[${i}] keys:`, Object.keys(p));
                });
              }
            }
          }
        }

        // Handle interruption - clear audio queue on interrupt
        if (message?.serverContent?.interrupted) {
          console.log('Interrupted - clearing audio queue');
          this.audioQueue.length = 0;
          continue;
        }

        // Extract audio from serverContent.modelTurn.parts (standard path per docs)
        if (message?.serverContent?.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            // Check for inlineData (audio comes here as base64)
            if (part.inlineData && part.inlineData.data) {
              console.log('Found inlineData audio chunk, mimeType:', part.inlineData.mimeType, 'size:', part.inlineData.data.length);
              try {
                // Decode base64 to binary
                const binaryString = atob(part.inlineData.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                this.audioQueue.push(bytes.buffer);
                console.log('Audio queue size:', this.audioQueue.length);
              } catch (e) {
                console.error('Error decoding audio:', e);
              }
            }

            // Extract text transcript if present
            if (part.text) {
              console.log('Transcript:', part.text);
              this.callbacks.onTranscript?.(part.text);
            }
          }
        }
      }
      this.messageLoopRunning = false;
    };

    processMessages().catch(err => {
      console.error('Message loop error:', err);
      this.messageLoopRunning = false;
    });
  }

  /**
   * Playback loop - combines chunks into larger buffers for smooth playback
   */
  private async startPlaybackLoop(): Promise<void> {
    if (this.playbackLoopRunning) return;
    this.playbackLoopRunning = true;

    // Target buffer size: ~0.32 seconds of audio (7680 samples at 24kHz)
    const TARGET_SAMPLES = 7680;
    const TARGET_BYTES = TARGET_SAMPLES * 2; // 2 bytes per sample (16-bit)
    let pendingData = new Uint8Array(0);

    const playAudio = async () => {
      while (this.isRunning) {
        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        if (!this.audioContext || this.audioContext.state === 'closed') {
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }

        // Collect chunks into pendingData until we have enough
        while (this.audioQueue.length > 0 && pendingData.length < TARGET_BYTES) {
          const chunk = this.audioQueue.shift();
          if (chunk && chunk.byteLength > 0) {
            const newData = new Uint8Array(pendingData.length + chunk.byteLength);
            newData.set(pendingData);
            newData.set(new Uint8Array(chunk), pendingData.length);
            pendingData = newData;
          }
        }

        // If we don't have enough data, wait for more
        if (pendingData.length < TARGET_BYTES) {
          if (this.status === 'speaking' && this.audioQueue.length === 0 && pendingData.length === 0) {
            this.updateStatus('connected');
          }
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }

        this.updateStatus('speaking');

        // Take TARGET_BYTES from pendingData
        const toPlay = pendingData.slice(0, TARGET_BYTES);
        pendingData = pendingData.slice(TARGET_BYTES);

        try {
          // Convert PCM Int16 to Float32
          const dataView = new DataView(toPlay.buffer, toPlay.byteOffset, toPlay.byteLength);
          const numSamples = toPlay.length / 2;
          const floatData = new Float32Array(numSamples);

          for (let i = 0; i < numSamples; i++) {
            const int16 = dataView.getInt16(i * 2, true); // little-endian
            floatData[i] = int16 / 32768.0;
          }

          // Create and play audio buffer
          const audioBuffer = this.audioContext.createBuffer(1, floatData.length, OUTPUT_SAMPLE_RATE);
          audioBuffer.getChannelData(0).set(floatData);

          const source = this.audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioContext.destination);

          // Wait for this buffer to finish playing
          await new Promise<void>((resolve) => {
            source.onended = () => resolve();
            source.start();
          });
        } catch (err) {
          console.error('Error playing audio:', err);
        }
      }
      this.playbackLoopRunning = false;
    };

    playAudio().catch(err => {
      console.error('Playback loop error:', err);
      this.playbackLoopRunning = false;
    });
  }

  /**
   * Start the frame capture loop
   */
  private startFrameLoop(): void {
    // First frame was already sent in initializeSession
    // Start interval for subsequent frames
    this.frameInterval = setInterval(() => {
      if (this.isRunning) {
        this.captureAndSendFrame();
      }
    }, FRAME_INTERVAL_MS);
  }

  /**
   * Capture current video frame and send to Gemini
   */
  private async captureAndSendFrame(): Promise<void> {
    if (!this.videoElement || !this.canvas || !this.canvasCtx || !this.session || !this.isRunning) {
      return;
    }

    try {
      // Scale down the video frame for faster processing (like Google's demo)
      const width = Math.floor((this.videoElement.videoWidth || 1280) * VIDEO_SCALE);
      const height = Math.floor((this.videoElement.videoHeight || 720) * VIDEO_SCALE);
      this.canvas.width = width;
      this.canvas.height = height;

      this.canvasCtx.drawImage(this.videoElement, 0, 0, width, height);

      const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = dataUrl.split(',')[1];

      console.log(`Sending frame: ${width}x${height}`);

      // Send video frame using the media parameter
      await this.session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Data,
        }
      });
    } catch (error: any) {
      // Log but don't stop on frame send errors - the session may still be usable
      console.error('Error sending frame:', error?.message || error);
      // If session is dead, stop
      if (error?.message?.includes('closed') || error?.message?.includes('not connected')) {
        this.stop();
      }
    }
  }

  /**
   * Send initial prompt to start commentary
   */
  private async sendInitialPrompt(): Promise<void> {
    if (!this.session || !this.isRunning) return;

    try {
      console.log('Sending initial prompt...');
      await this.session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: 'Start commentating on this football game now. What is the score? What is happening on the field?' }],
        }],
        turnComplete: true,
      });
    } catch (error) {
      console.error('Error sending initial prompt:', error);
    }
  }

  /**
   * Stop live commentary
   */
  async stop(): Promise<void> {
    console.log('Stopping live commentary...');

    // Set flag first to stop all loops
    this.isRunning = false;

    // Stop frame capture
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Close Gemini session
    if (this.session) {
      try {
        await this.session.close();
      } catch (e) {
        // Ignore close errors
      }
      this.session = null;
    }

    // Stop video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    // Stop media stream if we own it
    if (this.mediaStream && this.ownMediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    this.mediaStream = null;

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    this.audioContext = null;

    // Clear queues and reset counters
    this.responseQueue.length = 0;
    this.audioQueue.length = 0;
    this.messageCount = 0;

    this.updateStatus('disconnected');
    console.log('Live commentary stopped');
  }

  /**
   * Send a text prompt to guide commentary
   */
  async sendPrompt(text: string): Promise<void> {
    if (!this.session || !this.isRunning) return;

    try {
      await this.session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text }],
        }],
        turnComplete: true,
      });
    } catch (error) {
      console.error('Error sending prompt:', error);
    }
  }

  /**
   * Update status and notify callbacks
   */
  private updateStatus(status: CommentaryStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }
}

// Export singleton instance
export const liveCommentaryService = new LiveCommentaryService();
