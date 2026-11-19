import { z } from "zod";
import { route } from "@/lib/server/http";
import { addPersonalWord } from "@/lib/server/services/vocab";

const Body = z.object({
  lemma: z.string().trim().min(1).max(80),
  part_of_speech: z.enum(["noun", "verb", "adjective", "adverb", "phrase", "phrasal verb", "idiom", "preposition", "conjunction", "collocation"]),
  meaning_he: z.string().trim().min(1).max(200),
  definition_en: z.string().max(300).optional(),
  example: z.string().max(300).optional(),
});

export const POST = route(Body, (user, b) => addPersonalWord(user.id, b));
