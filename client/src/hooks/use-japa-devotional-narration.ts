import { useCallback, useEffect, useMemo, useRef } from "react";

export type DevotionalNarrationPurpose = "mantra_benefit" | "completion";
type Result = "ended" | "failed" | "timed_out";

type Options = {
  purpose: DevotionalNarrationPurpose;
  text: string;
  cacheKey: string;
  onEnded?: () => void;
  onFailed?: () => void;
  onTimedOut?: () => void;
};

const MAX_WAIT_MS = 12000;
const cache = new Map<string, string>();

/** Hindi narration with a bounded, cancellable browser fallback. */
export function useJapaDevotionalNarration() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  const cancel = useCallback(() => {
    generationRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel?.();
  }, []);

  const play = useCallback((options: Options) => {
    cancel();
    const generation = generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    let settled = false;
    let fallbackStarted = false;
    const finish = (result: Result) => {
      if (settled || generation !== generationRef.current) return;
      settled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      controller.abort();
      abortRef.current = null;
      if (result !== "ended") {
        audioRef.current?.pause();
        if (typeof window !== "undefined") window.speechSynthesis?.cancel?.();
      }
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
      audioRef.current = null;
      if (result === "ended") options.onEnded?.();
      else if (result === "failed") options.onFailed?.();
      else options.onTimedOut?.();
    };
    const speak = () => {
      if (fallbackStarted || settled || generation !== generationRef.current) return;
      fallbackStarted = true;
      if (
        typeof window === "undefined"
        || typeof window.speechSynthesis?.speak !== "function"
        || typeof SpeechSynthesisUtterance !== "function"
      ) return finish("failed");
      try {
        const utterance = new SpeechSynthesisUtterance(options.text);
        utterance.lang = "hi-IN";
        utterance.rate = 0.86;
        utterance.pitch = 0.82;
        const voices = window.speechSynthesis.getVoices();
        const maleHint = /male|man|ravi|hemant|madhur|onyx|amit|raj/i;
        utterance.voice = voices.find((voice) => /hi[-_]IN/i.test(voice.lang) && maleHint.test(voice.name))
          || voices.find((voice) => /hi[-_]IN/i.test(voice.lang))
          || voices.find((voice) => /en[-_]IN/i.test(voice.lang) && maleHint.test(voice.name))
          || null;
        utterance.onend = () => finish("ended");
        utterance.onerror = () => finish("failed");
        window.speechSynthesis.speak(utterance);
      } catch { finish("failed"); }
    };
    const playUrl = (url: string) => {
      if (typeof Audio === "undefined") return speak();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.preload = "auto";
      audio.volume = 0.95;
      audio.onended = () => finish("ended");
      audio.onerror = speak;
      void audio.play().catch(speak);
    };
    const url = cache.get(options.cacheKey);
    if (url) {
      playUrl(url);
    } else {
      void fetch("/api/japa/devotional-narration", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: options.purpose,
          text: options.text,
          cacheKey: options.cacheKey,
        }),
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error("Narration unavailable");
        const blob = await response.blob();
        if (generation !== generationRef.current) return;
        const generatedUrl = URL.createObjectURL(blob);
        cache.set(options.cacheKey, generatedUrl);
        playUrl(generatedUrl);
      }).catch((error) => {
        if (error?.name !== "AbortError") speak();
      });
    }
    timerRef.current = setTimeout(() => finish("timed_out"), MAX_WAIT_MS);
    return cancel;
  }, [cancel]);

  useEffect(() => cancel, [cancel]);
  return useMemo(() => ({ play, cancel }), [play, cancel]);
}