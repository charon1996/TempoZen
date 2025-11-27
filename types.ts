export enum PlayState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING'
}

export enum TimeSignature {
  ONE_FOUR = 1,
  TWO_FOUR = 2,
  THREE_FOUR = 3,
  FOUR_FOUR = 4,
  FIVE_FOUR = 5,
  SIX_EIGHT = 6
}

export interface MetronomeSettings {
  bpm: number;
  beatsPerBar: number;
  subdivision: number; // 1 = quarter, 2 = eighth, etc.
}

export interface BackgroundState {
  url: string;
  isGenerated: boolean;
  isLoading: boolean;
  prompt: string;
}
