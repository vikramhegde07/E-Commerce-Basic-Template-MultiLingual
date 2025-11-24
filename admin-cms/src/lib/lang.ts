// src/utils/lang.ts

export type Locale = "en" | "ar" | "zh";

/**
 * Reads current locale from localStorage (used by Axios interceptor).
 * Falls back to 'en' if not set.
 */
export function getCurrentLocale(): Locale {
    return (window.localStorage.getItem("admin.locale") as Locale) || "en";
}

/**
 * Updates locale persistently (useful if you ever need to set it outside context)
 */
export function setCurrentLocale(locale: Locale) {
    window.localStorage.setItem("admin.locale", locale);
}
