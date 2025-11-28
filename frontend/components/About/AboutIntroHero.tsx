'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

type Stat = { label: string; value: string };
type AboutIntroHeroProps = {
    headline?: string;
    subhead?: string;
    stats?: Stat[];
};

const TEXTS = {
    en: {
        headline: 'About Primeconnects',
        subhead: 'A multinational manufacturer of doors, panels, and cabinetry with 25+ years of excellence.',
        ctaPrimary: 'Request Quote',
        ctaSecondary: 'Contact Us',
    },
    ar: {
        headline: 'نبذة عن برايم كونيكتس',
        subhead: 'شركة تصنيع متعددة الجنسيات للأبواب والألواح والخزائن بخبرة تتجاوز 25 عامًا.',
        ctaPrimary: 'طلب عرض سعر',
        ctaSecondary: 'تواصل معنا',
    },
    zh: {
        headline: '关于 Primeconnects',
        subhead: '拥有 25+ 年经验的跨国门类、板材与柜体制造企业。',
        ctaPrimary: '获取报价',
        ctaSecondary: '联系我们',
    },
} as const;

export default function AboutIntroHero({
    headline,
    subhead,
    stats = [
        { value: '25+', label: 'Years of manufacturing' },
        { value: '6', label: 'Factories in UAE & China' },
        { value: '1000+', label: 'Projects delivered' },
    ],
}: AboutIntroHeroProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="relative overflow-hidden bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
                    {headline ?? t.headline}
                </h1>
                <p className="mt-3 text-[var(--color-text-light)] max-w-3xl">
                    {subhead ?? t.subhead}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/contact">
                        <Button variant="outline">{t.ctaSecondary}</Button>
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-3xl">
                    {stats.map((s, i) => (
                        <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
                            <div className="text-2xl font-bold text-[var(--color-primary)]">{s.value}</div>
                            <div className="text-sm text-[var(--color-text-light)]">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
