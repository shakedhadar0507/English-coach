import { requireUser } from "@/lib/server/session";
import { withUser } from "@/lib/server/db";
import { getPreferences } from "@/lib/server/repo/user";
import { ReviewSession } from "./review-session";

export default async function VocabReviewPage({ searchParams }: PageProps<"/practice/vocabulary/review">) {
  const user = await requireUser();
  const sp = await searchParams;
  const prefs = await withUser(user.id, getPreferences);
  const kind = sp.kind === "new" ? "new" : "review";
  const item = typeof sp.item === "string" && /^[0-9a-f-]{36}$/.test(sp.item) ? sp.item : null;
  const n = kind === "new" ? prefs.vocab_new_per_day || 8 : 20;
  return <ReviewSession kind={kind} count={n} planItemId={item} accent={prefs.accent} rate={prefs.voice_rate} />;
}
