import { he, type Messages } from "./messages/he";
import { en } from "./messages/en";

export type Locale = "he" | "en";
export const LOCALES: Locale[] = ["he", "en"];
export const DEFAULT_LOCALE: Locale = "he";
export const LOCALE_COOKIE = "ec_locale";

const dictionaries: Record<Locale, Messages> = { he, en };

export function isLocale(v: unknown): v is Locale {
  return v === "he" || v === "en";
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

/** Simple "{n}" interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Picks the localized field from a content row: pick(row, "title", locale) -> row.title_he / row.title_en */
export function pick<T extends Record<string, unknown>>(row: T, field: string, locale: Locale): string {
  return String(row[`${field}_${locale}`] ?? row[`${field}_en`] ?? "");
}

export type { Messages };
