import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isRecording: boolean;
  finalText: string;
  interimText: string;
  start: (lang?: string) => void;
  stop: () => void;
  cancel: () => void;
  setFinalText: (text: string) => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionResult => {
  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const isSupported = !!SpeechRecognitionCtor;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTextRef = useRef<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalTextState] = useState("");
  const [interimText, setInterimText] = useState("");

  const updateFinal = useCallback((text: string) => {
    finalTextRef.current = text;
    setFinalTextState(text);
  }, []);

  const ensureInstance = useCallback(() => {
    if (!SpeechRecognitionCtor) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const recognition = new SpeechRecognitionCtor();
    // Empty string lets the browser auto-detect when supported. Some engines
    // ignore "" — we'll override via start(lang) when caller knows better.
    recognition.lang = "";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let appended = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          appended += transcript;
        } else {
          interim += transcript;
        }
      }
      if (appended) {
        const prev = finalTextRef.current;
        const needsSpace = prev && !prev.endsWith(" ") && !appended.startsWith(" ");
        const next = (prev + (needsSpace ? " " : "") + appended).replace(/\s+/g, " ").trimStart();
        updateFinal(next);
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [SpeechRecognitionCtor, updateFinal]);

  const start = useCallback(
    (lang?: string) => {
      const r = ensureInstance();
      if (!r) return;
      try {
        // Allow caller to bias recognition to a specific BCP-47 locale once
        // it's been detected on a previous turn.
        r.lang = lang ?? "";
        r.start();
        setIsRecording(true);
      } catch {
        // already started
      }
    },
    [ensureInstance],
  );

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  }, []);

  const cancel = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.abort();
      } catch {
        // ignore
      }
    }
    updateFinal("");
    setInterimText("");
    setIsRecording(false);
  }, [updateFinal]);

  const setFinalText = useCallback(
    (text: string) => {
      updateFinal(text);
    },
    [updateFinal],
  );

  useEffect(() => {
    return () => {
      const r = recognitionRef.current;
      if (r) {
        try {
          r.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { isSupported, isRecording, finalText, interimText, start, stop, cancel, setFinalText };
};
