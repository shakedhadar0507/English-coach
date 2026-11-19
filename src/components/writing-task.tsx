"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { Badge, Button, En, Notice, cn } from "./ui";
import { newId } from "@/lib/client/use-active-time";
import { wordCount } from "@/lib/learning/normalize";

export interface WritingIssue { type: "error" | "unnatural" | "alternative" | "style"; original: string; suggestion: string; explanation: string; grammar_topic?: string | null; category: string }
export interface WritingFeedbackData { corrected_text: string; summary: string; issues: WritingIssue[]; strengths?: string[]; follow_up?: { instruction: string; example: string } | null }

const draftKey = (id: string) => `ec-draft:${id}`;

export function WritingTask({ exerciseId, sessionId, prompt, onDone }: {
  exerciseId?: string; sessionId?: string | null; prompt: { task_en: string; task_he: string; min_words: number; max_words: number }; onDone?: () => void;
}) {
  const { t, locale } = useI18n();
  const key = exerciseId ?? prompt.task_en.slice(0, 40);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<WritingFeedbackData | null>(null);
  const [submissionKey] = useState(() => newId("w"));
  const words = wordCount(text);

  useEffect(() => { try { setText(localStorage.getItem(draftKey(key)) ?? ""); } catch { /* storage unavailable */ } }, [key]);
  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(draftKey(key), text); } catch { /* ignore */ } }, 400);
    return () => clearTimeout(id);
  }, [text, key]);

  async function submit() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/writing", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseId: exerciseId ?? null, sessionId: sessionId ?? null, taskPrompt: prompt.task_en, body: text, clientSubmissionId: submissionKey }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); return; }
      setStatus(data.status);
      setFeedback(data.feedback);
      try { localStorage.removeItem(draftKey(key)); } catch { /* ignore */ }
    } catch {
      setStatus("offline");
    } finally {
      setBusy(false);
    }
  }

  const submitted = status && status !== "error" && status !== "offline";

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <div>
        <Badge tone="primary">{t.player.writingTask}</Badge>
        <p className="mt-2 leading-relaxed">{locale === "he" ? prompt.task_he : prompt.task_en}</p>
        {locale === "he" && <En block className="text-sm text-muted mt-1">{prompt.task_en}</En>}
      </div>
      {!submitted && (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} dir="ltr" lang="en" rows={8} placeholder={t.writing.placeholder}
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-lg leading-relaxed outline-none focus:border-primary" />
          <div className="flex items-center justify-between text-sm text-muted">
            <span className={cn(words < prompt.min_words && "text-warning")}>{words} {t.player.words} · {fmt(t.player.minWords, { n: prompt.min_words })}</span>
            <span>{t.writing.saveDraft}</span>
          </div>
          {status === "offline" && <Notice tone="warning">{t.common.offline}</Notice>}
          {status === "error" && <Notice tone="danger">{t.common.error}</Notice>}
          <Button block disabled={busy || words < prompt.min_words || words > prompt.max_words * 1.5} onClick={submit}>{busy ? t.writing.evaluating : t.player.getFeedback}</Button>
        </>
      )}
      {submitted && (
        <>
          {status === "evaluation_disabled" && <Notice>{t.writing.submittedNoAi}</Notice>}
          {status === "budget_exceeded" && <Notice tone="warning">{t.common.budgetExceeded}</Notice>}
          {(status === "evaluation_failed" || status === "rate_limited") && <Notice tone="warning">{t.common.error}</Notice>}
          {feedback ? <WritingFeedbackView original={text} feedback={feedback} /> : <En block className="rounded-2xl bg-surface p-4 whitespace-pre-wrap">{text}</En>}
          {onDone && <Button block onClick={onDone}>{t.player.continue}</Button>}
        </>
      )}
    </div>
  );
}

const TYPE_TONE = { error: "danger", unnatural: "warning", alternative: "primary", style: "neutral" } as const;

export function WritingFeedbackView({ original, feedback }: { original: string; feedback: WritingFeedbackData }) {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const [view, setView] = useState<"original" | "corrected">("original");

  // Highlight each issue span in the original text.
  const parts = useMemo(() => {
    const out: { text: string; issue?: number }[] = [];
    let cursor = 0;
    const lower = original.toLowerCase();
    const spans = feedback.issues
      .map((iss, i) => ({ i, start: lower.indexOf(iss.original.toLowerCase()), len: iss.original.length }))
      .filter((s) => s.start >= 0)
      .sort((a, b) => a.start - b.start);
    for (const s of spans) {
      if (s.start < cursor) continue;
      out.push({ text: original.slice(cursor, s.start) });
      out.push({ text: original.slice(s.start, s.start + s.len), issue: s.i });
      cursor = s.start + s.len;
    }
    out.push({ text: original.slice(cursor) });
    return out;
  }, [original, feedback.issues]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-primary-bg p-4">
        <p className="font-semibold mb-1">{t.writing.summary}</p>
        <p className="leading-relaxed">{feedback.summary}</p>
        {feedback.strengths?.length ? <ul className="mt-2 list-disc ps-5 text-sm">{feedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : null}
      </div>

      <div className="flex gap-2" role="tablist">
        {(["original", "corrected"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={cn("rounded-full px-4 py-1.5 text-sm font-semibold", view === v ? "bg-primary text-on-primary" : "bg-card border border-border")}>
            {v === "original" ? t.writing.original : t.writing.corrected}
          </button>
        ))}
      </div>

      <div dir="ltr" lang="en" className="rounded-2xl border border-border bg-card p-4 text-lg leading-relaxed whitespace-pre-wrap">
        {view === "corrected" ? feedback.corrected_text : parts.map((p, i) => p.issue === undefined ? <span key={i}>{p.text}</span> : (
          <button key={i} type="button" onClick={() => setActive(p.issue!)}
            className={cn("rounded px-0.5 underline decoration-2 underline-offset-4",
              feedback.issues[p.issue].type === "error" ? "decoration-danger" : feedback.issues[p.issue].type === "unnatural" ? "decoration-warning" : "decoration-accent",
              active === p.issue && "bg-primary-bg")}>{p.text}</button>
        ))}
      </div>

      <div>
        <p className="font-semibold mb-2">{t.writing.issues}</p>
        {feedback.issues.length === 0 ? <Notice tone="success">{t.writing.noIssues}</Notice> : (
          <ul className="flex flex-col gap-2">
            {feedback.issues.map((iss, i) => (
              <li key={i}>
                <button type="button" onClick={() => setActive(active === i ? null : i)} aria-expanded={active === i}
                  className={cn("w-full text-start rounded-2xl border p-3", active === i ? "border-primary bg-primary-bg" : "border-border bg-card")}>
                  <div className="flex items-center gap-2 mb-1"><Badge tone={TYPE_TONE[iss.type]}>{t.writing.categories[iss.type]}</Badge><span className="text-xs text-muted">{iss.category}</span></div>
                  <div dir="ltr" lang="en" className="en-block"><span className="line-through text-muted">{iss.original}</span> → <span className="font-semibold">{iss.suggestion}</span></div>
                  {active === i && <p className="mt-2 text-sm leading-relaxed">{iss.explanation}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {feedback.follow_up && (
        <div className="rounded-2xl border border-border p-4">
          <p className="font-semibold">{t.writing.followUp}</p>
          <p className="mt-1">{feedback.follow_up.instruction}</p>
          <En block className="text-muted mt-1">{feedback.follow_up.example}</En>
        </div>
      )}
    </div>
  );
}
