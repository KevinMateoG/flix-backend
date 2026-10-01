export const supportedLocales = ["en", "es", "pt"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export function normalizeLocale(locale?: string | null): AppLocale {
  return supportedLocales.includes(locale as AppLocale) ? (locale as AppLocale) : "en";
}

export function getTmdbLanguage(locale?: string | null) {
  const normalized = normalizeLocale(locale);
  return normalized === "es" ? "es-ES" : normalized === "pt" ? "pt-BR" : "en-US";
}
