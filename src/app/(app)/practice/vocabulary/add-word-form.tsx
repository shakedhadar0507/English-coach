"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Button, Card, Notice } from "@/components/ui";

const POS = ["noun", "verb", "adjective", "adverb", "phrase", "phrasal verb", "idiom", "collocation"];

export function AddWordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/vocab/add", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ lemma: fd.get("lemma"), part_of_speech: fd.get("pos"), meaning_he: fd.get("he"), definition_en: fd.get("def") || undefined, example: fd.get("example") || undefined }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) { setMsg({ tone: "success", text: t.common.saved }); (e.target as HTMLFormElement).reset(); router.refresh(); }
    else setMsg({ tone: "danger", text: res?.status === 409 ? t.vocab.saved : t.common.error });
  }

  const input = "min-h-11 rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary";
  if (!open) return <Button variant="secondary" className="mt-6" onClick={() => setOpen(true)}><Plus size={18} /> {t.vocab.addWord}</Button>;
  return (
    <Card className="mt-6">
      <h2 className="font-bold mb-3">{t.vocab.addWordTitle}</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">{t.vocab.word}<input name="lemma" required dir="ltr" lang="en" className={input} /></label>
        <label className="grid gap-1 text-sm">{t.vocab.partOfSpeech}
          <select name="pos" className={input}>{POS.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
        <label className="grid gap-1 text-sm">{t.vocab.meaningHe}<input name="he" required dir="rtl" lang="he" className={input} /></label>
        <label className="grid gap-1 text-sm">{t.vocab.definitionEn} ({t.common.optional})<input name="def" dir="ltr" lang="en" className={input} /></label>
        <label className="grid gap-1 text-sm">{t.vocab.example} ({t.common.optional})<input name="example" dir="ltr" lang="en" className={input} /></label>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <div className="flex gap-2"><Button type="submit" disabled={busy}>{t.common.save}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t.common.close}</Button></div>
      </form>
    </Card>
  );
}
