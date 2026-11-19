import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getMessages, isLocale, type Locale } from "@/i18n";

export const THEME_COOKIE = "ec_theme";
export type Theme = "system" | "light" | "dark";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : "system";
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}
