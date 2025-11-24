// src/context/LangContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Locale = "en" | "ar" | "zh"; // extend later
type LangCtx = {
    locale: Locale;
    setLocale: (l: Locale) => void;
    isRTL: boolean;
};

const Ctx = createContext<LangCtx | null>(null);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem("admin.locale") as Locale) || "en");
    useEffect(() => { localStorage.setItem("admin.locale", locale); }, [locale]);
    const isRTL = locale === "ar";
    const value = useMemo(() => ({ locale, setLocale, isRTL }), [locale, isRTL]);

    // mirror document direction for better UX
    useEffect(() => { document.documentElement.dir = isRTL ? "rtl" : "ltr"; }, [isRTL]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLang = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("useLang must be used within LangProvider");
    return v;
};
