'use client';

import { useLanguage } from '@/context/LanguageContext';
import { LOCALES, type Locale } from '@/lib/locales';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    const handleChange = (next: Locale) => {
        if (next !== locale) setLocale(next);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-[var(--color-border)]"
                >
                    <Globe className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="capitalize">
                        {locale === 'en' ? 'English' : locale === 'ar' ? 'العربية' : '中文'}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuLabel className="text-xs text-[var(--color-text-light)]">
                    Select Language
                </DropdownMenuLabel>

                {LOCALES.map((lang) => (
                    <DropdownMenuItem
                        key={lang}
                        onClick={() => handleChange(lang)}
                        className={`cursor-pointer ${locale === lang
                                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]'
                                : 'hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-primary)]'
                            }`}
                    >
                        {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : '中文'}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
