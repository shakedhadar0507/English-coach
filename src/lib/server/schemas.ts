import { z } from "zod";

export const ResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), selected: z.array(z.string().max(4)).min(1).max(6) }),
  z.object({ kind: z.literal("blanks"), values: z.array(z.string().max(200)).min(1).max(10) }),
  z.object({ kind: z.literal("text"), value: z.string().max(2000) }),
  z.object({ kind: z.literal("tokens"), order: z.array(z.string().max(60)).min(1).max(40) }),
]);
