import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { tutorTurn } from "@/lib/server/services/tutor";

export const POST = route(z.object({ conversationId: uuid, seq: z.number().int().min(0).max(200), text: z.string().trim().min(1).max(1500), speakingSeconds: z.number().min(0).max(600).optional() }),
  (user, b) => tutorTurn(user.id, b.conversationId, b.seq, b.text, b.speakingSeconds));
