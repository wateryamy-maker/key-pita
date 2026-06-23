import { NOTE_BASE_NAMES, NOTE_BASE_NAMES_JP } from '../data/songs';

export const PIANO_START = 36; // lowC
export const PIANO_END = 84;   // hihiC

// 日本語および英数字の揺れ（全角・半角、ひらがな・カタカナ、大文字・小文字、NFC/NFD結合文字）を吸収するテキスト正規化関数
export function normalizeText(text: string): string {
  if (!text) return "";
  
  // 1. NFC正規化 (結合文字を結合状態にする)
  let val = text.normalize("NFC");
  
  // 2. 全角英数字を半角に変換、大文字を小文字に
  val = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // 3. 小文字に統一、半角・全角スペースを除去
  val = val.toLowerCase().replace(/[\s\u3000]+/g, "");
  
  // 4. カタカナをひらがなの揺れに揃える
  val = val.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
  
  return val;
}

// Converter from MIDI number to Karaoke Terminology
// e.g. 60 -> "mid2C (C4 / ド)"
export function formatPitch(midiNumber: number): { raw: string; prefix: string; note: string; full: string } {
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const baseName = NOTE_BASE_NAMES[noteIndex];
  const jpDoc = NOTE_BASE_NAMES_JP[noteIndex];
  
  let prefix = "";
  if (octave <= 1) {
    prefix = "lowlow";
  } else if (octave === 2) {
    prefix = "low";
  } else if (octave === 3) {
    prefix = "mid1";
  } else if (octave === 4) {
    prefix = "mid2";
  } else if (octave === 5) {
    prefix = "hi";
  } else {
    prefix = "hihi";
  }

  return {
    raw: `${prefix}${baseName}`,
    prefix,
    note: `${baseName}(${jpDoc})`,
    full: `${prefix}${baseName} [${jpDoc}] (C${octave})`
  };
}

// 🎙️ Auto-correlation based pitch detection algorithm
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.008) {
    return -1; // Volume is too low to detect pitch reliably
  }

  // Trim quiet segment boundaries for peak tracking
  let r1 = 0, r2 = size - 1;
  const thres = 0.15;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = size - 1; i >= size / 2; i--) {
    if (Math.abs(buffer[i]) < thres) { r2 = i; break; }
  }
  const sliced = buffer.subarray(r1, r2);
  const len = sliced.length;

  if (len < 64) return -1; // Safety threshold

  const c = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      c[i] = c[i] + sliced[j] * sliced[j + i];
    }
  }

  // Find the first zero-crossing peak
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < len; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  // Parabolic interpolation for fine frequency tuning
  const x1 = c[T0 - 1] || 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  if (T0 <= 0) return -1;
  return sampleRate / T0;
}

// Convert MIDI number to keyboard colors
export function isBlackKey(midiNumber: number): boolean {
  const index = midiNumber % 12;
  return [1, 3, 6, 8, 10].includes(index);
}
