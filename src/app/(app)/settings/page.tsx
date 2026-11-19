import { requireUser } from "@/lib/server/session";
import { withUser } from "@/lib/server/db";
import { getGoals, getPreferences, getProfile } from "@/lib/server/repo/user";
import { pushConfigured, vapidPublicKey } from "@/lib/server/push";
import { getT, getTheme } from "@/lib/server/locale";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const { t } = await getT();
  const theme = await getTheme();
  const { prefs, goals, profile, ai } = await withUser(user.id, async (db) => ({
    prefs: await getPreferences(db), goals: await getGoals(db), profile: await getProfile(db),
    ai: (await db.query("select spent::float, budget::float from public.ai_month_summary()")).rows[0] as { spent: number; budget: number },
  }));
  return (
    <div>
      <PageHeader title={t.settings.title} />
      <SettingsForm prefs={{ ...prefs, theme }} goals={goals.map((g) => g.goal)} level={profile.current_level} levelSource={profile.level_source}
        email={user.email} aiSpent={ai.spent} push={{ configured: pushConfigured(), publicKey: vapidPublicKey() }} />
    </div>
  );
}
