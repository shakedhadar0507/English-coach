import { z } from "zod";
import { idempotencyKey, route, uuid } from "@/lib/server/http";
import { submitReview } from "@/lib/server/services/vocab";

const Body = z.object({
  vocabularyId: uuid,
  clientReviewId: idempotencyKey,
  expectedVersion: z.number().int().min(0),
  answer: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("flashcard"), rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) }),
    z.object({ mode: z.literal("recognition"), choice: z.string().max(200) }),
    z.object({ mode: z.literal("production"), typed: z.string().max(200) }),
  ]),
});

export const POST = route(Body, (user, b) => submitReview(user.id, b.vocabularyId, b.clientReviewId, b.expectedVersion, b.answer));
