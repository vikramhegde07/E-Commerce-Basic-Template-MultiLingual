'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';

type Category = {
    id: string | number;
    slug: string;
    name: string;
    image_url?: string | null;
    parent_id?: string | number | null;
};

const TEXTS = {
    en: {
        eyebrow: 'Our Solutions',
        title: 'Explore Our Product Range',
        intro:
            'From precision-built doors to engineered panels and bespoke cabinetry, we deliver reliable solutions for residential and commercial projects.',
        viewAll: 'View all categories',
    },
    ar: {
        eyebrow: 'حلولنا',
        title: 'استكشف مجموعتنا من المنتجات',
        intro:
            'من الأبواب المصنوعة بدقة إلى الألواح الهندسية والخزائن المصممة خصيصًا، نقدم حلولًا موثوقة للمشاريع السكنية والتجارية.',
        viewAll: 'عرض جميع الفئات',
    },
    zh: {
        eyebrow: '我们的方案',
        title: '探索产品系列',
        intro:
            '从精工制造的门到工程板材与定制橱柜，我们为住宅与商业项目提供可靠方案。',
        viewAll: '查看全部分类',
    },
} as const;

export default function ProductRange() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/public/categories', {
                    params: { locale, limit: 6, sortBy: 'sort_order', order: 'ASC' },
                });
                const list: Category[] = (res.data?.data ?? []).filter((c: Category) => !c.parent_id);
                if (mounted) setItems(list.slice(0, 6));
            } catch {
                // graceful fallback (static suggestions)
                if (mounted) {
                    setItems([
                        { id: 'doors', slug: 'doors', name: locale === 'ar' ? 'الأبواب' : locale === 'zh' ? '门类' : 'Doors' },
                        { id: 'cabinets', slug: 'cabinets', name: locale === 'ar' ? 'الخزائن' : locale === 'zh' ? '橱柜' : 'Cabinets' },
                        { id: 'panels', slug: 'panels', name: locale === 'ar' ? 'الألواح' : locale === 'zh' ? '板材' : 'Panels' },
                    ]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [locale]);

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="max-w-3xl">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-3">
                        {t.eyebrow}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                        {t.title}
                    </h2>
                    <p className="mt-3 text-[var(--color-text-light)]">
                        {t.intro}
                    </p>
                </div>

                {/* Grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items?.map((c, idx) => (
                        <Link
                            key={loading ? idx : c.id}
                            href={loading ? '#' : `/categories/${(c as Category).slug}`}
                            className={[
                                'group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)]',
                                'shadow-sm transition-transform duration-500 hover:-translate-y-1',
                                loading ? 'pointer-events-none' : '',
                            ].join(' ')}
                        >
                            {/* Media */}
                            <div className="relative w-full aspect-[16/10] bg-white">
                                {loading ? (
                                    <div className="absolute inset-0 animate-pulse bg-[var(--color-bg-alt)]" />
                                ) : (c as Category).image_url ? (
                                    <Image
                                        src={process.env.NEXT_PUBLIC_API_BASE_URL! + (c as Category).image_url as string}
                                        alt={(c as Category).name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 grid place-items-center">
                                        <div className="h-10 w-10 rounded-lg bg-[var(--color-primary)]/10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>

                            {/* Caption */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text)]">
                                        {loading ? (
                                            <span className="inline-block h-4 w-24 rounded bg-[var(--color-bg-alt)] animate-pulse" />
                                        ) : (
                                            (c as Category).name
                                        )}
                                    </h3>
                                    <span className="text-xs font-medium text-[var(--color-primary)] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                        →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-8">
                    <Link href="/categories">
                        <Button variant="outline" className="border-[var(--color-border)] hover:border-[var(--color-primary)]">
                            {t.viewAll}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
