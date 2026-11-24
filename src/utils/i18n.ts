import { getRelativeLocaleUrl } from "astro:i18n";
import en from "@i18n/en.json";
import fr from "@i18n/fr.json";

/**
 * Default fallback locale for the application
 */
export const DEFAULT_LOCALE = "en" as const;

/**
 * List of supported locales configured in the application
 */
export const LOCALES = ["en", "fr"] as const;

/**
 * Valid locale type derived from the supported locales array
 */
export type Locale = (typeof LOCALES)[number];

/**
 * Static translation dictionaries map
 */
const translations = { en, fr } as const;

/**
 * Recursive type that flattens nested object structures into dot-separated paths.
 * Example: { pages: { home: string } } -> "pages.home"
 */
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

/**
 * Type representing all valid dot-notation translation keys derived from the base English dictionary
 */
export type TranslationKey = NestedKeyOf<typeof en>;

/**
 * Traverses a nested object at runtime using a dot-separated path (e.g. "pages.home").
 * Returns the resolved string value or undefined if the key does not exist or resolves to a non-string.
 *
 * @param obj - The dictionary object to search within
 * @param path - Dot-separated path representing the key hierarchy
 * @returns The string value if found, otherwise undefined
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

  return typeof value === "string" ? value : undefined;
}

/**
 * Validates a given locale string against supported locales and returns a safe Locale.
 * Falls back to DEFAULT_LOCALE if the input is undefined or unsupported.
 *
 * @param lang - Raw locale string, potentially undefined
 * @returns A validated Locale ('en' | 'fr')
 */
export function getLocale(lang: string | undefined): Locale {
  if (lang && (LOCALES as readonly string[]).includes(lang)) {
    return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Generates a localized path safely without throwing TypeScript undefined errors.
 *
 * @param path - The target path relative to the locale root (e.g. "about", "projects")
 * @param lang - Optional locale string (defaults to validated current locale or 'en')
 * @returns The localized URL string
 */
export function getLocalizedPath(path: string = "", lang?: string | undefined): string {
  return getRelativeLocaleUrl(getLocale(lang), path);
}

/**
 * Computes the target URL to switch languages while remaining on the current route.
 * Dynamically handles base URL configurations and strips non-default locale prefixes.
 *
 * @param currentUrl - The current URL instance or pathname string
 * @param targetLocale - The target locale to switch to
 * @returns The equivalent URL path for the target locale
 */
export function getSwitchLocaleUrl(currentUrl: URL | string, targetLocale: Locale): string {
  const pathname = typeof currentUrl === "string" ? currentUrl : currentUrl.pathname;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Strip base path if running under a subpath (e.g. GitHub Pages)
  let cleanPath = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;

  // Dynamically strip non-default locale prefix (e.g. /fr or /fr/)
  const nonDefaultLocales = LOCALES.filter((loc) => loc !== DEFAULT_LOCALE);
  if (nonDefaultLocales.length > 0) {
    const localeRegex = new RegExp(`^/(${nonDefaultLocales.join("|")})(/|$)`);
    cleanPath = cleanPath.replace(localeRegex, "/");
  }
  cleanPath = cleanPath.replace(/^\//, "");

  return getRelativeLocaleUrl(targetLocale, cleanPath);
}

/**
 * Returns a translation function `t` scoped to the current locale.
 * Resolves dot-separated keys with a three-tier fallback mechanism:
 * 1. Current locale dictionary
 * 2. Default locale dictionary (fallback)
 * 3. The raw key string itself (prevents runtime crashes)
 *
 * @param lang - The current locale string, can be undefined
 * @returns A type-safe translation helper function
 */
export function useTranslations(lang: string | undefined) {
  const currentLang = getLocale(lang);

  return function t(key: TranslationKey): string {
    return (
      getNestedValue(translations[currentLang], key) ??
      getNestedValue(translations[DEFAULT_LOCALE], key) ??
      key
    );
  };
}
