import { useCallback, useEffect, useRef, useState } from "react";

// Preferred female voices across platforms (macOS, Windows, Chrome, Android).
const PREFERRED_VOICES = [
  "Google UK English Female",
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Zira - English (United States)",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Zira",
  "Samantha",
  "Karen",
  "Victoria",
  "Tessa",
  "Fiona",
];

// Heuristic markers that usually indicate a female voice when the explicit
// preferred list above doesn't match anything on this system.
const FEMALE_MARKERS = [
  "female",
  "aria",
  "jenny",
  "zira",
  "samantha",
  "karen",
  "victoria",
  "tessa",
  "fiona",
  "susan",
  "linda",
  "heather",
  "catherine",
  "serena",
  "moira",
];

export interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
}

const isLikelyFemale = (v: SpeechSynthesisVoice): boolean => {
  const name = (v.name || "").toLowerCase();
  return FEMALE_MARKERS.some((m) => name.includes(m));
};

const pickVoiceForLang = (lang: string): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const lower = lang.toLowerCase();
  const base = lower.split("-")[0];
  const matches = [
    voices.filter((v) => v.lang?.toLowerCase() === lower),
    voices.filter((v) => v.lang?.toLowerCase().startsWith(base + "-")),
    voices.filter((v) => v.lang?.toLowerCase() === base),
  ];
  for (const group of matches) {
    if (!group.length) continue;
    const female = group.find(isLikelyFemale);
    if (female) return female;
  }
  for (const group of matches) {
    if (group.length) return group[0];
  }
  return null;
};

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
    // Prefer any English female voice we can find.
    if (!chosen) chosen = voices.find((v) => v.lang?.startsWith("en") && isLikelyFemale(v));
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
    (text: string, lang?: string) => {
      if (!isSupported || !text?.trim()) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const targetLang = lang || "en-US";
        utter.lang = targetLang;
        utter.rate = 1;
        utter.pitch = 1;
        // Prefer a voice that matches the requested language; fall back to the
        // English voice we picked at init time, otherwise system default.
        const langVoice = lang ? pickVoiceForLang(targetLang) : null;
        const chosen = langVoice ?? voiceRef.current;
        if (chosen) utter.voice = chosen;
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
