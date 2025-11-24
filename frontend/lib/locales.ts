// lib/locales.ts
export type Locale = 'en' | 'ar' | 'zh';
export const LOCALES: Locale[] = ['en', 'ar', 'zh'];
export const DEFAULT_LOCALE: Locale = 'en';

export const isRTL = (l: Locale) => l === 'ar';
export const dirFor = (l: Locale) => (isRTL(l) ? 'rtl' : 'ltr');

export function detectInitialLocale(): Locale {
    // 1) cookie
    if (typeof document !== 'undefined') {
        const c = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('locale='));
        const val = c?.split('=')[1] as Locale | undefined;
        if (val && LOCALES.includes(val)) return val;
    }
    // 2) browser language
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language.toLowerCase();
        if (lang.includes('ar')) return 'ar';
        if (lang.includes('zh')) return 'zh';
    }
    return DEFAULT_LOCALE;
}
