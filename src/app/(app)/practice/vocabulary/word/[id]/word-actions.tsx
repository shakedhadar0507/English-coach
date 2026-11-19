"use client";

import { useState } from "react";
import { Star, Volume2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui";
import { speak } from "@/lib/client/speech";

export function WordActions({ id, lemma, saved: s0, difficult: d0 }: { id: string; lemma: string; saved: boolean; difficult: boolean }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(s0);
  const [difficult, setDifficult] = useState(d0);
  const set = async (patch: { saved?: boolean; difficult?: boolean }) => {
    await fetch("/api/vocab/flags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
  };
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button variant="secondary" className="min-h-10 px-3" onClick={() => speak(lemma, { accent: "american" }).catch(() => {})}><Volume2 size={18} /> {t.player.listen}</Button>
      <Button variant={saved ? "primary" : "secondary"} className="min-h-10 px-3" aria-pressed={saved} onClick={() => { setSaved(!saved); set({ saved: !saved }); }}><Star size={18} /> {saved ? t.vocab.saved : t.vocab.save}</Button>
      <Button variant={difficult ? "primary" : "secondary"} className="min-h-10 px-3" aria-pressed={difficult} onClick={() => { setDifficult(!difficult); set({ difficult: !difficult }); }}><AlertTriangle size={18} /> {t.vocab.markDifficult}</Button>
    </div>
  );
}
