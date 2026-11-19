import Link from "next/link";
import { requireUser } from "@/lib/server/session";
import { grammarTopics } from "@/lib/server/services/curriculum";
import { getT } from "@/lib/server/locale";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function GrammarListPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const topics = await grammarTopics(user.id);
  const he = locale === "he";
  return (
    <div>
      <PageHeader title={t.practice.grammar} subtitle={t.practice.grammarDesc} />
      <Card className="p-0 divide-y divide-border">
        {topics.map((g) => (
          <Link key={g.slug} href={`/practice/grammar/${g.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
            <Badge><span dir="ltr">{g.level}</span></Badge>
            <span className="flex-1 min-w-0">
              <span className="block font-medium">{he ? g.title_he : g.title_en}</span>
              <span className="block text-sm text-muted truncate">{he ? g.summary_he : g.summary_en}</span>
            </span>
            {g.attempts > 0 && <span className="text-xs text-muted tabular-nums">{Math.round((g.correct / g.attempts) * 100)}%</span>}
          </Link>
        ))}
      </Card>
    </div>
  );
}
