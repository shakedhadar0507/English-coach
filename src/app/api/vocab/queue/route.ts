import { z } from "zod";
import { route } from "@/lib/server/http";
import { newWords, reviewQueue } from "@/lib/server/services/vocab";

const Query = z.object({ kind: z.enum(["review", "new"]).default("review"), n: z.coerce.number().int().min(1).max(50).default(20) });

export const GET = route(Query, async (user, q) => ({ cards: q.kind === "new" ? await newWords(user.id, q.n) : await reviewQueue(user.id, q.n) }));
