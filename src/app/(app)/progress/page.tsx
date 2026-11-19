import Link from "next/link";
import { requireUser } from "@/lib/server/session";
import { progressStats } from "@/lib/server/services/stats";
import { getT } from "@/lib/server/locale";
import { fmt } from "@/i18n";
import { Badge, Card, En, Notice, PageHeader, ProgressBar, Stat } from "@/components/ui";

function addDays(day: string, n: number) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

export default async function ProgressPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const s = await progressStats(user.id);
  const hours = (sec: number) => (sec >= 3600 ? `${(sec / 3600).toFixed(1)} h` : `${Math.round(sec / 60)} ${t.common.min}`);
  const byDay = new Map(s.days.map((d) => [d.day, d]));
  const last28 = Array.from({ length: 28 }, (_, i) => addDays(s.today, i - 27));
  const maxItems = Math.max(1, ...last28.map((d) => byDay.get(d)?.items ?? 0));
  const hasData = s.days.length > 0;
  const weekDays = (offset: number) => Array.from({ length: 7 }, (_, i) => addDays(s.today, -i - offset * 7));
  const sum = (days: string[], k: "items" | "seconds") => days.reduce((a, d) => a + (byDay.get(d)?.[k] ?? 0), 0);
  const dfmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.progress.title} />
      {!hasData && <Notice>{t.progress.noData}</Notice>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={t.progress.streak} value={s.streak.current} />
        <Stat label={t.progress.bestStreak} value={s.streak.best} />
        <Stat label={t.progress.activeDays} value={s.activeDays} />
        <Stat label={t.progress.totalTime} value={hours(s.totalSeconds)} />
      </div>

      <Card>
        <h2 className="font-bold mb-3">{t.progress.activity}</h2>
        <div className="flex items-end gap-1 h-24" role="img" aria-label={t.progress.activity}>
          {last28.map((d) => {
            const v = byDay.get(d)?.items ?? 0;
            return <div key={d} title={`${dfmt.format(new Date(`${d}T12:00:00Z`))}: ${v}`} className={`flex-1 rounded-t ${v ? "bg-primary" : "bg-border"}`} style={{ height: `${Math.max(4, (v / maxItems) * 100)}%` }} />;
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div><p className="text-muted">{t.progress.weekly}</p><p className="font-semibold tabular-nums">{sum(weekDays(0), "items")} {t.player.exercisesDone} · {hours(sum(weekDays(0), "seconds"))}</p></div>
          <div><p className="text-muted">{t.progress.monthly}</p><p className="font-semibold tabular-nums">{sum(last28, "items")} {t.player.exercisesDone} · {hours(sum(last28, "seconds"))}</p></div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">{t.progress.estimatedLevel}</h2>
          <Link href="/placement" className="text-sm text-primary">{t.progress.assessments}</Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold text-primary" dir="ltr">{s.profile.current_level ?? "—"}</span>
          {s.profile.level_source && <span className="text-sm text-muted">{t.settings.levelSource[s.profile.level_source as keyof typeof t.settings.levelSource]}</span>}
          {s.assessment?.overall_confidence && <Badge>{t.placement.confidence[s.assessment.overall_confidence as keyof typeof t.placement.confidence]}</Badge>}
        </div>
        <p className="text-xs text-muted mt-2">{t.progress.note}</p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label={t.progress.lessonsDone} value={s.lessonsDone} />
        <Stat label={t.progress.vocabEncountered} value={s.vocab.total} />
        <Stat label={t.progress.vocabRetained} value={s.vocab.retained} hint={t.progress.retainedHelp} />
        <Stat label={t.progress.vocabDue} value={s.vocab.due} />
        <Stat label={t.progress.grammarDone} value={s.grammarTopics} />
        <Stat label={t.progress.writingCount} value={s.writingCount} />
        <Stat label={t.progress.speakingTime} value={hours(s.speakingSeconds)} />
        <Stat label={t.progress.listeningCount} value={s.listeningCount} />
      </div>

      {s.bySkill.length > 0 && (
        <Card>
          <h2 className="font-bold mb-3">{t.progress.bySkill} · {t.progress.accuracy}</h2>
          <ul className="flex flex-col gap-3">
            {s.bySkill.map((b) => (
              <li key={b.skill}>
                <div className="flex justify-between text-sm mb-1"><span>{t.placement.skill[b.skill as keyof typeof t.placement.skill] ?? b.skill}</span><span className="tabular-nums text-muted">{Math.round(b.accuracy * 100)}% · {b.n}</span></div>
                <ProgressBar value={b.accuracy} label={b.skill} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s.errors.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">{t.progress.recurringErrors}</h2>
            <Link href="/practice/errors" className="text-sm text-primary">{t.common.seeAll}</Link>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {s.errors.map((e: { id: string; category: string; example_wrong: string | null; example_right: string | null; occurrences: number }) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{e.example_wrong ? <En className="line-through text-danger">{e.example_wrong}</En> : e.category}{e.example_right && <> → <En className="text-success">{e.example_right}</En></>}</span>
                <Badge tone="warning">{fmt(t.progress.errorCount, { n: e.occurrences })}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="font-bold mb-2">{t.progress.aiCosts}</h2>
        <p className="tabular-nums text-lg font-semibold" dir="ltr">${s.ai.spent.toFixed(4)} / ${s.ai.budget.toFixed(2)}</p>
        <ProgressBar value={s.ai.budget ? s.ai.spent / s.ai.budget : 0} label={t.progress.aiCosts} className="mt-2" />
        <p className="text-xs text-muted mt-2">{s.ai.requests} · {t.settings.aiNote}</p>
      </Card>
    </div>
  );
}
