import { z } from "zod";
import { route } from "@/lib/server/http";
import { sendToUser } from "@/lib/server/push";

export const POST = route(z.object({}), (user) => sendToUser(user.id, { title: "English Coach", body: "Notifications work on this device.", url: "/settings" }));
