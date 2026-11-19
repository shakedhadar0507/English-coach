"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { Badge, Button, Card, Notice } from "@/components/ui";
import { LevelPicker, PlacementResultView, PlacementRunner } from "@/components/placement-runner";
import type { Accent } from "@/lib/client/speech";
import type { PlacementResult } from "@/lib/learning/placement";

interface Row { id: string; level: string; confidence: string | null; answered: number; date: string }

export function PlacementCenter({ accent, voiceRate, currentLevel, levelSource, history }: { accent: Accent; voiceRate: number; currentLevel: string | null; levelSource: string | null; history: Row[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "test" | "result">("idle");
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [level, setLevel] = useState(currentLevel);
  const [msg, setMsg] = useState<"saved" | "error" | null>(null);

  async function saveLevel() {
    const res = await fetch("/api/level", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ level }) }).catch(() => null);
    setMsg(res?.ok ? "saved" : "error");
    if (res?.ok) router.refresh();
  }

  if (mode === "test") return <PlacementRunner accent={accent} voiceRate={voiceRate} onDone={(r) => { setResult(r); setLevel(r.overall.level); setMode("result"); router.refresh(); }} />;

  return (
    <div className="flex flex-col gap-4">
      {mode === "result" && result && <PlacementResultView result={result} />}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">{t.settings.level}</span>
          {currentLevel && <Badge tone="primary"><span dir="ltr">{currentLevel}</span></Badge>}
          {levelSource && <span className="text-xs text-muted">{t.settings.levelSource[levelSource as keyof typeof t.settings.levelSource]}</span>}
        </div>
        <p className="text-sm text-muted">{t.placement.adjust}</p>
        <LevelPicker value={level} onChange={(l) => { setLevel(l); setMsg(null); }} />
        <Button variant="secondary" disabled={!level || level === currentLevel} onClick={saveLevel}>{t.placement.useLevel}</Button>
        {msg && <Notice tone={msg === "saved" ? "success" : "danger"}>{msg === "saved" ? t.common.saved : t.common.error}</Notice>}
      </Card>
      <Button onClick={() => setMode("test")} block>{history.length ? t.placement.retake : t.onboarding.placementStart}</Button>
      {history.length > 0 && (
        <Card>
          <h2 className="font-bold mb-3">{t.placement.history}</h2>
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span>{h.date}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted">{h.answered} {t.placement.answered}</span>
                  <Badge><span dir="ltr">{h.level}</span></Badge>
                  {h.confidence && <span className="text-xs text-muted">{t.placement.confidence[h.confidence as keyof typeof t.placement.confidence]}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
