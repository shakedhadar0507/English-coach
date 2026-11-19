import Link from "next/link";
import { Headphones } from "lucide-react";
import { requireUser } from "@/lib/server/session";
import { listeningList } from "@/lib/server/services/listening";
import { getT } from "@/lib/server/locale";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function ListeningListPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const items = await listeningList(user.id);
  const he = locale === "he";
  return (
    <div>
      <PageHeader title={t.listening.title} subtitle={t.practice.listeningDesc} />
      <Card className="p-0 divide-y divide-border">
        {items.map((m) => (
          <Link key={m.slug} href={`/practice/listening/${m.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
            <Headphones size={20} className="text-primary shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block font-medium">{he ? m.title_he : m.title_en}</span>
              <span className="block text-xs text-muted">{t.accents[m.accent as keyof typeof t.accents]}{m.questions ? ` · ${m.answered}/${m.questions} ${t.listening.questions}` : ""}</span>
            </span>
            <Badge><span dir="ltr">{m.level}</span></Badge>
          </Link>
        ))}
      </Card>
      <p className="text-xs text-muted mt-3">{t.listening.audioSource}</p>
    </div>
  );
}
