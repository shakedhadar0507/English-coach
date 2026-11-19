"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { Badge, Button, Card, En, EmptyState, Notice } from "@/components/ui";
import { ExerciseView, type ExerciseResponse, type Feedback, type PublicExercise } from "@/components/exercise-view";
import { postOrQueue } from "@/lib/client/offline-queue";
import { gradeOffline, type OfflineKey } from "@/lib/client/offline-grade";
import { newId } from "@/lib/client/use-active-time";
import type { Accent } from "@/lib/client/speech";

interface Err { id: string; category: string; pattern: string; example_wrong: string | null; example_right: string | null; explanation: string | null; occurrences: number; grammar_slug: string | null; grammar_title_en: string | null; grammar_title_he: string | null }
type Ex = PublicExercise & { offlineKey: OfflineKey | null };

export function ErrorsCenter({ errors, exercises, planItemId, accent, voiceRate }: { errors: Err[]; exercises: Ex[]; planItemId: string | null; accent: Accent; voiceRate: number }) {
  const { t, locale } = useI18n();
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [practicing, setPracticing] = useState(false);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const ex = exercises[index];

  async function resolve(id: string) {
    const res = await postOrQueue("/api/errors/resolve", { id }, newId("er"));
    if (res.ok || res.queued) setResolved((s) => new Set(s).add(id));
  }

  async function submit(r: ExerciseResponse, selfAssessed?: boolean): Promise<Feedback | null> {
    const clientAttemptId = newId("a");
    const res = await postOrQueue<{ recorded: boolean; feedback: Feedback }>("/api/exercises/submit",
      { exerciseId: ex.id, clientAttemptId, response: r, ...(selfAssessed !== undefined ? { selfAssessed } : {}) }, clientAttemptId);
    if (res.ok) return res.data.feedback;
    if (res.queued) return (await gradeOffline(ex.id, ex.offlineKey, r)) ?? { verdict: "needs_review", isCorrect: false, queued: true };
    throw new Error("submit_failed");
  }

  function next(retry?: boolean) {
    if (retry) { setAttempt((a) => a + 1); return; }
    setAttempt(0);
    if (index + 1 >= exercises.length && planItemId) postOrQueue("/api/plan/item", { itemId: planItemId }, newId("pi"));
    setIndex((i) => i + 1);
  }

  const visible = errors.filter((e) => !resolved.has(e.id));
  if (!errors.length) return <EmptyState title={t.errors.none} />;

  return (
    <div className="flex flex-col gap-4">
      {exercises.length > 0 && !practicing && <Button block onClick={() => setPracticing(true)}>{t.errors.practice} · {exercises.length}</Button>}
      {exercises.length === 0 && <Notice>{t.errors.noPractice}</Notice>}
      {practicing && (ex ? (
        <Card>
          <p className="text-sm text-muted mb-3">{t.errors.practice} · {index + 1}/{exercises.length}</p>
          <ExerciseView key={`${ex.id}:${attempt}`} exercise={ex} mode="lesson" attempt={attempt} accent={accent} voiceRate={voiceRate}
            onSubmit={(r) => submit(r)} onSelfAssess={async (c, r) => { await submit(r, c); }} onContinue={next} />
        </Card>
      ) : <Notice tone="success">{t.common.done}</Notice>)}

      <ul className="flex flex-col gap-3">
        {visible.map((e) => (
          <li key={e.id}>
            <Card>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold">{e.grammar_slug ? (locale === "he" ? e.grammar_title_he : e.grammar_title_en) : e.category}</span>
                <Badge tone={e.occurrences >= 3 ? "danger" : "warning"}>{fmt(t.errors.times, { n: e.occurrences })}</Badge>
              </div>
              {e.example_wrong && <p className="text-sm"><span className="text-muted">{t.errors.wrong}: </span><En className="line-through text-danger">{e.example_wrong}</En></p>}
              {e.example_right && <p className="text-sm"><span className="text-muted">{t.errors.right}: </span><En className="text-success font-medium">{e.example_right}</En></p>}
              {e.explanation && <p className="text-sm text-muted mt-2">{e.explanation}</p>}
              <div className="flex gap-2 mt-3">
                {e.grammar_slug && <Link href={`/practice/grammar/${e.grammar_slug}`} className="text-sm text-primary font-medium py-2">{t.learn.grammarReference}</Link>}
                <Button variant="ghost" className="ms-auto min-h-9 px-3 text-sm" onClick={() => resolve(e.id)}>{t.errors.markResolved}</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
