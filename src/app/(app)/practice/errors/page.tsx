import { requireUser } from "@/lib/server/session";
import { errorsWithPractice } from "@/lib/server/services/errors";
import { withUser } from "@/lib/server/db";
import { getPreferences } from "@/lib/server/repo/user";
import { getT } from "@/lib/server/locale";
import { PageHeader } from "@/components/ui";
import { ErrorsCenter } from "./errors-center";

export default async function ErrorsPage({ searchParams }: PageProps<"/practice/errors">) {
  const user = await requireUser();
  const { t } = await getT();
  const sp = await searchParams;
  const planItemId = typeof sp.item === "string" && /^[0-9a-f-]{36}$/.test(sp.item) ? sp.item : null;
  const [{ errors, exercises }, prefs] = await Promise.all([errorsWithPractice(user.id), withUser(user.id, getPreferences)]);
  return (
    <div>
      <PageHeader title={t.errors.title} subtitle={t.errors.subtitle} />
      <ErrorsCenter errors={errors} exercises={exercises} planItemId={planItemId} accent={prefs.accent} voiceRate={prefs.voice_rate} />
    </div>
  );
}
