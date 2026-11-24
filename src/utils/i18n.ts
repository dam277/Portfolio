import { getRelativeLocaleUrl } from "astro:i18n";
import en from "@i18n/en.json";
import fr from "@i18n/fr.json";

export const DEFAULT_LOCALE = "en" as const;
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

const translations = { en, fr } as const;

/**
 * Returns a validated Locale, falling back safely to DEFAULT_LOCALE
 */
export function getLocale(lang: string | undefined): Locale {
  if (lang && (LOCALES as readonly string[]).includes(lang))
    return lang as Locale;
  
  return DEFAULT_LOCALE;
}

/**
 * Generates a localized path safely without dealing with undefined
 */
export function getLocalizedPath(path: string = "", lang?: string | undefined): string {
  return getRelativeLocaleUrl(getLocale(lang), path);
}

/**
 * Generates the URL for switching language on the current page
 */
export function getSwitchLocaleUrl(currentUrl: URL | string, targetLocale: Locale): string {
  const pathname = typeof currentUrl === "string" ? currentUrl : currentUrl.pathname;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Strip base URL if present
  let cleanPath = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;

  // Strip non-default locale prefix (/fr or /fr/...)
  cleanPath = cleanPath.replace(/^\/fr(\/|$)/, "/").replace(/^\//, "");

  return getRelativeLocaleUrl(targetLocale, cleanPath);
}

/**
 * Type-safe translations getter
 */
export function useTranslations(lang: string | undefined) {
  const currentLang = getLocale(lang);

  return function t(key: keyof typeof en): string {
    return (translations[currentLang] as Record<string, string>)[key] 
      || translations[DEFAULT_LOCALE][key] 
      || key;
  };
}