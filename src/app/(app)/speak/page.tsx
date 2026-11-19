import { requireUser } from "@/lib/server/session";
import { listConversations } from "@/lib/server/services/tutor";
import { withUser } from "@/lib/server/db";
import { getPreferences } from "@/lib/server/repo/user";
import { aiEnabled } from "@/lib/ai/config";
import { getT } from "@/lib/server/locale";
import { PageHeader } from "@/components/ui";
import { SpeakCoach } from "./speak-coach";

export default async function SpeakPage({ searchParams }: PageProps<"/speak">) {
  const user = await requireUser();
  const { t, locale } = await getT();
  const sp = await searchParams;
  const planItemId = typeof sp.item === "string" && /^[0-9a-f-]{36}$/.test(sp.item) ? sp.item : null;
  const [prefs, history] = await Promise.all([withUser(user.id, getPreferences), listConversations(user.id)]);
  const fmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div>
      <PageHeader title={t.speak.title} subtitle={t.speak.subtitle} />
      <SpeakCoach planItemId={planItemId} accent={prefs.accent} voiceRate={prefs.voice_rate} correctionMode={prefs.correction_mode}
        aiTutor={aiEnabled("tutor_turn")} realtime={aiEnabled("realtime")}
        history={history.map((h) => ({ id: h.id as string, mode: h.mode as string, scenario: h.scenario as string | null, topic: h.topic as string | null, turns: h.turns as number, date: fmt.format(new Date(h.started_at)), feedback: h.feedback ?? null }))} />
    </div>
  );
}
