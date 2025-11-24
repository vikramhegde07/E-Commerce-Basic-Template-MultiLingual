'use client';

import { useLanguage } from '@/context/LanguageContext';

type CompanyStoryProps = {
    paragraphs?: string[];
    highlights?: { year: string; title: string }[];
};

const TEXTS = {
    en: {
        title: 'Our Story & Legacy',
        paragraphs: [
            'Primeconnects integrates manufacturing and trade with a legacy of innovation and quality.',
            'Originally established in China, we expanded with a fully equipped UAE facility to serve the region with premium solutions.',
            'Today, we combine advanced R&D, disciplined quality control, and customer-first service across every project.'
        ],
    },
    ar: {
        title: 'قصتنا وإرثنا',
        paragraphs: [
            'تجمع برايم كونيكتس بين التصنيع والتجارة بإرث من الابتكار والجودة.',
            'بدأنا في الصين وتوسعنا بمصنع متكامل في الإمارات لخدمة المنطقة بحلول عالية الجودة.',
            'نجمع اليوم بين البحث والتطوير المتقدم وضبط الجودة والخدمة التي تركز على العميل في كل مشروع.'
        ],
    },
    zh: {
        title: '我们的故事与传承',
        paragraphs: [
            'Primeconnects 融合制造与贸易，传承创新与质量。',
            '公司起源于中国，并在阿联酋建立完善工厂，为区域市场提供高品质解决方案。',
            '我们以先进研发、严格质控与客户至上的服务推动每一个项目。'
        ],
    },
} as const;

export default function CompanyStory({
    paragraphs,
    highlights = [
        { year: '1999', title: 'Founded in China' },
        { year: '2015', title: 'Expanded product lines' },
        { year: '2024', title: 'UAE manufacturing unit' },
    ],
}: CompanyStoryProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const copy = paragraphs && paragraphs.length ? paragraphs : t.paragraphs;

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                    {t.title}
                </h2>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-4 text-[var(--color-text-light)] leading-relaxed">
                        {copy.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5">
                            <div className="text-sm font-semibold text-[var(--color-primary)] mb-3">Milestones</div>
                            <ul className="space-y-3">
                                {highlights.map((h, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]/80" />
                                        <div>
                                            <div className="text-sm font-medium text-[var(--color-text)]">{h.title}</div>
                                            <div className="text-xs text-[var(--color-text-light)]">{h.year}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}
