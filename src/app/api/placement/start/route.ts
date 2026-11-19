import { z } from "zod";
import { route } from "@/lib/server/http";
import { startPlacement } from "@/lib/server/services/placement";

export const POST = route(z.object({}), async (user) => startPlacement(user.id));
