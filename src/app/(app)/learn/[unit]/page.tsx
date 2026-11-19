import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { requireUser } from "@/lib/server/session";
import { unitDetail } from "@/lib/server/services/curriculum";
import { getT } from "@/lib/server/locale";
import { Badge, Card, En } from "@/components/ui";

export default async function UnitPage({ params }: PageProps<"/learn/[unit]">) {
  const user = await requireUser();
  const { unit: slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const data = await unitDetail(user.id, slug);
  if (!data) notFound();
  const { t, locale } = await getT();
  const he = locale === "he";
  const { unit, lessons, grammar, vocab, prereqs } = data;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-muted"><Link href="/learn" className="hover:underline">{t.learn.title}</Link> · {he ? unit.course_title_he : unit.course_title_en}</p>
        <h1 className="text-2xl font-bold flex items-center gap-2">{he ? unit.title_he : unit.title_en} <Badge><span dir="ltr">{unit.level}</span></Badge></h1>
        {he && <En className="text-muted">{unit.title_en}</En>}
      </header>

      {unit.objectives.length > 0 && (
        <Card>
          <h2 className="font-bold mb-2">{t.learn.objectives}</h2>
          <ul className="list-disc ps-5 flex flex-col gap-1">
            {unit.objectives.map((o: { en: string; he: string }, i: number) => <li key={i}>{he ? o.he : o.en}</li>)}
          </ul>
        </Card>
      )}

      {prereqs.length > 0 && (
        <p className="text-sm text-muted">{t.learn.prerequisites}: {prereqs.map((p: { slug: string; title_he: string; title_en: string }, i: number) => (
          <span key={p.slug}>{i > 0 && ", "}<Link className="text-primary" href={`/learn/${p.slug}`}>{he ? p.title_he : p.title_en}</Link></span>
        ))}</p>
      )}

      <Card className="p-0">
        <h2 className="font-bold px-4 pt-4 pb-2">{t.learn.lessons}</h2>
        <ol className="divide-y divide-border">
          {lessons.map((l: { id: string; slug: string; kind: string; title_en: string; title_he: string; estimated_minutes: number; status: string; best_accuracy: number | null }) => (
            <li key={l.id}>
              <Link href={`/lesson/${l.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                {l.status === "completed" ? <CheckCircle2 className="text-success shrink-0" size={22} aria-label={t.learn.completed} />
                  : l.status === "in_progress" ? <CircleDot className="text-warning shrink-0" size={22} aria-label={t.learn.inProgress} />
                  : <Circle className="text-border shrink-0" size={22} aria-label={t.learn.notStarted} />}
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{he ? l.title_he : l.title_en}</span>
                  <span className="block text-xs text-muted">{t.learn.lessonKinds[l.kind as keyof typeof t.learn.lessonKinds]} · {l.estimated_minutes} {t.common.min}
                    {l.best_accuracy != null && ` · ${Math.round(l.best_accuracy * 100)}%`}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      {grammar.length > 0 && (
        <Card>
          <h2 className="font-bold mb-2">{t.learn.grammarTopics}</h2>
          <ul className="flex flex-col gap-2">
            {grammar.map((g: { slug: string; title_en: string; title_he: string; summary_he: string; summary_en: string }) => (
              <li key={g.slug}>
                <Link href={`/practice/grammar/${g.slug}`} className="block rounded-xl bg-surface p-3 hover:bg-primary-bg">
                  <span className="font-semibold">{he ? g.title_he : g.title_en}</span>
                  <span className="block text-sm text-muted">{he ? g.summary_he : g.summary_en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {vocab.length > 0 && (
        <Card>
          <h2 className="font-bold mb-2">{t.learn.vocabulary}</h2>
          <ul className="flex flex-wrap gap-2">
            {vocab.map((v: { id: string; lemma: string; he: string[] | null; status: string | null }) => (
              <li key={v.id}>
                <Link href={`/practice/vocabulary/word/${v.id}`} title={(v.he ?? []).join(", ")}
                  className={`inline-block rounded-full px-3 py-1 text-sm border ${v.status === "mastered" ? "border-success" : v.status ? "border-primary" : "border-border"}`}>
                  <En>{v.lemma}</En>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
