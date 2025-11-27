import { TimeSignature } from './types';

export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;
export const DEFAULT_TIME_SIGNATURE = TimeSignature.FOUR_FOUR;
export const DEFAULT_BACKGROUND = 'https://picsum.photos/1920/1080?grayscale&blur=2';

export const LOOKAHEAD_MS = 25.0; // How frequently to call scheduling function (in milliseconds)
export const SCHEDULE_AHEAD_TIME_SEC = 0.1; // How far ahead to schedule audio (in seconds)

export const TIME_SIGNATURE_OPTIONS = [
  { label: '1/4', value: TimeSignature.ONE_FOUR },
  { label: '2/4', value: TimeSignature.TWO_FOUR },
  { label: '3/4', value: TimeSignature.THREE_FOUR },
  { label: '4/4', value: TimeSignature.FOUR_FOUR },
  { label: '5/4', value: TimeSignature.FIVE_FOUR },
  { label: '6/8', value: TimeSignature.SIX_EIGHT },
];
