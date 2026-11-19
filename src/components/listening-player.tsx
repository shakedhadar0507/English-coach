"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { speak, stopSpeaking, ttsSupported, type Accent } from "@/lib/client/speech";
import { Button, En, Notice, cn } from "./ui";

export interface Segment { speaker: string; text: string }
export interface GlossaryEntry { term: string; he: string; en?: string }

const SPEEDS = [0.75, 0.9, 1, 1.15];

export function ListeningPlayer({ segments, accent, defaultRate = 1, glossary = [], onSaveWord, allowTranscript = true, onlySegment }: {
  segments: Segment[]; accent: Accent; defaultRate?: number; glossary?: GlossaryEntry[]; onSaveWord?: (term: string) => void;
  allowTranscript?: boolean; onlySegment?: number;
}) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [rate, setRate] = useState(defaultRate);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speakers = [...new Set(segments.map((s) => s.speaker))];
  const indices = onlySegment !== undefined ? [onlySegment] : segments.map((_, i) => i);

  useEffect(() => () => { abortRef.current?.abort(); stopSpeaking(); }, []);

  async function play(from: number[] = indices) {
    if (!ttsSupported()) { setError(t.listening.noVoice); return; }
    abortRef.current?.abort();
    stopSpeaking();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPlaying(true);
    setError(null);
    try {
      for (const i of from) {
        if (ctrl.signal.aborted) break;
        setCurrent(i);
        await speak(segments[i].text, { accent, rate, speakerIndex: speakers.indexOf(segments[i].speaker), signal: ctrl.signal });
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch {
      setError(t.listening.noVoice);
    } finally {
      if (abortRef.current === ctrl) { setPlaying(false); setCurrent(null); }
    }
  }

  function pause() {
    abortRef.current?.abort();
    stopSpeaking();
    setPlaying(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <Button variant="primary" onClick={pause} aria-label={t.player.pause}><Pause size={18} /> {t.player.pause}</Button>
        ) : (
          <Button variant="primary" onClick={() => play()} aria-label={t.player.listen}><Play size={18} /> {t.player.listen}</Button>
        )}
        <Button variant="ghost" onClick={() => play()} aria-label={t.common.retry} className="px-3"><RotateCcw size={18} /></Button>
        <label className="ms-auto flex items-center gap-2 text-sm text-muted">
          <Volume2 size={16} aria-hidden /> {t.listening.speed}
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="rounded-lg border border-border bg-card px-2 py-1.5 text-text">
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
      </div>

      {allowTranscript && onlySegment === undefined && (
        <button type="button" onClick={() => setShowTranscript((v) => !v)} className="self-start inline-flex items-center gap-2 text-sm text-primary font-medium">
          {showTranscript ? <EyeOff size={16} /> : <Eye size={16} />} {showTranscript ? t.player.hideTranscript : t.player.showTranscript}
        </button>
      )}

      {showTranscript && (
        <En block className="flex flex-col gap-1.5">
          {segments.map((s, i) => (
            <div key={i} className={cn("flex items-start gap-2 rounded-lg px-2 py-1", current === i && "bg-primary-bg")}>
              <button type="button" onClick={() => play([i])} className="mt-0.5 text-primary shrink-0" aria-label={`${t.player.playSegment} ${i + 1}`}><Play size={14} /></button>
              <p><span className="font-semibold text-muted">{s.speaker}: </span>{s.text}</p>
            </div>
          ))}
        </En>
      )}

      {showTranscript && glossary.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-sm font-semibold mb-2">{t.listening.glossary}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {glossary.map((g) => (
              <li key={g.term} className="flex items-center justify-between gap-2">
                <span><En className="font-medium">{g.term}</En> · {g.he}</span>
                {onSaveWord && <button type="button" className="text-primary text-xs font-semibold" onClick={() => onSaveWord(g.term)}>{t.vocab.save}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <Notice tone="warning">{error}</Notice>}
      <p className="text-xs text-muted">{t.listening.audioSource}</p>
    </div>
  );
}
