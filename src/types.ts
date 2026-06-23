export interface Song {
  id: string;
  title: string;
  artist: string;
  min: number; // MIDI note number
  max: number; // MIDI note number
  gender: 'male' | 'female' | 'unisex';
  originalKey: string;
  genre: 'J-POP' | 'アニソン' | 'ロック' | 'バラード';
  tags: string[];
  description: string;
}

export interface AnalyzedSong extends Song {
  simMin: number;
  simMax: number;
  simFitsPerfect: boolean;
  simHitsLow: boolean;
  simHitsHigh: boolean;
  tooHighSemanticCount: number;
  tooLowSemanticCount: number;
  origFitsPerfect: boolean;
  canSingWithAdjustments: boolean;
  optimalShift: number | null;
  possibleKeyRange: number[];
  originalWidth: number;
  tier: 'perfect' | 'adjustable' | 'difficult';
  userSpan: number;
}

export interface VoicePreset {
  name: string;
  min: number;
  max: number;
  desc: string;
}
