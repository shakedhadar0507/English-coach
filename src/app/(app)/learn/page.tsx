import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/server/session";
import { learningPath } from "@/lib/server/services/curriculum";
import { withUser } from "@/lib/server/db";
import { getProfile } from "@/lib/server/repo/user";
import { getT } from "@/lib/server/locale";
import { Badge, Card, Notice, PageHeader, ProgressBar } from "@/components/ui";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function LearnPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const [units, profile] = await Promise.all([learningPath(user.id), withUser(user.id, getProfile)]);
  const he = locale === "he";

  return (
    <div>
      <PageHeader title={t.learn.title} subtitle={t.learn.subtitle} />
      <Notice className="mb-5">{t.learn.coverageNote}</Notice>
      <div className="flex flex-col gap-6">
        {LEVELS.map((lvl) => {
          const list = units.filter((u) => u.level === lvl);
          if (!list.length) return null;
          return (
            <section key={lvl} id={lvl} aria-labelledby={`lvl-${lvl}`}>
              <h2 id={`lvl-${lvl}`} className="flex items-center gap-2 font-bold mb-3">
                <span dir="ltr" className="text-primary">{lvl}</span>
                {profile.current_level === lvl && <Badge tone="primary">{t.settings.level}</Badge>}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((u) => {
                  const pct = u.lessons ? u.completed / u.lessons : 0;
                  const done = u.lessons > 0 && u.completed >= u.lessons;
                  return (
                    <Link key={u.id} href={`/learn/${u.slug}`} className="block">
                      <Card className="hover:border-primary transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-muted">{he ? u.course_title_he : u.course_title_en}</p>
                            <p className="font-semibold">{he ? u.title_he : u.title_en}</p>
                          </div>
                          {done ? <CheckCircle2 className="text-success shrink-0" aria-label={t.learn.completed} />
                            : <Badge tone={u.started ? "warning" : "neutral"}>{u.started ? t.learn.inProgress : t.learn.notStarted}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <ProgressBar value={pct} label={he ? u.title_he : u.title_en} />
                          <span className="text-xs text-muted tabular-nums shrink-0">{u.completed}/{u.lessons}</span>
                        </div>
                        {!u.prereqsMet && !u.started && <p className="text-xs text-muted mt-2">{t.learn.locked}</p>}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
