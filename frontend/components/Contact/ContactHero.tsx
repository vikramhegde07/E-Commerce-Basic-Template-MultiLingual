'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const TEXTS = {
    en: {
        eyebrow: 'Contact Us',
        title: 'We’re here to help',
        sub: 'Tell us about your project — doors, panels, or cabinetry — and we’ll get back within one business day.',
        cta: 'Request a Quote',
    },
    ar: {
        eyebrow: 'اتصل بنا',
        title: 'نحن هنا لخدمتك',
        sub: 'أخبرنا عن مشروعك — أبواب، ألواح، أو خزائن — وسنعاود الاتصال خلال يوم عمل واحد.',
        cta: 'طلب عرض سعر',
    },
    zh: {
        eyebrow: '联系我们',
        title: '随时为您提供支持',
        sub: '告诉我们您的项目需求（门、板材或柜体），我们将在一个工作日内回复。',
        cta: '获取报价',
    },
} as const;

export default function ContactHero() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="relative overflow-hidden bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(80%_60%_at_50%_0%,rgba(16,24,40,0.06),transparent_60%)]" />
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative">
                <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                    {t.eyebrow}
                </span>
                <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[var(--color-text)]">
                    {t.title}
                </h1>
                <p className="mt-3 max-w-2xl text-[var(--color-text-light)]">
                    {t.sub}
                </p>
                <div className="mt-6">
                    <Link href="/contact">
                        <Button className="bg-[var(--color-primary)] text-white opacity-90 hover:opacity-100 transition-opacity duration-300">
                            {t.cta}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
