"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Badge, Button, ButtonLink, Card, EmptyState, En, Notice, ProgressBar, Spinner, cn } from "@/components/ui";
import { postOrQueue } from "@/lib/client/offline-queue";
import { newId } from "@/lib/client/use-active-time";
import { speak, type Accent } from "@/lib/client/speech";

interface ReviewCard {
  vocabulary_id: string; lemma: string; part_of_speech: string; level: string | null;
  meanings: { definition_en: string; translations_he: string[] }[]; examples: { sentence_en: string; translation_he: string | null }[];
  version: number; mode: "flashcard" | "recognition" | "production"; options?: string[];
}

function shuffle<T>(a: T[], seed: string): T[] {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function ReviewSession({ kind, count, planItemId, accent, rate: speechRate }: { kind: "review" | "new"; count: number; planItemId: string | null; accent: Accent; rate: number }) {
  const { t, locale } = useI18n();
  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ correct: boolean; typo?: boolean } | null>(null);
  const [stats, setStats] = useState({ done: 0, correct: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/vocab/queue?kind=${kind}&n=${count}`).then((r) => r.json()).then((d) => setCards(d.cards ?? [])).catch(() => setError(true));
  }, [kind, count]);

  const card = cards?.[i];
  const options = useMemo(() => (card?.options ? shuffle(card.options, card.vocabulary_id) : []), [card]);
  const finished = cards && i >= cards.length;

  useEffect(() => {
    if (finished && planItemId && stats.done > 0) postOrQueue("/api/plan/item", { itemId: planItemId }, newId("pi"));
  }, [finished, planItemId, stats.done]);

  async function send(answer: Record<string, unknown>) {
    if (!card) return;
    const key = newId("r");
    const res = await postOrQueue<{ correct: boolean; typo: boolean }>("/api/vocab/review", { vocabularyId: card.vocabulary_id, clientReviewId: key, expectedVersion: card.version, answer }, key);
    const correct = res.ok ? res.data.correct : answer.mode === "flashcard" ? Number(answer.rating) >= 2 : false;
    setStats((s) => ({ done: s.done + 1, correct: s.correct + (correct ? 1 : 0) }));
    return res.ok ? res.data : null;
  }

  async function rate(r: 1 | 2 | 3 | 4) { await send({ mode: "flashcard", rating: r }); next(); }
  async function choose(choice: string) { const d = await send({ mode: "recognition", choice }); setResult({ correct: d?.correct ?? choice === card!.meanings[0]?.translations_he[0] }); setRevealed(true); }
  async function produce() { const d = await send({ mode: "production", typed }); setResult({ correct: !!d?.correct, typo: d?.typo }); setRevealed(true); }
  function next() { setI((x) => x + 1); setRevealed(false); setTyped(""); setResult(null); }
  const say = () => card && speak(card.lemma, { accent, rate: speechRate }).catch(() => {});

  if (error) return <Notice tone="danger">{t.common.error}</Notice>;
  if (!cards) return <div className="py-16 flex justify-center"><Spinner label={t.common.loading} /></div>;
  if (cards.length === 0) return (
    <EmptyState title={t.vocab.noDue}>
      <ButtonLink href="/practice/vocabulary/review?kind=new" variant="secondary">{t.vocab.newWords}</ButtonLink>
    </EmptyState>
  );
  if (finished) return (
    <Card className="text-center flex flex-col gap-4 mt-4">
      <h1 className="text-2xl font-bold">{t.player.sessionSummary}</h1>
      <p className="text-4xl font-bold tabular-nums">{stats.correct}/{stats.done}</p>
      <p className="text-sm text-muted">{t.vocab.masteryNote}</p>
      <ButtonLink href="/" block>{t.common.continue}</ButtonLink>
      <ButtonLink href="/practice/vocabulary" variant="secondary" block>{t.vocab.library}</ButtonLink>
    </Card>
  );

  const c = card!;
  const he = c.meanings.flatMap((m) => m.translations_he);
  const example = c.examples[0];
  const blanked = example ? example.sentence_en.replace(new RegExp(c.lemma.split(" ")[0].slice(0, Math.max(3, c.lemma.split(" ")[0].length - 2)) + "\\w*", "i"), "_____") : "";

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex items-center gap-3">
        <ProgressBar value={i / cards.length} label={t.placement.progressLabel} />
        <span className="text-sm text-muted tabular-nums">{i + 1}/{cards.length}</span>
      </div>
      <Card className="flex flex-col gap-4 min-h-72 animate-pop" key={c.vocabulary_id}>
        <div className="flex items-center gap-2">
          <Badge tone="primary">{c.mode === "production" ? t.vocab.modes.production : c.mode === "recognition" ? t.vocab.modes.recognition : t.vocab.flashcards}</Badge>
          {c.level && <Badge>{c.level}</Badge>}<span className="text-xs text-muted">{c.part_of_speech}</span>
        </div>

        {c.mode !== "production" && (
          <div className="flex items-center gap-3">
            <En className="text-3xl font-bold">{c.lemma}</En>
            <button type="button" onClick={say} aria-label={t.player.listen} className="text-primary p-2"><Volume2 /></button>
          </div>
        )}
        {c.mode === "production" && (
          <div>
            <p className="text-muted text-sm">{t.vocab.promptHeEn}</p>
            <p className="text-2xl font-bold mt-1" lang="he" dir="rtl">{he.slice(0, 2).join(" / ")}</p>
            {blanked && <En block className="mt-2 text-muted">{blanked}</En>}
          </div>
        )}

        {c.mode === "flashcard" && !revealed && <Button variant="secondary" onClick={() => setRevealed(true)}>{t.vocab.showAnswer}</Button>}

        {c.mode === "recognition" && !revealed && (
          <div className="grid gap-2">
            <p className="text-sm text-muted">{t.vocab.promptEnHe}</p>
            {options.map((o) => <Button key={o} variant="secondary" onClick={() => choose(o)} className="justify-start" lang="he">{o}</Button>)}
          </div>
        )}

        {c.mode === "production" && !revealed && (
          <form onSubmit={(e) => { e.preventDefault(); if (typed.trim()) produce(); }} className="flex flex-col gap-2">
            <input value={typed} onChange={(e) => setTyped(e.target.value)} dir="ltr" lang="en" autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder={t.player.typeAnswer} className="min-h-12 rounded-xl border-2 border-border bg-surface px-4 text-lg outline-none focus:border-primary" />
            <Button type="submit" disabled={!typed.trim()}>{t.player.check}</Button>
          </form>
        )}

        {revealed && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            {result && <p className={cn("font-bold", result.correct ? "text-success" : "text-danger")}>{result.correct ? (result.typo ? t.player.almost : t.player.correct) : t.player.incorrect}</p>}
            {c.mode === "production" && <En className="text-2xl font-bold">{c.lemma}</En>}
            <div>
              {c.meanings.map((m, k) => (
                <div key={k} className="mb-2">
                  <p className="font-semibold" lang="he" dir="rtl">{m.translations_he.join(", ")}</p>
                  <En block className="text-sm text-muted">{m.definition_en}</En>
                </div>
              ))}
            </div>
            {example && <div className="rounded-xl bg-surface p-3"><En block>{example.sentence_en}</En>{example.translation_he && locale === "he" && <p className="text-sm text-muted mt-1">{example.translation_he}</p>}</div>}
            {c.mode === "flashcard" ? (
              <div>
                <p className="text-sm text-muted mb-2">{t.vocab.howWell}</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="danger" onClick={() => rate(1)} className="px-2">{t.vocab.again}</Button>
                  <Button variant="secondary" onClick={() => rate(2)} className="px-2">{t.vocab.hard}</Button>
                  <Button variant="secondary" onClick={() => rate(3)} className="px-2">{t.vocab.good}</Button>
                  <Button variant="success" onClick={() => rate(4)} className="px-2">{t.vocab.easy}</Button>
                </div>
              </div>
            ) : <Button onClick={next}>{t.player.continue}</Button>}
          </div>
        )}
      </Card>
    </div>
  );
}
