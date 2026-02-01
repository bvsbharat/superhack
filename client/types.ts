
export interface Player {
  id: string;
  name: string;
  role: string;
  team: string;
  speed: number;
  statA: string;
  rate: number;
  airYards: number;
  avatar: string;
}

export interface GameState {
  clock: string;
  quarter: number;
  score: { home: number; away: number };
  down: number;
  distance: number;
  possession: string;
  homeTeam: string;
  awayTeam: string;
  lastPlay: string;
  winProb: number;
  offensiveEpa: number;
  defensiveStopRate: number;
  engagement: string;
}

export type ViewTab = 'analytics' | 'feed' | 'highlights' | 'deep-research';

export interface HighlightCapture {
  id: string;
  timestamp: string;
  imageUrl: string;
  aiImageUrl?: string;
  aiImageLoading?: boolean;
  aiGenerationError?: string;
  description: string;
  event: string;
  confidence: number;
  playerName?: string;
  videoUrl?: string;
  videoGenerating?: boolean;
  videoError?: string;
}
