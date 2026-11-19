import { route } from "@/lib/server/http";
import { PreferencesPatch, updatePreferences } from "@/lib/server/services/settings";

export const POST = route(PreferencesPatch, async (user, body) => { await updatePreferences(user.id, body); return { ok: true }; });
