import Link from "next/link";
import { requireUser } from "@/lib/server/session";
import { library, vocabCounts, type LibraryFilter } from "@/lib/server/services/vocab";
import { getT } from "@/lib/server/locale";
import { Badge, ButtonLink, Card, EmptyState, En, PageHeader, Stat } from "@/components/ui";
import { AddWordForm } from "./add-word-form";

const FILTERS = ["all", "due", "saved", "difficult", "recent", "mastered"] as const;

export default async function VocabularyPage({ searchParams }: PageProps<"/practice/vocabulary">) {
  const user = await requireUser();
  const { t } = await getT();
  const sp = await searchParams;
  const f: LibraryFilter = {
    q: typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined,
    filter: FILTERS.includes(sp.filter as (typeof FILTERS)[number]) ? (sp.filter as LibraryFilter["filter"]) : "all",
    sort: sp.sort === "alpha" || sp.sort === "recent" ? sp.sort : "due",
    page: Number(sp.page) || 0,
  };
  const [{ items, hasMore }, counts] = await Promise.all([library(user.id, f), vocabCounts(user.id)]);
  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: f.q, filter: f.filter, sort: f.sort, page: f.page, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && v !== 0 && !(k === "filter" && v === "all") && !(k === "sort" && v === "due")) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div>
      <PageHeader title={t.vocab.library} action={<ButtonLink href="/practice/vocabulary/review" className="min-h-10 px-4 text-sm">{t.vocab.review}</ButtonLink>} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label={t.vocab.dueNow} value={counts.due} />
        <Stat label={t.progress.vocabEncountered} value={counts.total} />
        <Stat label={t.vocab.filters.mastered} value={counts.mastered} />
      </div>

      <form className="flex gap-2 mb-3" action="/practice/vocabulary">
        <input name="q" defaultValue={f.q} placeholder={t.common.search} aria-label={t.common.search}
          className="flex-1 min-h-11 rounded-xl border border-border bg-card px-4 outline-none focus:border-primary" />
        {f.filter !== "all" && <input type="hidden" name="filter" value={f.filter} />}
        <select name="sort" defaultValue={f.sort} aria-label={t.vocab.sortBy} className="rounded-xl border border-border bg-card px-3">
          <option value="due">{t.vocab.sort.due}</option><option value="alpha">{t.vocab.sort.alpha}</option><option value="recent">{t.vocab.sort.recent}</option>
        </select>
        <button className="rounded-xl bg-primary text-on-primary px-4 font-semibold">{t.common.search}</button>
      </form>
      <nav className="flex gap-2 overflow-x-auto pb-2 mb-3" aria-label={t.vocab.sortBy}>
        {FILTERS.map((k) => (
          <Link key={k} href={`/practice/vocabulary${qs({ filter: k, page: 0 })}`} aria-current={f.filter === k ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${f.filter === k ? "bg-primary text-on-primary" : "bg-card border border-border"}`}>{t.vocab.filters[k]}</Link>
        ))}
      </nav>

      {items.length === 0 ? <EmptyState title={t.common.empty}><p className="text-sm">{t.vocab.noDue}</p></EmptyState> : (
        <Card className="p-0 divide-y divide-border">
          {items.map((w) => (
            <Link key={w.id} href={`/practice/vocabulary/word/${w.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface">
              <div className="min-w-0">
                <En className="font-semibold">{w.lemma}</En>
                <p className="text-sm text-muted truncate" lang="he">{(w.he ?? []).join(", ")}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {w.saved && <Badge tone="primary">★</Badge>}
                <Badge tone={w.status === "mastered" ? "success" : w.status === "learning" ? "warning" : "neutral"}>{t.vocab.status[w.status as keyof typeof t.vocab.status]}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}
      <div className="flex justify-between mt-4">
        {f.page ? <Link className="text-primary font-medium" href={`/practice/vocabulary${qs({ page: (f.page ?? 0) - 1 })}`}>{t.common.back}</Link> : <span />}
        {hasMore && <Link className="text-primary font-medium" href={`/practice/vocabulary${qs({ page: (f.page ?? 0) + 1 })}`}>{t.common.next}</Link>}
      </div>

      <AddWordForm />
    </div>
  );
}
