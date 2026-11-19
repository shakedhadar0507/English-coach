"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Mic, Square, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { ListeningPlayer, type GlossaryEntry, type Segment } from "./listening-player";
import { Badge, Button, En, Notice, cn } from "./ui";
import { listen, sttSupported, type Accent, type Recognizer } from "@/lib/client/speech";

export interface PublicExercise {
  id: string;
  type: string;
  skill: string;
  prompt: Record<string, any>;
}

export interface ListeningData { segments: Segment[]; accent: Accent; glossary?: GlossaryEntry[] }

export type ExerciseResponse =
  | { kind: "choice"; selected: string[] }
  | { kind: "blanks"; values: string[] }
  | { kind: "text"; value: string }
  | { kind: "tokens"; order: string[] };

export interface Feedback {
  verdict: "correct" | "almost" | "incorrect" | "needs_review";
  isCorrect: boolean;
  correctAnswer?: string;
  correctOptionIds?: string[];
  matched?: string;
  note?: string;
  blanks?: boolean[];
  missingWords?: string[];
  accepted?: string[];
  sample?: string;
  explanation_he?: string;
  explanation_en?: string;
  rule?: { en: string; he: string } | null;
  example?: { en: string; he: string } | null;
  grammarTitle?: { en: string; he: string } | null;
  queued?: boolean;
}

const CHOICE = new Set(["multiple_choice", "listening_mc", "reading_mc", "identify_error"]);
const TEXT = new Set(["correct_sentence", "rewrite", "translate_he_en", "write_sentence", "dictation", "speaking_prompt"]);

/** Deterministic shuffle so options never appear in authoring order (where the key is often first). */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function ExerciseView({ exercise, listening, accent, voiceRate, mode, attempt = 0, onSubmit, onSelfAssess, onContinue }: {
  exercise: PublicExercise;
  listening?: ListeningData;
  accent: Accent;
  voiceRate: number;
  mode: "lesson" | "test";
  attempt?: number;
  onSubmit: (r: ExerciseResponse) => Promise<Feedback | null>;
  onSelfAssess?: (correct: boolean, r: ExerciseResponse) => Promise<void>;
  onContinue: (retry?: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const p = exercise.prompt;
  const [selected, setSelected] = useState<string[]>([]);
  const [blanks, setBlanks] = useState<string[]>(() => Array(Math.max(1, String(p.text ?? "").split("___").length - 1)).fill(""));
  const [text, setText] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const firstInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const options: { id: string; text: string }[] = useMemo(
    () => (CHOICE.has(exercise.type) && exercise.type !== "identify_error" ? seededShuffle(p.options ?? [], `${exercise.id}:${attempt}`) : p.options ?? []),
    [exercise.id, exercise.type, attempt, p.options]);
  const tokens: string[] = p.tokens ?? [];
  const multi = false;

  useEffect(() => { firstInput.current?.focus({ preventScroll: true }); }, [exercise.id]);
  useEffect(() => () => recRef.current?.abort(), []);

  const response = (): ExerciseResponse | null => {
    if (CHOICE.has(exercise.type)) return selected.length ? { kind: "choice", selected } : null;
    if (exercise.type === "fill_blank") return blanks.every((b) => b.trim()) ? { kind: "blanks", values: blanks } : null;
    if (exercise.type === "reorder") return order.length === tokens.length ? { kind: "tokens", order: order.map((i) => tokens[i]) } : null;
    if (TEXT.has(exercise.type)) return text.trim() ? { kind: "text", value: text } : null;
    return null;
  };

  async function submit() {
    const r = response();
    if (!r || busy) return;
    setBusy(true);
    setError(null);
    try {
      const fb = await onSubmit(r);
      if (mode === "lesson") setFeedback(fb);
    } catch {
      setError(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function selfAssess(correct: boolean) {
    const r = response();
    if (!r || !onSelfAssess) return;
    setBusy(true);
    try {
      await onSelfAssess(correct, r);
      setFeedback((f) => (f ? { ...f, verdict: correct ? "correct" : "incorrect", isCorrect: correct } : f));
    } finally { setBusy(false); }
  }

  async function toggleRecording() {
    if (recording) { recRef.current?.stop(); return; }
    try {
      const { recognizer, final } = listen({ accent, onInterim: setText });
      recRef.current = recognizer;
      setRecording(true);
      const finalText = await final;
      if (finalText) setText(finalText);
    } catch (e) {
      setError((e as Error).message === "mic_denied" ? t.speak.micDenied : t.player.speakingUnsupported);
    } finally {
      setRecording(false);
    }
  }

  const locked = feedback !== null && feedback.verdict !== "needs_review";
  const showFb = mode === "lesson" && feedback;

  return (
    <div className="flex flex-col gap-5 animate-pop">
      {/* Prompt */}
      {exercise.type === "reading_mc" && (
        <En block className="rounded-2xl bg-surface border border-border p-4 leading-relaxed text-[17px]">{p.passage}</En>
      )}
      {(exercise.type === "listening_mc" || exercise.type === "dictation") && listening && (
        <ListeningPlayer segments={listening.segments} accent={listening.accent ?? accent} defaultRate={voiceRate} glossary={listening.glossary}
          allowTranscript={mode === "lesson" && (locked || exercise.type === "listening_mc") && feedback !== null}
          onlySegment={exercise.type === "dictation" ? p.segment : undefined} />
      )}

      <div>
        {exercise.type === "dictation" && <p className="text-muted mb-2">{t.player.dictationHint}</p>}
        {(exercise.type === "rewrite") && <p className="text-muted mb-2">{locale === "he" ? p.instruction_he : p.instruction_en}</p>}
        {(exercise.type === "write_sentence") && (
          <p className="text-muted mb-2">{locale === "he" ? p.instruction_he : p.instruction_en}{" "}
            {p.required_words?.map((w: string) => <Badge key={w} tone="primary" className="ms-1"><En>{w}</En></Badge>)}</p>
        )}
        {exercise.type === "speaking_prompt" && (
          <div className="mb-2">
            <Badge tone="primary">{t.player.speakingTask}</Badge>
            <p className="mt-2">{locale === "he" ? p.task_he : p.task_en}</p>
            {locale === "he" && <En block className="text-sm text-muted mt-1">{p.task_en}</En>}
          </div>
        )}
        {exercise.type === "translate_he_en" && <p className="text-xl font-semibold" dir="rtl" lang="he">{p.source}</p>}
        {exercise.type === "correct_sentence" && <En block className="text-xl font-semibold">{p.sentence}</En>}
        {exercise.type === "rewrite" && <En block className="text-xl font-semibold">{p.sentence}</En>}
        {(exercise.type === "multiple_choice" || exercise.type === "listening_mc" || exercise.type === "reading_mc") && (
          <>
            <En block className="text-xl font-semibold leading-snug">{p.question}</En>
            {p.question_he && locale === "he" && <p className="text-muted text-sm mt-1">{p.question_he}</p>}
          </>
        )}
        {exercise.type === "identify_error" && <p className="text-muted mb-1">{locale === "he" ? "הקש על החלק השגוי במשפט:" : "Tap the incorrect part of the sentence:"}</p>}
      </div>

      {/* Answer input */}
      {CHOICE.has(exercise.type) && exercise.type !== "identify_error" && (
        <div role="radiogroup" className="flex flex-col gap-2.5">
          {options.map((o) => {
            const isSel = selected.includes(o.id);
            const isKey = showFb && feedback?.correctOptionIds?.includes(o.id);
            return (
              <button key={o.id} type="button" role="radio" aria-checked={isSel} disabled={locked || busy}
                onClick={() => setSelected(multi ? (isSel ? selected.filter((s) => s !== o.id) : [...selected, o.id]) : [o.id])}
                className={cn("min-h-14 rounded-2xl border-2 px-4 py-3 text-start text-[17px] font-medium transition-colors",
                  !showFb && (isSel ? "border-primary bg-primary-bg" : "border-border bg-card hover:border-accent"),
                  showFb && isKey && "border-success bg-success-bg",
                  showFb && isSel && !isKey && "border-danger bg-danger-bg",
                  showFb && !isSel && !isKey && "border-border bg-card opacity-70")}
                {...(/[\u0590-\u05FF]/.test(o.text) ? { dir: "rtl", lang: "he" } : { dir: "ltr", lang: "en" })}>
                <span className="flex items-center justify-between gap-2">{o.text}
                  {showFb && isKey && <Check size={20} className="text-success" aria-hidden />}
                  {showFb && isSel && !isKey && <X size={20} className="text-danger" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {exercise.type === "identify_error" && (
        <div dir="ltr" lang="en" className="flex flex-wrap gap-2 text-xl">
          {options.map((o) => {
            const isSel = selected.includes(o.id);
            const isKey = showFb && feedback?.correctOptionIds?.includes(o.id);
            return (
              <button key={o.id} type="button" data-option disabled={locked || busy} onClick={() => setSelected([o.id])} aria-pressed={isSel}
                className={cn("rounded-xl border-2 px-3 py-2 font-medium",
                  !showFb && (isSel ? "border-primary bg-primary-bg" : "border-border bg-card"),
                  showFb && isKey && "border-success bg-success-bg", showFb && isSel && !isKey && "border-danger bg-danger-bg",
                  showFb && !isSel && !isKey && "border-border bg-card")}>{o.text}</button>
            );
          })}
        </div>
      )}

      {exercise.type === "fill_blank" && (
        <div dir="ltr" lang="en" className="text-xl leading-[2.6rem]">
          {String(p.text).split("___").map((part: string, i: number, arr: string[]) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <input data-blank ref={i === 0 ? (el) => { firstInput.current = el; } : undefined} value={blanks[i]} disabled={locked || busy}
                  onChange={(e) => setBlanks(blanks.map((b, j) => (j === i ? e.target.value : b)))}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  aria-label={`${t.player.typeAnswer} ${i + 1}`} autoCapitalize="off" autoCorrect="off" spellCheck={false}
                  className={cn("mx-1 inline-block w-36 rounded-lg border-b-2 bg-surface px-2 py-0.5 text-center outline-none",
                    showFb && feedback?.blanks ? (feedback.blanks[i] ? "border-success bg-success-bg" : "border-danger bg-danger-bg") : "border-primary")} />
              )}
            </span>
          ))}
          {p.hint && <p className="text-base text-muted mt-1">{p.hint}</p>}
          {p.word_bank && (
            <div className="flex flex-wrap gap-2 mt-2">{p.word_bank.map((w: string) => <Badge key={w}>{w}</Badge>)}</div>
          )}
        </div>
      )}

      {exercise.type === "reorder" && (
        <div className="flex flex-col gap-3" dir="ltr" lang="en">
          <div className="min-h-16 rounded-2xl border-2 border-dashed border-border p-3 flex flex-wrap gap-2" aria-label={t.player.tapWords}>
            {order.map((ti, pos) => (
              <button key={`${ti}-${pos}`} type="button" disabled={locked || busy} onClick={() => setOrder(order.filter((_, j) => j !== pos))}
                className="rounded-xl bg-primary-bg text-primary px-3 py-2 text-lg font-medium">{tokens[ti]}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {tokens.map((tok, ti) => (
              <button key={ti} type="button" data-token disabled={order.includes(ti) || locked || busy} onClick={() => setOrder([...order, ti])}
                className={cn("rounded-xl border border-border bg-card px-3 py-2 text-lg font-medium", order.includes(ti) && "opacity-30")}>{tok}</button>
            ))}
          </div>
          {!locked && order.length > 0 && <button type="button" onClick={() => setOrder([])} className="self-start text-sm text-primary">{t.player.reset}</button>}
        </div>
      )}

      {TEXT.has(exercise.type) && (
        <div className="flex flex-col gap-2">
          <textarea ref={(el) => { firstInput.current = el; }} value={text} onChange={(e) => setText(e.target.value)} disabled={locked || busy}
            dir="ltr" lang="en" rows={exercise.type === "speaking_prompt" ? 4 : 2} placeholder={t.player.typeAnswer}
            autoCapitalize="sentences" spellCheck={exercise.type !== "dictation"}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && exercise.type !== "speaking_prompt") { e.preventDefault(); submit(); } }}
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-lg outline-none focus:border-primary" />
          {exercise.type === "speaking_prompt" && !locked && (
            sttSupported() ? (
              <Button variant={recording ? "danger" : "secondary"} onClick={toggleRecording} className="self-start">
                {recording ? <><Square size={18} /> {t.player.stop}</> : <><Mic size={18} /> {t.player.record}</>}
              </Button>
            ) : <p className="text-sm text-muted">{t.player.speakingUnsupported}</p>
          )}
        </div>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      {/* Feedback */}
      {showFb && feedback && <FeedbackPanel fb={feedback} onSelfAssess={onSelfAssess ? selfAssess : undefined} busy={busy} />}

      {/* Actions */}
      <div className="sticky bottom-20 md:bottom-4 z-10 pt-2">
        {!feedback || mode === "test" ? (
          <Button block onClick={submit} disabled={!response() || busy}>{busy ? t.common.loading : t.player.check}</Button>
        ) : feedback.verdict === "needs_review" ? null : (
          <div className="flex gap-2">
            {!feedback.isCorrect && (
              <Button variant="secondary" onClick={() => onContinue(true)} className="flex-1">{t.player.tryAgain}</Button>
            )}
            <Button onClick={() => onContinue(false)} className="flex-1">{t.player.continue}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackPanel({ fb, onSelfAssess, busy }: { fb: Feedback; onSelfAssess?: (c: boolean) => void; busy: boolean }) {
  const { t, locale } = useI18n();
  const tone = fb.verdict === "correct" ? "success" : fb.verdict === "almost" ? "warning" : fb.verdict === "needs_review" ? "primary" : "danger";
  const title = fb.verdict === "correct" ? t.player.correct : fb.verdict === "almost" ? t.player.almost : fb.verdict === "needs_review" ? t.player.needsReview : t.player.incorrect;
  const expl = locale === "he" ? fb.explanation_he : fb.explanation_en;
  return (
    <div role="status" aria-live="polite" className={cn("rounded-2xl p-4 flex flex-col gap-3",
      tone === "success" && "bg-success-bg", tone === "warning" && "bg-warning-bg", tone === "danger" && "bg-danger-bg", tone === "primary" && "bg-primary-bg")}>
      <p className="font-bold text-lg flex items-center gap-2">
        {fb.isCorrect ? <Check className="text-success" aria-hidden /> : fb.verdict === "incorrect" ? <X className="text-danger" aria-hidden /> : null}{title}
      </p>
      {fb.note === "alternative" && fb.matched && <p className="text-sm">{t.player.acceptedAlso}: <En>{fb.matched}</En></p>}
      {fb.missingWords?.length ? <p className="text-sm">{t.player.missingWords}: <En>{fb.missingWords.join(", ")}</En></p> : null}
      {!fb.isCorrect && fb.correctAnswer && fb.verdict !== "needs_review" && (
        <div><p className="text-sm text-muted">{t.player.correctAnswer}</p><En block className="font-semibold text-lg">{fb.correctAnswer}</En></div>
      )}
      {fb.verdict === "needs_review" && (
        <>
          <p className="text-sm">{t.player.selfCheckTitle}</p>
          {(fb.accepted?.length ? fb.accepted : fb.sample ? [fb.sample] : []).slice(0, 3).map((a) => <En key={a} block className="font-semibold">{a}</En>)}
          {onSelfAssess && (
            <div className="flex gap-2">
              <Button variant="success" disabled={busy} onClick={() => onSelfAssess(true)} className="flex-1">{t.player.selfCorrect}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => onSelfAssess(false)} className="flex-1">{t.player.selfWrong}</Button>
            </div>
          )}
        </>
      )}
      {fb.sample && fb.verdict !== "needs_review" && <div><p className="text-sm text-muted">{t.player.sample}</p><En block>{fb.sample}</En></div>}
      {expl && <div><p className="text-sm font-semibold">{t.player.why}</p><p className="leading-relaxed">{expl}</p></div>}
      {fb.rule && <div><p className="text-sm font-semibold">{t.player.rule}{fb.grammarTitle ? ` · ${locale === "he" ? fb.grammarTitle.he : fb.grammarTitle.en}` : ""}</p><p>{locale === "he" ? fb.rule.he : fb.rule.en}</p></div>}
      {fb.example && <div><p className="text-sm font-semibold">{t.player.anotherExample}</p><En block className="font-medium">{fb.example.en}</En>{locale === "he" && <p className="text-sm text-muted">{fb.example.he}</p>}</div>}
      {fb.queued && <p className="text-xs text-muted">{t.common.offline}</p>}
    </div>
  );
}
