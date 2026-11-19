import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/session";
import { grammarTopic } from "@/lib/server/services/curriculum";
import { getT } from "@/lib/server/locale";
import { Badge, ButtonLink, Card, En } from "@/components/ui";

export default async function GrammarTopicPage({ params }: PageProps<"/practice/grammar/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const data = await grammarTopic(user.id, slug);
  if (!data) notFound();
  const { t, locale } = await getT();
  const he = locale === "he";
  const { topic: g, progress, lessons } = data;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-muted"><Link href="/practice/grammar" className="hover:underline">{t.learn.grammarReference}</Link></p>
        <h1 className="text-2xl font-bold flex items-center gap-2">{he ? g.title_he : g.title_en} <Badge><span dir="ltr">{g.level}</span></Badge></h1>
        {he && <En className="text-muted">{g.title_en}</En>}
        <p className="mt-2 leading-relaxed">{he ? g.summary_he : g.summary_en}</p>
        {progress && progress.attempts > 0 && <p className="text-sm text-muted mt-1">{t.progress.accuracy}: {Math.round((progress.correct / progress.attempts) * 100)}% · {progress.attempts}</p>}
      </header>
      <Card>
        <h2 className="font-bold mb-2">{t.learn.rules}</h2>
        <ul className="flex flex-col gap-3">
          {g.rules.map((r: { en: string; he: string }, i: number) => (
            <li key={i} className="rounded-xl bg-surface p-3">
              <p>{he ? r.he : r.en}</p>
              {he && <En block className="text-sm text-muted mt-1">{r.en}</En>}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">{t.learn.examples}</h2>
        <ul className="flex flex-col gap-2">
          {g.examples.map((e: { en: string; he: string; note?: string }, i: number) => (
            <li key={i}><En block className="font-medium">{e.en}</En><p className="text-sm text-muted">{e.he}</p></li>
          ))}
        </ul>
      </Card>
      {g.common_mistakes.length > 0 && (
        <Card>
          <h2 className="font-bold mb-2">{t.learn.commonMistakes}</h2>
          <ul className="flex flex-col gap-3">
            {g.common_mistakes.map((m: { wrong: string; right: string; he: string }, i: number) => (
              <li key={i}>
                <En block className="line-through text-danger">{m.wrong}</En>
                <En block className="text-success font-medium">{m.right}</En>
                <p className="text-sm text-muted mt-1">{m.he}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {lessons.length > 0 && (
        <div className="flex flex-col gap-2">
          {lessons.map((l: { slug: string; title_en: string; title_he: string }) => (
            <ButtonLink key={l.slug} href={`/lesson/${l.slug}`} className="w-full">{he ? l.title_he : l.title_en}</ButtonLink>
          ))}
        </div>
      )}
    </div>
  );
}
