import { requireUser } from "@/lib/server/session";
import { withUser } from "@/lib/server/db";
import { getPreferences, getProfile } from "@/lib/server/repo/user";
import { listAssessments } from "@/lib/server/services/placement";
import { getT } from "@/lib/server/locale";
import { PageHeader } from "@/components/ui";
import { PlacementCenter } from "./placement-center";

export default async function PlacementPage() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const [{ prefs, profile }, history] = await Promise.all([
    withUser(user.id, async (db) => ({ prefs: await getPreferences(db), profile: await getProfile(db) })),
    listAssessments(user.id),
  ]);
  const fmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { dateStyle: "medium" });
  const rows = history.filter((h) => h.status === "completed").map((h) => ({
    id: h.id as string, level: h.overall_level as string, confidence: h.overall_confidence as string | null,
    answered: h.answered as number, date: fmt.format(new Date(h.completed_at)),
  }));
  return (
    <div>
      <PageHeader title={t.onboarding.placementTitle} />
      <PlacementCenter accent={prefs.accent} voiceRate={prefs.voice_rate} currentLevel={profile.current_level} levelSource={profile.level_source} history={rows} />
    </div>
  );
}
