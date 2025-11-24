'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

type Logo = { name: string; src: string };
type PartnersClientsProps = { logos?: Logo[] };

const TEXTS = {
    en: { title: 'Partners & Clients', intro: 'Trusted by builders, contractors, and brands across the region.' },
    ar: { title: 'الشركاء والعملاء', intro: 'موثوق به من قبل المطورين والمقاولين والعلامات التجارية في المنطقة.' },
    zh: { title: '合作伙伴与客户', intro: '深受区域内开发商、承包商与品牌信赖。' },
} as const;

export default function PartnersClients({
    logos = [
        { name: 'Client A', src: '/logos/client-a.png' },
        { name: 'Client B', src: '/logos/client-b.png' },
        { name: 'Client C', src: '/logos/client-c.png' },
        { name: 'Client D', src: '/logos/client-d.png' },
        { name: 'Client E', src: '/logos/client-e.png' },
        { name: 'Client F', src: '/logos/client-f.png' },
    ],
}: PartnersClientsProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.title}</h2>
                <p className="mt-3 text-[var(--color-text-light)]">{t.intro}</p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
                    {logos.map((l, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 grid place-items-center"
                        >
                            <Image
                                src={l.src}
                                alt={l.name}
                                width={120}
                                height={60}
                                className="opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
