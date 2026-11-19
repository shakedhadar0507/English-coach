import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export interface SessionUser { id: string; email: string; name: string }

/** Verified session user for this request (memoized per request). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return { id: session.user.id, email: session.user.email, name: session.user.name };
  } catch (e) {
    console.error("session lookup failed", e);
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers: returns the user or a 401 response. */
export async function requireApiUser(): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  return user;
}
