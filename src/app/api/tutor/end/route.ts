import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { endConversation } from "@/lib/server/services/tutor";

export const POST = route(z.object({ conversationId: uuid }), (user, b) => endConversation(user.id, b.conversationId));
