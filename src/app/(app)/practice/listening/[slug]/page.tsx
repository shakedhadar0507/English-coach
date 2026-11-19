import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/session";
import { listeningDetail } from "@/lib/server/services/listening";
import { getT } from "@/lib/server/locale";
import { Badge, En } from "@/components/ui";
import { ListeningPractice } from "./listening-practice";

export default async function ListeningDetailPage({ params }: PageProps<"/practice/listening/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const data = await listeningDetail(user.id, slug);
  if (!data) notFound();
  const { t, locale } = await getT();
  const m = data.material;
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">{locale === "he" ? m.title_he : m.title_en} <Badge><span dir="ltr">{m.level}</span></Badge></h1>
        {locale === "he" && <En className="text-muted">{m.title_en}</En>}
        {m.context_he && locale === "he" && <p className="text-sm text-muted mt-1">{m.context_he}</p>}
      </header>
      <ListeningPractice material={{ segments: m.segments, glossary: m.glossary, accent: m.accent }} exercises={data.exercises} voiceRate={data.prefs.voice_rate} />
      <p className="text-xs text-muted">{t.listening.audioSource}</p>
    </div>
  );
}
