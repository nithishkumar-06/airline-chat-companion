// Lightweight wrapper around the free Google Translate "single" endpoint.
// No API key required. Returns detected source language + translated text.

export interface TranslateResult {
  translatedText: string;
  detectedLang: string; // BCP-47-ish code returned by Google (e.g. "en", "ta", "hi")
}

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

const buildUrl = (text: string, source: string, target: string) => {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source,
    tl: target,
    dt: "t",
    q: text,
  });
  return `${ENDPOINT}?${params.toString()}`;
};

/**
 * Detect the language of `text` and translate it to English in a single call.
 * Falls back to original text + "en" if the request fails.
 */
export const detectAndTranslateToEnglish = async (text: string): Promise<TranslateResult> => {
  if (!text?.trim()) return { translatedText: text, detectedLang: "en" };
  try {
    const res = await fetch(buildUrl(text, "auto", "en"));
    if (!res.ok) throw new Error(`translate failed: ${res.status}`);
    const data = await res.json();
    // Response shape: [ [ [translatedChunk, originalChunk, ...], ... ], null, "<detectedLang>" , ... ]
    const chunks: string[] = Array.isArray(data?.[0])
      ? data[0].map((c: unknown[]) => (Array.isArray(c) ? String(c[0] ?? "") : "")).filter(Boolean)
      : [];
    const translatedText = chunks.join("").trim() || text;
    const detectedLang = (typeof data?.[2] === "string" && data[2]) || "en";
    return { translatedText, detectedLang };
  } catch {
    return { translatedText: text, detectedLang: "en" };
  }
};

/**
 * Translate `text` from `source` to `target`. Use "auto" for source detection.
 * Falls back to the original text on error.
 */
export const translateText = async (
  text: string,
  target: string,
  source: string = "auto",
): Promise<string> => {
  if (!text?.trim() || !target || target === source) return text;
  try {
    const res = await fetch(buildUrl(text, source, target));
    if (!res.ok) throw new Error(`translate failed: ${res.status}`);
    const data = await res.json();
    const chunks: string[] = Array.isArray(data?.[0])
      ? data[0].map((c: unknown[]) => (Array.isArray(c) ? String(c[0] ?? "") : "")).filter(Boolean)
      : [];
    return chunks.join("").trim() || text;
  } catch {
    return text;
  }
};

/**
 * Map a Google Translate short code (e.g. "ta") to a best-effort BCP-47 locale
 * for SpeechSynthesis (e.g. "ta-IN").
 */
const LANG_TO_LOCALE: Record<string, string> = {
  en: "en-US",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  ru: "ru-RU",
  ar: "ar-SA",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
  vi: "vi-VN",
  th: "th-TH",
  id: "id-ID",
};

export const toBcp47 = (code: string): string => {
  if (!code) return "en-US";
  if (code.includes("-")) return code;
  return LANG_TO_LOCALE[code] ?? code;
};
