import { useState, useRef, useEffect } from 'react';
import { autoCorrelate } from '../utils/pitch';

interface UsePitchDetectionOptions {
  onToast?: (message: string) => void;
}

export function usePitchDetection(options?: UsePitchDetectionOptions) {
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [detectedHz, setDetectedHz] = useState<number>(0);
  const [detectedMidi, setDetectedMidi] = useState<number | null>(null);
  const [measuredMin, setMeasuredMin] = useState<number | null>(null);
  const [measuredMax, setMeasuredMax] = useState<number | null>(null);

  const requestRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVocalMeasurement = async () => {
    setDetectedHz(0);
    setDetectedMidi(null);
    setMeasuredMin(null);
    setMeasuredMax(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      setIsMeasuring(true);
      if (options?.onToast) {
        options.onToast("🎙️ リアルタイムマイク測定を開始しました！声を出してください");
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      const updatePitch = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloat32TimeDomainData(dataArray);
        
        const freq = autoCorrelate(dataArray, audioCtx.sampleRate);
        if (freq > 0 && freq >= 50 && freq <= 1500) { 
          setDetectedHz(Math.round(freq));
          const midi = Math.round(12 * Math.log2(freq / 440) + 69);
          
          if (midi >= 33 && midi <= 88) { // A1 (33) to E6 (88)
            setDetectedMidi(midi);
            setMeasuredMin((prev) => prev === null ? midi : Math.min(prev, midi));
            setMeasuredMax((prev) => prev === null ? midi : Math.max(prev, midi));
          }
        }
        requestRef.current = requestAnimationFrame(updatePitch);
      };

      requestRef.current = requestAnimationFrame(updatePitch);
    } catch (err: any) {
      console.error(err);
      if (options?.onToast) {
        options.onToast("マイク測定：権限が拒否されたか、iFrame内でブロックされました。右上の「新しいタブで開く」でお試しください。");
      }
    }
  };

  const stopVocalMeasurement = () => {
    setIsMeasuring(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    if (options?.onToast) {
      options.onToast("音域測定を完了しました！適用ボタンで反映できます。");
    }
  };

  const resetMeasurement = () => {
    setDetectedHz(0);
    setDetectedMidi(null);
    setMeasuredMin(null);
    setMeasuredMax(null);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isMeasuring,
    detectedHz,
    detectedMidi,
    measuredMin,
    measuredMax,
    startVocalMeasurement,
    stopVocalMeasurement,
    resetMeasurement,
  };
}
