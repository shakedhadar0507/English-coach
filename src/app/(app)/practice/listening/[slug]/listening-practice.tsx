"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { ListeningPlayer, type GlossaryEntry, type Segment } from "@/components/listening-player";
import { ExerciseView, type ExerciseResponse, type Feedback, type PublicExercise } from "@/components/exercise-view";
import { Card, Notice } from "@/components/ui";
import { postOrQueue } from "@/lib/client/offline-queue";
import { gradeOffline, type OfflineKey } from "@/lib/client/offline-grade";
import { newId } from "@/lib/client/use-active-time";
import type { Accent } from "@/lib/client/speech";

type Ex = PublicExercise & { offlineKey: OfflineKey | null };

export function ListeningPractice({ material, exercises, voiceRate }: { material: { segments: Segment[]; glossary: GlossaryEntry[]; accent: Accent }; exercises: Ex[]; voiceRate: number }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const ex = exercises[index];

  async function saveWord(term: string) {
    const glossary = material.glossary.find((g) => g.term === term);
    const res = await postOrQueue("/api/vocab/save", { term, he: glossary?.he }, newId("sv"));
    setSavedMsg(res.ok || res.queued ? `${term} · ${t.vocab.saved}` : t.common.error);
  }

  async function submit(r: ExerciseResponse, selfAssessed?: boolean): Promise<Feedback | null> {
    const clientAttemptId = newId("a");
    const res = await postOrQueue<{ recorded: boolean; feedback: Feedback }>("/api/exercises/submit",
      { exerciseId: ex.id, clientAttemptId, response: r, ...(selfAssessed !== undefined ? { selfAssessed } : {}) }, clientAttemptId);
    if (res.ok) return res.data.feedback;
    if (res.queued) return (await gradeOffline(ex.id, ex.offlineKey, r)) ?? { verdict: "needs_review", isCorrect: false, queued: true };
    throw new Error("submit_failed");
  }

  return (
    <>
      <Card>
        <ListeningPlayer segments={material.segments} accent={material.accent} defaultRate={voiceRate} glossary={material.glossary} onSaveWord={saveWord} />
        {savedMsg && <Notice tone="success" className="mt-3">{savedMsg}</Notice>}
      </Card>
      {ex && (
        <Card>
          <p className="text-sm text-muted mb-3">{t.listening.questions} · {index + 1}/{exercises.length}</p>
          <ExerciseView key={`${ex.id}:${attempt}`} exercise={ex} mode="lesson" attempt={attempt} accent={material.accent} voiceRate={voiceRate}
            listening={ex.type === "dictation" ? { segments: material.segments, accent: material.accent } : undefined}
            onSubmit={(r) => submit(r)} onSelfAssess={async (c, r) => { await submit(r, c); }}
            onContinue={(retry) => { if (retry) setAttempt((a) => a + 1); else { setAttempt(0); setIndex((i) => i + 1); } }} />
        </Card>
      )}
      {!ex && exercises.length > 0 && <Notice tone="success">{t.common.done}</Notice>}
    </>
  );
}
