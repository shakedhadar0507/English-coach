import { requireUser } from "@/lib/server/session";
import { listWriting, writingTasks } from "@/lib/server/services/writing";
import { aiEnabled } from "@/lib/ai/config";
import { getT } from "@/lib/server/locale";
import { Notice, PageHeader } from "@/components/ui";
import { WritingCenter } from "./writing-center";

export default async function WritingPage({ searchParams }: PageProps<"/practice/writing">) {
  const user = await requireUser();
  const { t, locale } = await getT();
  const sp = await searchParams;
  const planItemId = typeof sp.item === "string" && /^[0-9a-f-]{36}$/.test(sp.item) ? sp.item : null;
  const [tasks, history] = await Promise.all([writingTasks(user.id), listWriting(user.id)]);
  const fmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { dateStyle: "medium" });
  return (
    <div>
      <PageHeader title={t.writing.title} subtitle={t.practice.writingDesc} />
      {!aiEnabled("writing_feedback") && <Notice className="mb-4">{t.common.aiDisabled}</Notice>}
      <WritingCenter planItemId={planItemId}
        tasks={tasks.map((x) => ({ id: x.id as string, level: x.level as string, prompt: x.prompt }))}
        history={history.map((h) => ({ id: h.id as string, task: h.task_prompt as string, body: h.body as string, words: h.word_count as number, status: h.status as string, date: fmt.format(new Date(h.created_at)), feedback: h.feedback ?? null }))} />
    </div>
  );
}
