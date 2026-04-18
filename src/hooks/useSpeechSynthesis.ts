import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_VOICES = [
  "Google US English",
  "Samantha",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria",
  "Microsoft Jenny",
];

export interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const pickVoice = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    let chosen: SpeechSynthesisVoice | undefined;
    for (const name of PREFERRED_VOICES) {
      chosen = voices.find((v) => v.name === name);
      if (chosen) break;
    }
    if (!chosen) chosen = voices.find((v) => v.lang === "en-US");
    if (!chosen) chosen = voices.find((v) => v.lang?.startsWith("en"));
    voiceRef.current = chosen ?? null;
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;
    pickVoice();
    window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", pickVoice);
    };
  }, [isSupported, pickVoice]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text?.trim()) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = 1;
        utter.pitch = 1;
        if (voiceRef.current) utter.voice = voiceRef.current;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      } catch {
        setIsSpeaking(false);
      }
    },
    [isSupported],
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
};
