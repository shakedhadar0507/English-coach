import { z } from "zod";
import { route } from "@/lib/server/http";
import { saveByTerm } from "@/lib/server/services/vocab";

export const POST = route(z.object({ term: z.string().min(1).max(80), he: z.string().max(120).optional() }), (user, b) => saveByTerm(user.id, b.term, b.he));
