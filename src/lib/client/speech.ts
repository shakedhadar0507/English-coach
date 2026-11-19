"use client";

/**
 * Browser speech services (free, on-device or OS-provided):
 * - Text-to-speech via speechSynthesis
 * - Speech-to-text via SpeechRecognition (Chrome, Edge, Safari 14.1+)
 * Availability and voice quality depend on the device and browser.
 */

export type Accent = "american" | "british" | "australian";
const LANG: Record<Accent, string> = { american: "en-US", british: "en-GB", australian: "en-AU" };

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const have = speechSynthesis.getVoices();
    if (have.length) return resolve(have);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesPromise;
}

const PREFERRED = /(Samantha|Ava|Allison|Google US English|Microsoft Aria|Microsoft Jenny|Daniel|Google UK English|Serena|Karen|Microsoft Libby|Natasha)/i;

export async function pickVoice(accent: Accent, speakerIndex = 0): Promise<SpeechSynthesisVoice | null> {
  const voices = (await loadVoices()).filter((v) => v.lang?.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  const lang = LANG[accent].toLowerCase();
  const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang);
  const pool = (exact.length ? exact : voices).sort((a, b) => Number(PREFERRED.test(b.name)) - Number(PREFERRED.test(a.name)) || Number(b.localService) - Number(a.localService));
  return pool[speakerIndex % pool.length] ?? pool[0];
}

export interface SpeakOptions { accent: Accent; rate?: number; speakerIndex?: number; signal?: AbortSignal }

/** Speaks text; resolves when finished (or cancelled). Rejects if TTS is unavailable. */
export async function speak(text: string, opts: SpeakOptions): Promise<void> {
  if (!ttsSupported()) throw new Error("tts_unsupported");
  const voice = await pickVoice(opts.accent, opts.speakerIndex ?? 0);
  if (!voice) throw new Error("no_english_voice");
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = opts.rate ?? 1;
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? resolve() : reject(new Error(e.error)));
    opts.signal?.addEventListener("abort", () => speechSynthesis.cancel(), { once: true });
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (ttsSupported()) speechSynthesis.cancel();
}

// ---------------- Speech recognition ----------------
type SR = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function SRCtor(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return SRCtor() !== null;
}

export interface Recognizer { stop(): void; abort(): void }

/**
 * Starts listening. Calls onInterim with partial text and resolves `final`
 * with the full transcript when the user stops speaking or stop() is called.
 */
export function listen(opts: { accent: Accent; onInterim?: (t: string) => void; continuous?: boolean }): { recognizer: Recognizer; final: Promise<string> } {
  const Ctor = SRCtor();
  if (!Ctor) throw new Error("stt_unsupported");
  const rec = new Ctor();
  rec.lang = LANG[opts.accent];
  rec.continuous = opts.continuous ?? true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let finalText = "";
  const final = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      opts.onInterim?.((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      reject(new Error(e.error === "not-allowed" || e.error === "service-not-allowed" ? "mic_denied" : e.error));
    };
    rec.onend = () => resolve(finalText.trim());
  });
  rec.start();
  return { recognizer: { stop: () => rec.stop(), abort: () => rec.abort() }, final };
}
