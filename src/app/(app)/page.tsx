import Link from "next/link";
import { BookOpen, Brain, CheckCircle2, Circle, Flame, Headphones, Mic, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/server/session";
import { getTodayPlan } from "@/lib/server/services/plan";
import { homeStats } from "@/lib/server/services/stats";
import { withUser } from "@/lib/server/db";
import { getProfile } from "@/lib/server/repo/user";
import { getT } from "@/lib/server/locale";
import { planItemHref } from "@/lib/shared/plan-links";
import { Badge, ButtonLink, Card, ProgressBar, Stat } from "@/components/ui";

const ICONS: Record<string, typeof BookOpen> = {
  lesson: BookOpen, vocab_review: RotateCcw, vocab_new: Sparkles, error_review: Brain, writing: PenLine, speaking: Mic, listening: Headphones,
};

export default async function HomePage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const [plan, stats, profile] = await Promise.all([getTodayPlan(user.id), homeStats(user.id), withUser(user.id, getProfile)]);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: stats.timezone }).format(new Date()));
  const greeting = hour < 12 ? t.home.greetingMorning : hour < 18 ? t.home.greetingDay : t.home.greetingEvening;

  const items = plan?.items ?? [];
  const done = items.filter((i) => i.status === "completed" || i.status === "skipped").length;
  const nextItem = items.find((i) => i.status !== "completed" && i.status !== "skipped");
  const totalMin = items.reduce((s, i) => s + i.estimated_minutes, 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-muted">{greeting}</p>
          <h1 className="text-2xl font-bold">{t.home.todayPlan}</h1>
        </div>
        {profile.current_level && <Badge tone="primary"><span dir="ltr">{profile.current_level}</span></Badge>}
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t.home.streak} value={<span className="inline-flex items-center gap-1"><Flame size={20} className="text-warning" />{stats.streak.current}</span>} />
        <Stat label={t.home.dueReviews} value={stats.dueReviews} />
        <Stat label={t.home.minutesToday} value={stats.minutesToday} />
      </div>

      {!plan ? (
        <Card><p className="text-muted">{t.home.noPlanYet}</p></Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{t.home.planMinutes.replace("{n}", String(totalMin))}</span>
            <span className="tabular-nums">{done}/{items.length}</span>
          </div>
          <ProgressBar value={items.length ? done / items.length : 0} label={t.home.todayPlan} />
          <ol className="flex flex-col gap-2">
            {items.map((it) => {
              const Icon = ICONS[it.kind] ?? BookOpen;
              const complete = it.status === "completed";
              const title = it.kind === "lesson" ? (locale === "he" ? it.lesson_title_he : it.lesson_title_en) ?? t.home.items.lesson : t.home.items[it.kind as keyof typeof t.home.items];
              const reason = t.home.reasons[it.payload.reason as keyof typeof t.home.reasons];
              return (
                <li key={it.id}>
                  <Link href={planItemHref(it)} className={`flex items-center gap-3 rounded-xl border p-3 ${complete ? "border-border opacity-70" : "border-border hover:border-primary"} ${it.id === nextItem?.id ? "bg-primary-bg border-primary" : "bg-surface"}`}>
                    <span className="grid place-items-center h-10 w-10 rounded-full bg-card shrink-0"><Icon size={20} className="text-primary" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{title}</span>
                      <span className="block text-xs text-muted">{it.kind === "lesson" ? t.home.items.lesson + " · " : ""}{it.estimated_minutes} {t.common.min}{reason ? ` · ${reason}` : ""}</span>
                    </span>
                    {complete ? <CheckCircle2 size={22} className="text-success shrink-0" aria-label={t.common.done} /> : <Circle size={22} className="text-border shrink-0" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ol>
          {nextItem ? (
            <ButtonLink href={planItemHref(nextItem)} className="w-full">{done ? t.home.continuePlan : t.home.startPlan}</ButtonLink>
          ) : (
            <p className="text-center font-semibold text-success">{t.home.planDone}</p>
          )}
        </Card>
      )}

      <section>
        <h2 className="font-bold mb-3">{t.home.extra}</h2>
        <div className="grid grid-cols-2 gap-3">
          <ExtraLink href="/practice/vocabulary/review" icon={<RotateCcw size={20} />} label={t.home.items.vocab_review} />
          <ExtraLink href="/speak" icon={<Mic size={20} />} label={t.home.items.speaking} />
          <ExtraLink href="/practice/listening" icon={<Headphones size={20} />} label={t.home.items.listening} />
          <ExtraLink href="/practice/writing" icon={<PenLine size={20} />} label={t.home.items.writing} />
        </div>
      </section>
    </div>
  );
}

function ExtraLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 font-medium hover:border-primary">
      <span className="text-primary">{icon}</span>{label}
    </Link>
  );
}
