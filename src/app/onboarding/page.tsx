import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/session";
import { withUser } from "@/lib/server/db";
import { getGoals, getPreferences, getProfile } from "@/lib/server/repo/user";
import { OnboardingWizard } from "./wizard";
import { FeedbackButton } from "@/components/feedback-button";

export default async function OnboardingPage() {
  const user = await requireUser();
  const { profile, prefs, goals } = await withUser(user.id, async (db) => ({ profile: await getProfile(db), prefs: await getPreferences(db), goals: await getGoals(db) }));
  if (profile.onboarded_at) redirect("/");
  return (
    <main className="mx-auto max-w-xl px-4 py-8 min-h-dvh safe-top">
      <FeedbackButton />
      <OnboardingWizard initial={{ locale: prefs.locale, accent: prefs.accent, minutes: prefs.daily_minutes, voiceRate: prefs.voice_rate, goals: goals.map((g) => g.goal), level: profile.current_level }} />
    </main>
  );
}
