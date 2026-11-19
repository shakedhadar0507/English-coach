import { z } from "zod";
import { idempotencyKey, route, uuid } from "@/lib/server/http";
import { submitWriting } from "@/lib/server/services/writing";

const Body = z.object({
  exerciseId: uuid.nullish(), sessionId: uuid.nullish(), taskPrompt: z.string().min(1).max(1000),
  body: z.string().min(1).max(8000), clientSubmissionId: idempotencyKey,
});

export const POST = route(Body, (user, b) => submitWriting(user.id, b));
