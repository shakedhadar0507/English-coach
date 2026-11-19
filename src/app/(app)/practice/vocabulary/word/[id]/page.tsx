import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/session";
import { wordDetail } from "@/lib/server/services/vocab";
import { getT } from "@/lib/server/locale";
import { Badge, Card, En } from "@/components/ui";
import { WordActions } from "./word-actions";

export default async function WordPage({ params }: PageProps<"/practice/vocabulary/word/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await wordDetail(user.id, id);
  if (!data) notFound();
  const { t, locale } = await getT();
  const { word: w, progress, history } = data;
  const fmtDate = (d: string | null) => (d ? new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { dateStyle: "medium" }).format(new Date(d)) : "—");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center gap-2 mb-2">{w.level && <Badge>{w.level}</Badge>}<span className="text-sm text-muted">{w.part_of_speech}</span>
          {progress && <Badge tone={progress.status === "mastered" ? "success" : "primary"}>{t.vocab.status[progress.status as keyof typeof t.vocab.status]}</Badge>}</div>
        <div className="flex items-center gap-3"><En className="text-3xl font-bold">{w.lemma}</En>{w.ipa_us && <En className="text-muted">/{w.ipa_us}/</En>}</div>
        <WordActions id={w.id} lemma={w.lemma} saved={!!progress?.saved} difficult={!!progress?.difficult} />
      </Card>
      <Card>
        <h2 className="font-bold mb-3">{t.vocab.meanings}</h2>
        <ol className="flex flex-col gap-3 list-decimal ps-5">
          {w.meanings.map((m: { definition_en: string; translations_he: string[] }, i: number) => (
            <li key={i}>
              <p className="font-semibold" lang="he">{m.translations_he.join(", ")}</p>
              <En block className="text-muted">{m.definition_en}</En>
              {w.notes?.[i]?.usage_note_he && <p className="text-sm mt-1 rounded-lg bg-primary-bg px-3 py-2">{w.notes[i].usage_note_he}</p>}
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <h2 className="font-bold mb-3">{t.vocab.examples}</h2>
        <ul className="flex flex-col gap-2">
          {w.examples.map((e: { sentence_en: string; translation_he: string | null }, i: number) => (
            <li key={i} className="rounded-xl bg-surface p-3"><En block>{e.sentence_en}</En>{e.translation_he && <p className="text-sm text-muted mt-1">{e.translation_he}</p>}</li>
          ))}
        </ul>
        {(w.synonyms?.length > 0 || w.antonyms?.length > 0 || w.related?.length > 0) && (
          <dl className="mt-4 grid gap-2 text-sm">
            {w.synonyms?.length > 0 && <div><dt className="text-muted inline">{t.vocab.synonyms}: </dt><dd className="inline"><En>{w.synonyms.join(", ")}</En></dd></div>}
            {w.antonyms?.length > 0 && <div><dt className="text-muted inline">{t.vocab.antonyms}: </dt><dd className="inline"><En>{w.antonyms.join(", ")}</En></dd></div>}
            {w.related?.length > 0 && <div><dt className="text-muted inline">{t.vocab.related}: </dt><dd className="inline"><En>{w.related.join(", ")}</En></dd></div>}
          </dl>
        )}
      </Card>
      {progress && (
        <Card>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">{t.vocab.lastReviewed}</dt><dd className="font-semibold">{fmtDate(progress.last_review)}</dd></div>
            <div><dt className="text-muted">{t.vocab.nextReview}</dt><dd className="font-semibold">{fmtDate(progress.due)}</dd></div>
            <div><dt className="text-muted">{t.vocab.modes.recognition}</dt><dd className="font-semibold tabular-nums">{progress.recognition_correct}</dd></div>
            <div><dt className="text-muted">{t.vocab.modes.production}</dt><dd className="font-semibold tabular-nums">{progress.production_correct}</dd></div>
          </dl>
          <p className="text-xs text-muted mt-3">{t.vocab.masteryNote}</p>
          {history.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t.progress.activity}>
              {history.map((h: { correct: boolean; reviewed_at: string; direction: string }, i: number) => (
                <li key={i} title={`${h.direction} · ${fmtDate(h.reviewed_at)}`} className={`h-3 w-3 rounded-full ${h.correct ? "bg-success" : "bg-danger"}`} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
