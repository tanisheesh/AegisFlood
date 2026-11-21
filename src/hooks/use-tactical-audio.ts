"use client";

import { useCallback, useRef, useState } from "react";

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function useTacticalAudio() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioWarning, setAudioWarning] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const toggleAudio = useCallback(() => {
    setAudioWarning(null);
    setAudioEnabled((prev) => !prev);
  }, []);

  const playTacticalBeep = useCallback(
    (freq: number, durationSec: number) => {
      if (!audioEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx =
            window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
          if (!AudioCtx) {
            setAudioWarning("Web Audio API unavailable in this browser.");
            return;
          }
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      } catch (err) {
        setAudioWarning(
          err instanceof Error ? `Audio synth blocked: ${err.message}` : "Audio playback blocked.",
        );
      }
    },
    [audioEnabled],
  );

  return { audioEnabled, audioWarning, toggleAudio, playTacticalBeep };
}
