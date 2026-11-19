"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Badge, Button, Card, En } from "@/components/ui";
import { WritingFeedbackView, WritingTask, type WritingFeedbackData } from "@/components/writing-task";
import { postOrQueue } from "@/lib/client/offline-queue";
import { newId } from "@/lib/client/use-active-time";

interface Task { id: string; level: string; prompt: { task_en: string; task_he: string; min_words: number; max_words: number } }
interface Entry { id: string; task: string; body: string; words: number; status: string; date: string; feedback: WritingFeedbackData | null }

export function WritingCenter({ tasks, history, planItemId }: { tasks: Task[]; history: Entry[]; planItemId: string | null }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [active, setActive] = useState<Task | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  function done() {
    if (planItemId) postOrQueue("/api/plan/item", { itemId: planItemId }, newId("pi"));
    setActive(null);
    router.refresh();
  }

  if (active) return (
    <Card>
      <WritingTask key={active.id} exerciseId={active.id} prompt={active.prompt} onDone={done} />
      <Button variant="ghost" className="mt-2" onClick={() => setActive(null)}>{t.common.back}</Button>
    </Card>
  );

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="font-bold mb-3">{t.writing.tasks}</h2>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <button key={task.id} onClick={() => setActive(task)} className="text-start rounded-2xl border border-border bg-card p-4 hover:border-primary">
              <div className="flex items-start gap-2">
                <Badge><span dir="ltr">{task.level}</span></Badge>
                <span className="flex-1">{locale === "he" ? task.prompt.task_he : task.prompt.task_en}</span>
              </div>
              <span className="block text-xs text-muted mt-1">{task.prompt.min_words}–{task.prompt.max_words} {t.player.words}</span>
            </button>
          ))}
        </div>
      </section>
      {history.length > 0 && (
        <section>
          <h2 className="font-bold mb-3">{t.writing.history}</h2>
          <Card className="p-0 divide-y divide-border">
            {history.map((h) => (
              <div key={h.id}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-start" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)}>
                  <span className="flex-1 min-w-0">
                    <En block className="truncate">{h.task}</En>
                    <span className="block text-xs text-muted">{h.date} · {h.words} {t.player.words}{h.feedback ? ` · ${h.feedback.issues.length} ${t.writing.issues}` : ""}</span>
                  </span>
                  <ChevronDown size={18} className={open === h.id ? "rotate-180" : ""} />
                </button>
                {open === h.id && (
                  <div className="px-4 pb-4">
                    {h.feedback ? <WritingFeedbackView original={h.body} feedback={h.feedback} /> : <En block className="rounded-xl bg-surface p-3 whitespace-pre-wrap">{h.body}</En>}
                    {h.status === "evaluation_disabled" && <p className="text-sm text-muted mt-2">{t.writing.submittedNoAi}</p>}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
