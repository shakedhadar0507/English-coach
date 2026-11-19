/** Where each daily-plan item kind is practiced. The plan item id travels as ?item= so the target page can mark it complete. */
export function planItemHref(it: { id: string; kind: string; lesson_slug: string | null; payload: Record<string, unknown> }): string {
  const item = `item=${it.id}`;
  switch (it.kind) {
    case "lesson": return it.lesson_slug ? `/lesson/${it.lesson_slug}?${item}` : "/learn";
    case "vocab_review": return `/practice/vocabulary/review?kind=review&${item}`;
    case "vocab_new": return `/practice/vocabulary/review?kind=new&${item}`;
    case "error_review": return `/practice/errors?${item}`;
    case "writing": return `/practice/writing?${item}`;
    case "speaking": return `/speak?${item}`;
    case "listening": return `/practice/listening?${item}`;
    default: return "/";
  }
}
