'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, dirFor, detectInitialLocale } from '@/lib/locales';

type LangCtx = {
    locale: Locale;
    dir: 'ltr' | 'rtl';
    setLocale: (l: Locale) => void;
};

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>(detectInitialLocale());

    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute('lang', locale);
        html.setAttribute('dir', dirFor(locale));
        document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 180}`;
    }, [locale]);

    const value = useMemo(() => ({ locale, dir: dirFor(locale) as 'ltr' | 'rtl', setLocale }), [locale]);
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
