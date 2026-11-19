"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Button, Card, Notice, ProgressBar } from "@/components/ui";
import { LevelPicker, PlacementResultView, PlacementRunner } from "@/components/placement-runner";
import type { Accent } from "@/lib/client/speech";
import type { PlacementResult } from "@/lib/learning/placement";

const GOALS = ["everyday", "business", "academic", "travel", "job_interviews", "presentations", "general_fluency"] as const;
const ACCENTS = ["american", "british", "australian"] as const;
const MINUTES = [10, 15, 20, 30, 45];
const STEPS = ["welcome", "language", "goals", "accent", "placement", "test", "result", "manual"] as const;
type Step = (typeof STEPS)[number];

interface Initial { locale: "he" | "en"; accent: Accent; minutes: number; voiceRate: number; goals: string[]; level: string | null }

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export function OnboardingWizard({ initial }: { initial: Initial }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [goals, setGoals] = useState<string[]>(initial.goals);
  const [accent, setAccent] = useState<Accent>(initial.accent);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [level, setLevel] = useState<string | null>(initial.level);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const Back = locale === "he" ? ArrowRight : ArrowLeft;
  const progress = { welcome: 0, language: 0.15, goals: 0.3, accent: 0.45, placement: 0.6, test: 0.7, result: 0.9, manual: 0.9 }[step];

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(false);
    try { await fn(); } catch { setError(true); } finally { setBusy(false); }
  }

  const chooseLocale = (l: "he" | "en") => run(async () => { await post("/api/preferences", { locale: l }); router.refresh(); setStep("goals"); });
  const saveGoals = () => run(async () => { await post("/api/goals", { goals }); setStep("accent"); });
  const savePrefs = () => run(async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await post("/api/preferences", { accent, daily_minutes: minutes, ...(timezone ? { timezone } : {}) });
    setStep("placement");
  });
  const finish = (manualLevel?: string) => run(async () => {
    if (manualLevel) await post("/api/level", { level: manualLevel });
    await post("/api/onboarding/complete", {});
    router.replace("/");
    router.refresh();
  });

  const toggleGoal = (g: string) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  const back = (s: Step) => <Button variant="ghost" onClick={() => setStep(s)} className="px-3"><Back size={18} /> {t.common.back}</Button>;

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar value={progress} label={t.onboarding.welcomeTitle} />
      {error && <Notice tone="danger">{t.common.error}</Notice>}

      {step === "welcome" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{t.onboarding.welcomeTitle}</h1>
          <p className="text-muted leading-relaxed">{t.onboarding.welcomeBody}</p>
          <Button onClick={() => setStep("language")} block>{t.common.start}</Button>
        </Card>
      )}

      {step === "language" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{t.onboarding.languageTitle}</h1>
          <p className="text-sm text-muted">{t.onboarding.languageHint}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant={locale === "he" ? "primary" : "secondary"} disabled={busy} onClick={() => chooseLocale("he")} lang="he">עברית</Button>
            <Button variant={locale === "en" ? "primary" : "secondary"} disabled={busy} onClick={() => chooseLocale("en")} lang="en">English</Button>
          </div>
          {back("welcome")}
        </Card>
      )}

      {step === "goals" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{t.onboarding.goalsTitle}</h1>
          <p className="text-sm text-muted">{t.onboarding.goalsHint}</p>
          <ul className="grid gap-2">
            {GOALS.map((g) => {
              const idx = goals.indexOf(g);
              return (
                <li key={g}>
                  <button type="button" aria-pressed={idx >= 0} onClick={() => toggleGoal(g)}
                    className={`w-full min-h-12 flex items-center justify-between rounded-xl border px-4 text-start ${idx >= 0 ? "border-primary bg-primary-bg" : "border-border bg-surface"}`}>
                    <span>{t.goals[g]}</span>
                    {idx >= 0 && <span className="h-7 w-7 rounded-full bg-primary text-on-primary grid place-items-center text-sm font-bold">{idx + 1}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">{back("language")}<Button className="flex-1" disabled={!goals.length || busy} onClick={saveGoals}>{t.common.continue}</Button></div>
        </Card>
      )}

      {step === "accent" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{t.onboarding.accentTitle}</h1>
          <p className="text-sm text-muted">{t.onboarding.accentHint}</p>
          <div className="grid grid-cols-3 gap-2">
            {ACCENTS.map((a) => <Button key={a} variant={accent === a ? "primary" : "secondary"} aria-pressed={accent === a} className="px-2" onClick={() => setAccent(a)}>{t.accents[a]}</Button>)}
          </div>
          <h2 className="font-bold mt-2">{t.onboarding.minutesTitle}</h2>
          <div className="grid grid-cols-5 gap-2">
            {MINUTES.map((m) => <Button key={m} variant={minutes === m ? "primary" : "secondary"} aria-pressed={minutes === m} className="px-0 tabular-nums" onClick={() => setMinutes(m)}>{m}</Button>)}
          </div>
          <div className="flex gap-2">{back("goals")}<Button className="flex-1" disabled={busy} onClick={savePrefs}>{t.common.continue}</Button></div>
        </Card>
      )}

      {step === "placement" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{t.onboarding.placementTitle}</h1>
          <p className="text-muted leading-relaxed">{t.onboarding.placementBody}</p>
          <Button onClick={() => setStep("test")} block>{t.onboarding.placementStart}</Button>
          <Button variant="ghost" onClick={() => setStep("manual")} block>{t.onboarding.placementSkip}</Button>
          {back("accent")}
        </Card>
      )}

      {step === "test" && <PlacementRunner accent={accent} voiceRate={initial.voiceRate} onDone={(r) => { setResult(r); setLevel(r.overall.level); setStep("result"); }} />}

      {step === "result" && result && (
        <PlacementResultView result={result}>
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-muted">{t.placement.adjust}</p>
            <LevelPicker value={level} onChange={setLevel} />
            <Button block disabled={busy || !level} onClick={() => finish(level !== result.overall.level ? level! : undefined)}><Check size={18} /> {t.onboarding.finish}</Button>
          </Card>
        </PlacementResultView>
      )}

      {step === "manual" && (
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{t.onboarding.manualLevelTitle}</h1>
          <LevelPicker value={level} onChange={setLevel} />
          <div className="flex gap-2">{back("placement")}<Button className="flex-1" disabled={busy || !level} onClick={() => finish(level!)}>{t.onboarding.finish}</Button></div>
        </Card>
      )}
    </div>
  );
}
