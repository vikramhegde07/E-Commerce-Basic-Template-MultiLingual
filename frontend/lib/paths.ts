// lib/paths.ts
import { LOCALES, type Locale } from './locales';

export function swapLocaleInPath(pathname: string, next: Locale) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return `/${next}`;
    if (LOCALES.includes(parts[0] as Locale)) parts[0] = next; else parts.unshift(next);
    return '/' + parts.join('/');
}
