
export enum GameState {
  LOADING_APP = 'LOADING_APP',
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING_THEME = 'LOADING_THEME'
}

export interface ThemeConfig {
  name: string;
  description: string;
  skyColor: string;
  pipeColor: string;
  groundColor: string;
  birdEmoji: string;
  accentColor: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  deaths: number;
  customBirdUrl?: string | null;
  customMusicUrl?: string | null;
  customMusicName?: string | null;
}

export interface GeminiCommentary {
  message: string;
  vibe: string;
}

export interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}
