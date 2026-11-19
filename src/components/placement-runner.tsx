"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { ExerciseView, type ExerciseResponse, type PublicExercise } from "./exercise-view";
import { Badge, Button, Card, Notice, ProgressBar, Spinner } from "./ui";
import type { Accent } from "@/lib/client/speech";
import type { PlacementResult } from "@/lib/learning/placement";

interface Item { id: string; skill: string; level: string; type: string; prompt: Record<string, unknown>; listening?: { segments: { speaker: string; text: string }[]; accent: string } }
type StartRes = { assessmentId: string; answered: number; next: Item | null };
type AnswerRes = { done: false; answered: number; next: Item } | { done: true; answered: number; result: PlacementResult };

const MAX_ITEMS = 30;

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** Runs one adaptive placement test against the server. No answer feedback is shown during the test. */
export function PlacementRunner({ accent, voiceRate, onDone }: { accent: Accent; voiceRate: number; onDone: (r: PlacementResult) => void }) {
  const { t } = useI18n();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [answered, setAnswered] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    post<StartRes>("/api/placement/start", {})
      .then((d) => { setAssessmentId(d.assessmentId); setAnswered(d.answered); setItem(d.next); if (!d.next) setError(true); })
      .catch(() => setError(true));
  }, []);

  async function submit(r: ExerciseResponse) {
    if (!item || !assessmentId) return null;
    const d = await post<AnswerRes>("/api/placement/answer", { assessmentId, itemId: item.id, response: r });
    setAnswered(d.answered);
    if (d.done) onDone(d.result);
    else setItem(d.next);
    return null;
  }

  if (error) return <Notice tone="danger">{t.common.error}</Notice>;
  if (!item) return <div className="flex justify-center py-16"><Spinner label={t.common.loading} /></div>;
  const ex: PublicExercise = { id: item.id, type: item.type, skill: item.skill, prompt: item.prompt };
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between text-sm text-muted mb-1.5">
          <span>{t.placement.question} {answered + 1}</span>
          <Badge>{t.placement.skill[item.skill as keyof typeof t.placement.skill]}</Badge>
        </div>
        <ProgressBar value={Math.min(answered / MAX_ITEMS, 0.97)} label={t.placement.progressLabel} />
      </div>
      <Card>
        <ExerciseView key={item.id} exercise={ex} mode="test" accent={(item.listening?.accent as Accent) ?? accent} voiceRate={voiceRate}
          listening={item.listening ? { segments: item.listening.segments, accent: item.listening.accent as Accent } : undefined}
          onSubmit={submit} onContinue={() => {}} />
      </Card>
    </div>
  );
}

export function PlacementResultView({ result, children }: { result: PlacementResult; children?: React.ReactNode }) {
  const { t } = useI18n();
  const o = result.overall;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm text-muted">{t.placement.estimated}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-5xl font-extrabold text-primary" dir="ltr">{o.level}</span>
          <Badge tone={o.confidence === "high" ? "success" : o.confidence === "medium" ? "primary" : "warning"}>
            {o.confidence ? t.placement.confidence[o.confidence] : t.placement.insufficient}
          </Badge>
        </div>
        {o.range[0] !== o.range[1] && <p className="text-sm text-muted mt-2" dir="ltr">{o.range[0]}–{o.range[1]}</p>}
        <p className="text-sm text-muted mt-2">{o.n} {t.placement.answered} · {t.placement.accuracy} {Math.round(o.accuracy * 100)}%</p>
      </Card>
      <Card>
        <ul className="grid grid-cols-2 gap-3">
          {Object.entries(result.skills).map(([skill, s]) => (
            <li key={skill} className="rounded-xl bg-surface p-3">
              <p className="text-sm text-muted">{t.placement.skill[skill as keyof typeof t.placement.skill]}</p>
              <p className="text-xl font-bold" dir="ltr">{s.level ?? "—"}</p>
              <p className="text-xs text-muted">{s.confidence ? t.placement.confidence[s.confidence] : t.placement.insufficient} · {s.n}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted mt-3">{t.placement.speakingNote}</p>
      </Card>
      <Notice>{t.placement.disclaimer}</Notice>
      {children}
    </div>
  );
}

export const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1"] as const;

export function LevelPicker({ value, onChange }: { value: string | null; onChange: (l: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t.common.level}>
      {LEVEL_OPTIONS.map((l) => (
        <Button key={l} type="button" role="radio" aria-checked={value === l} variant={value === l ? "primary" : "secondary"} className="px-0" onClick={() => onChange(l)}>
          <span dir="ltr">{l}</span>
        </Button>
      ))}
    </div>
  );
}
