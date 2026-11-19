import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/session";
import { getLessonForPlayer } from "@/lib/server/services/lessons";
import { LessonPlayer } from "./lesson-player";

export default async function LessonPage({ params, searchParams }: PageProps<"/lesson/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;
  const data = await getLessonForPlayer(user.id, slug);
  if (!data) notFound();
  const planItemId = typeof sp.item === "string" && /^[0-9a-f-]{36}$/.test(sp.item) ? sp.item : null;
  return <LessonPlayer data={JSON.parse(JSON.stringify(data))} planItemId={planItemId} />;
}
