import Link from "next/link";
import { BookMarked, Brain, Headphones, Layers, PenLine, RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/server/session";
import { vocabCounts } from "@/lib/server/services/vocab";
import { getT } from "@/lib/server/locale";
import { Badge, PageHeader } from "@/components/ui";

export default async function PracticePage() {
  const user = await requireUser();
  const { t } = await getT();
  const counts = await vocabCounts(user.id);
  const tiles = [
    { href: "/practice/vocabulary/review", icon: RotateCcw, title: t.practice.vocabReview, desc: t.practice.vocabReviewDesc, badge: counts.due || null },
    { href: "/practice/vocabulary", icon: BookMarked, title: t.practice.library, desc: t.practice.libraryDesc },
    { href: "/practice/grammar", icon: Layers, title: t.practice.grammar, desc: t.practice.grammarDesc },
    { href: "/practice/listening", icon: Headphones, title: t.practice.listening, desc: t.practice.listeningDesc },
    { href: "/practice/writing", icon: PenLine, title: t.practice.writing, desc: t.practice.writingDesc },
    { href: "/practice/errors", icon: Brain, title: t.practice.errors, desc: t.practice.errorsDesc },
  ];
  return (
    <div>
      <PageHeader title={t.practice.title} subtitle={t.practice.subtitle} />
      <div className="grid sm:grid-cols-2 gap-3">
        {tiles.map(({ href, icon: Icon, title, desc, badge }) => (
          <Link key={href} href={href} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-bg text-primary shrink-0"><Icon size={22} /></span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-semibold">{title}{badge ? <Badge tone="warning">{badge}</Badge> : null}</span>
              <span className="block text-sm text-muted">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
