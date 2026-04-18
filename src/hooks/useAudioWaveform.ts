import { useCallback, useEffect, useRef, useState } from "react";

const BAR_COUNT = 48;

/**
 * Captures live mic audio via Web Audio API and exposes a normalized
 * frequency-bar array (length BAR_COUNT, values 0..1) for visualization.
 */
export const useAudioWaveform = () => {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  const [isActive, setIsActive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    sourceRef.current = null;
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setBars(Array(BAR_COUNT).fill(0));
    setIsActive(false);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (isActive) return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // -> 64 frequency bins
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        // Down-sample / aggregate to BAR_COUNT
        const step = buffer.length / BAR_COUNT;
        const next: number[] = new Array(BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          const startIdx = Math.floor(i * step);
          const endIdx = Math.floor((i + 1) * step);
          let sum = 0;
          let count = 0;
          for (let j = startIdx; j < endIdx; j++) {
            sum += buffer[j];
            count++;
          }
          const avg = count ? sum / count : 0;
          next[i] = Math.min(1, avg / 200); // 0..1 with a little headroom
        }
        setBars(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      setIsActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      stop();
    }
  }, [isActive, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { bars, isActive, start, stop };
};
