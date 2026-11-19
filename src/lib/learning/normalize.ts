/**
 * Text normalization used for deterministic answer comparison.
 * Contractions are expanded to a canonical form so "I'm" and "I am" match.
 */
const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "cannot"],
  [/\bshan't\b/g, "shall not"],
  [/\bain't\b/g, "is not"],
  [/\blet's\b/g, "let us"],
  [/\b(\w+)n't\b/g, "$1 not"],
  [/\bi'm\b/g, "i am"],
  [/\b(you|we|they)'re\b/g, "$1 are"],
  [/\b(i|you|we|they|he|she|it|who|that|there)'ll\b/g, "$1 will"],
  [/\b(i|you|we|they|who)'ve\b/g, "$1 have"],
  [/\b(i|you|we|they|he|she|it|who)'d\b/g, "$1 would"],
  [/\b(he|she|it|that|there|what|who|where|here)'s\b/g, "$1 is"],
];

export function normalizeAnswer(input: string): string {
  let s = input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .trim();
  s = s.replace(/\bcan not\b/g, "cannot");
  for (const [re, rep] of CONTRACTIONS) s = s.replace(re, rep);
  s = s
    .replace(/[.,!?;:"()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Splits text into word tokens for diffing (keeps punctuation as separate tokens). */
export function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}]/gu) ?? [];
}
