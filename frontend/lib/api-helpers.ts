// lib/api-helpers.ts
import { api } from './axios';
import type { Locale } from './locales';

type AnyObj = Record<string, any>;

export function withLocaleParams(params: AnyObj | undefined, locale: Locale) {
    return { ...(params ?? {}), locale };
}

// Example wrappers (optional)
export const getWithLocale = <T = any>(url: string, params: AnyObj | undefined, locale: Locale) =>
    api.get<T>(url, { params: withLocaleParams(params, locale) });

export const postWithLocale = <T = any>(url: string, data: any, locale: Locale, params?: AnyObj) =>
    api.post<T>(url, data, { params: withLocaleParams(params, locale) });
