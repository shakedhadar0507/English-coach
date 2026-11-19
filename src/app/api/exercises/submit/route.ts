import { z } from "zod";
import { idempotencyKey, route, uuid } from "@/lib/server/http";
import { submitExercise } from "@/lib/server/services/exercises";
import { ResponseSchema } from "@/lib/server/schemas";

const Body = z.object({
  exerciseId: uuid,
  sessionId: uuid.nullish(),
  clientAttemptId: idempotencyKey,
  response: ResponseSchema,
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  selfAssessed: z.boolean().optional(),
});

export const POST = route(Body, (user, b) => submitExercise(user.id, b));
