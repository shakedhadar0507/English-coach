"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Pause } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { ExerciseView, type ExerciseResponse, type Feedback, type PublicExercise, type ListeningData } from "@/components/exercise-view";
import { WritingTask } from "@/components/writing-task";
import { Badge, Button, ButtonLink, Card, En, Notice, ProgressBar } from "@/components/ui";
import { cacheSet, postOrQueue } from "@/lib/client/offline-queue";
import { gradeOffline, type OfflineKey } from "@/lib/client/offline-grade";
import { newId, useActiveTime } from "@/lib/client/use-active-time";
import type { Accent } from "@/lib/client/speech";

interface LessonData {
  lesson: { id: string; slug: string; kind: string; title_en: string; title_he: string; intro_en: string; intro_he: string; estimated_minutes: number; unit_slug: string; unit_title_en: string; unit_title_he: string; level: string };
  exercises: (PublicExercise & { listening?: ListeningData; offlineKey: OfflineKey | null })[];
  session: { id: string; position: number } | null;
  prefs: { accent: Accent; voice_rate: number };
}

type Phase = "intro" | "exercise" | "summary";

export function LessonPlayer({ data, planItemId }: { data: LessonData; planItemId: string | null }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { lesson, exercises, prefs } = data;
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(data.session?.id ?? null);
  const [index, setIndex] = useState(Math.min(data.session?.position ?? 0, exercises.length - 1));
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<{ accuracy: number; activeSeconds: number; exercises: number; total: number; complete: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(Date.now());
  const active = useActiveTime();
  const title = locale === "he" ? lesson.title_he : lesson.title_en;
  const ex = exercises[index];

  useEffect(() => { cacheSet(`lesson:${lesson.slug}`, data); }, [data, lesson.slug]);

  async function start() {
    setError(null);
    const res = await postOrQueue<{ sessionId: string; position: number }>("/api/sessions/start", { lessonId: lesson.id, planItemId }, newId("s"));
    if (res.ok) { setSessionId(res.data.sessionId); setIndex(Math.min(res.data.position, exercises.length - 1)); }
    setPhase("exercise");
    started.current = Date.now();
  }

  async function saveProgress(position: number, pause = false) {
    if (!sessionId) return;
    await postOrQueue("/api/sessions/progress", { sessionId, position, activeSeconds: active.take(), pause }, newId("p"));
  }

  async function submit(r: ExerciseResponse, selfAssessed?: boolean): Promise<Feedback | null> {
    const clientAttemptId = newId("a");
    const body = { exerciseId: ex.id, sessionId, clientAttemptId, response: r, durationMs: Date.now() - started.current, ...(selfAssessed !== undefined ? { selfAssessed } : {}) };
    const res = await postOrQueue<{ recorded: boolean; feedback: Feedback }>("/api/exercises/submit", body, clientAttemptId);
    if (res.ok) {
      if (res.data.recorded && !(ex.id in results)) setResults((m) => ({ ...m, [ex.id]: res.data.feedback.isCorrect }));
      return res.data.feedback;
    }
    if (res.queued) {
      const fb = await gradeOffline(ex.id, ex.offlineKey, r);
      if (fb && !(ex.id in results)) setResults((m) => ({ ...m, [ex.id]: fb.isCorrect }));
      return fb ?? { verdict: "needs_review", isCorrect: false, queued: true };
    }
    throw new Error(res.error ?? "submit_failed");
  }

  async function next(retry?: boolean) {
    if (retry) { setAttempt((a) => a + 1); started.current = Date.now(); return; }
    setAttempt(0);
    started.current = Date.now();
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      saveProgress(index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await finish();
    }
  }

  async function finish() {
    if (!sessionId) {
      const vals = Object.values(results);
      setSummary({ accuracy: vals.length ? vals.filter(Boolean).length / vals.length : 0, activeSeconds: active.take(), exercises: vals.length, total: exercises.length, complete: false });
      setPhase("summary");
      return;
    }
    const res = await postOrQueue<{ accuracy: number; activeSeconds: number; exercises: number; total: number; complete: boolean }>(
      "/api/sessions/complete", { sessionId, activeSeconds: active.take() }, newId("c"));
    if (res.ok) setSummary(res.data);
    else {
      const vals = Object.values(results);
      setSummary({ accuracy: vals.length ? vals.filter(Boolean).length / vals.length : 0, activeSeconds: 0, exercises: vals.length, total: exercises.length, complete: false });
    }
    setPhase("summary");
    router.refresh();
  }

  async function pause() {
    await saveProgress(index, true);
    router.push("/");
  }

  if (phase === "intro") {
    const intro = locale === "he" ? lesson.intro_he : lesson.intro_en;
    return (
      <div className="flex flex-col gap-5 pt-2">
        <Link href={`/learn/${lesson.unit_slug}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          {locale === "he" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {locale === "he" ? lesson.unit_title_he : lesson.unit_title_en}
        </Link>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2"><Badge tone="primary">{t.learn.lessonKinds[lesson.kind as keyof typeof t.learn.lessonKinds]}</Badge><Badge>{lesson.level}</Badge><Badge>{lesson.estimated_minutes} {t.common.min}</Badge></div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {locale === "he" && <En block className="text-muted -mt-2">{lesson.title_en}</En>}
          {intro && <p className="leading-relaxed">{intro}</p>}
          <p className="text-sm text-muted">{exercises.length} {t.player.exercisesDone}</p>
          {error && <Notice tone="danger">{error}</Notice>}
          {exercises.length === 0 ? <Notice tone="warning">{t.common.empty}</Notice> : <Button block onClick={start}>{data.session && data.session.position > 0 ? t.common.resume : t.common.start}</Button>}
        </Card>
      </div>
    );
  }

  if (phase === "summary" && summary) {
    const mins = Math.max(1, Math.round(summary.activeSeconds / 60));
    return (
      <Card className="flex flex-col gap-5 items-center text-center mt-4 animate-pop">
        <h1 className="text-2xl font-bold">{t.player.sessionSummary}</h1>
        <div className="grid grid-cols-3 gap-3 w-full">
          <div><div className="text-3xl font-bold tabular-nums">{Math.round(summary.accuracy * 100)}%</div><div className="text-sm text-muted">{t.player.accuracy}</div></div>
          <div><div className="text-3xl font-bold tabular-nums">{summary.exercises}/{summary.total}</div><div className="text-sm text-muted">{t.player.exercisesDone}</div></div>
          <div><div className="text-3xl font-bold tabular-nums">{mins}</div><div className="text-sm text-muted">{t.player.timeSpent} ({t.common.min})</div></div>
        </div>
        {!summary.complete && <Notice tone="warning">{t.player.paused}</Notice>}
        <div className="flex flex-col gap-2 w-full">
          <ButtonLink href="/" block>{t.common.continue}</ButtonLink>
          <ButtonLink href={`/learn/${lesson.unit_slug}`} variant="secondary" block>{locale === "he" ? lesson.unit_title_he : lesson.unit_title_en}</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={pause} aria-label={t.player.pause} className="px-2 min-h-10"><Pause size={20} /></Button>
        <ProgressBar value={index / exercises.length} label={t.placement.progressLabel} />
        <span className="text-sm text-muted tabular-nums whitespace-nowrap">{index + 1}/{exercises.length}</span>
      </div>
      {ex.type === "free_writing" ? (
        <WritingTask key={ex.id} exerciseId={ex.id} sessionId={sessionId} prompt={ex.prompt as { task_en: string; task_he: string; min_words: number; max_words: number }} onDone={() => next(false)} />
      ) : (
        <ExerciseView key={`${ex.id}:${attempt}`} exercise={ex} listening={ex.listening} accent={prefs.accent} voiceRate={prefs.voice_rate}
          mode="lesson" attempt={attempt} onSubmit={(r) => submit(r)} onSelfAssess={async (c, r) => { await submit(r, c); }} onContinue={next} />
      )}
    </div>
  );
}
