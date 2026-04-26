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
  // Tracks user intent: true means we want to keep listening even if the
  // browser fires `onend` (which Chrome does after short silences). We use
  // this flag to auto-restart recognition for a continuous-feel experience.
  const wantRecordingRef = useRef(false);
  const currentLangRef = useRef<string>("");
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
    recognition.lang = "";
    // continuous=true keeps the engine alive across pauses in speech so the
    // user doesn't get cut off mid-thought. We still auto-restart on onend
    // for engines that ignore the flag.
    recognition.continuous = true;
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are common transient errors. Only stop the
      // session for permanent failures.
      const err = (event as unknown as { error?: string })?.error;
      if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
        wantRecordingRef.current = false;
        setIsRecording(false);
        setInterimText("");
      }
    };

    recognition.onend = () => {
      setInterimText("");
      // Auto-restart while user still wants to record. Chrome ends the
      // session after ~5s of silence even with continuous=true.
      if (wantRecordingRef.current) {
        try {
          recognition.lang = currentLangRef.current;
          recognition.start();
        } catch {
          // start() can throw "InvalidStateError" if engine hasn't fully
          // released. Schedule a retry on the next tick.
          setTimeout(() => {
            if (!wantRecordingRef.current) return;
            try {
              recognition.start();
            } catch {
              wantRecordingRef.current = false;
              setIsRecording(false);
            }
          }, 250);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [SpeechRecognitionCtor, updateFinal]);

  const start = useCallback(
    (lang?: string) => {
      const r = ensureInstance();
      if (!r) return;
      currentLangRef.current = lang ?? "";
      r.lang = currentLangRef.current;
      wantRecordingRef.current = true;
      try {
        r.start();
        setIsRecording(true);
      } catch {
        // already started — onend handler will keep it alive
        setIsRecording(true);
      }
    },
    [ensureInstance],
  );

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    wantRecordingRef.current = false;
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
    wantRecordingRef.current = false;
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
