import { route } from "@/lib/server/http";
import { StartInput, openConversation, startConversation } from "@/lib/server/services/tutor";

export const POST = route(StartInput, async (user, b) => {
  const started = await startConversation(user.id, b);
  const opener = started.aiAvailable ? await openConversation(user.id, started.conversation.id) : { status: "ai_disabled" as const };
  return { ...started, opener };
});
