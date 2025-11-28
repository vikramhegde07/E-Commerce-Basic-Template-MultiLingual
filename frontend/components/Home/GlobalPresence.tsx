'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Building2, Globe2, MapPin, ShieldCheck } from 'lucide-react';

type Factory = {
    id: string;
    name: string;
    city: string;
    country: 'UAE' | 'China';
    badge?: string;
};

const TEXTS = {
    en: {
        eyebrow: 'Global Presence',
        title: '6 Factories. 2 Countries. One Standard of Excellence.',
        intro:
            'Primeconnects operates a multinational manufacturing network across the UAE and China, ensuring consistent quality, reliable supply, and regional responsiveness.',
        uae: 'United Arab Emirates',
        cn: 'China',
        visit: 'Visit Our Facilities',
        contact: 'Contact Sales',
        quality: 'ISO-aligned quality processes',
        logistics: 'Reliable regional logistics',
        customization: 'Custom solutions for projects',
    },
    ar: {
        eyebrow: 'التواجد العالمي',
        title: '6 مصانع. دولتان. معيار واحد للتميز.',
        intro:
            'تدير برايم كونيكتس شبكة تصنيع متعددة الجنسيات في الإمارات والصين لضمان جودة ثابتة وتوريد موثوق واستجابة إقليمية.',
        uae: 'الإمارات العربية المتحدة',
        cn: 'الصين',
        visit: 'زيارة مصانعنا',
        contact: 'تواصل مع المبيعات',
        quality: 'عمليات جودة متوافقة مع ISO',
        logistics: 'لوجستيات إقليمية موثوقة',
        customization: 'حلول مخصصة للمشاريع',
    },
    zh: {
        eyebrow: '全球布局',
        title: '6家工厂 · 2个国家 · 同一品质标准',
        intro:
            'Primeconnects 在阿联酋与中国建立跨国制造网络，确保稳定品质、可靠供给与本地化响应。',
        uae: '阿拉伯联合酋长国',
        cn: '中国',
        visit: '参观我们的工厂',
        contact: '联系销售',
        quality: '符合 ISO 的质量流程',
        logistics: '可靠的区域物流',
        customization: '工程项目定制方案',
    },
} as const;

const FACTORIES_EN: Factory[] = [
    { id: 'uae-door', name: 'Door Factory', city: '—', country: 'UAE', badge: 'UAE' },
    { id: 'cn-wpc', name: 'WPC Factory', city: 'Jiangxi', country: 'China', badge: 'CN' },
    { id: 'cn-wood', name: 'Wooden Door Factory', city: 'Zhejiang', country: 'China', badge: 'CN' },
    { id: 'cn-cabinet', name: 'Cabinet Factory', city: 'Zhejiang', country: 'China', badge: 'CN' },
    { id: 'cn-steel', name: 'Steel Entrance Door Factory', city: 'Zhejiang', country: 'China', badge: 'CN' },
    { id: 'cn-fire', name: 'Fireproof Door Factory', city: 'Shanghai', country: 'China', badge: 'CN' },
];

const FACTORIES_AR: Factory[] = [
    { id: 'uae-door', name: 'مصنع الأبواب', city: '—', country: 'UAE', badge: 'الإمارات' },
    { id: 'cn-wpc', name: 'مصنع أبواب WPC', city: 'جيانغشي', country: 'China', badge: 'الصين' },
    { id: 'cn-wood', name: 'مصنع الأبواب الخشبية', city: 'تشجيانغ', country: 'China', badge: 'الصين' },
    { id: 'cn-cabinet', name: 'مصنع الخزائن', city: 'تشجيانغ', country: 'China', badge: 'الصين' },
    { id: 'cn-steel', name: 'مصنع الأبواب الفولاذية', city: 'تشجيانغ', country: 'China', badge: 'الصين' },
    { id: 'cn-fire', name: 'مصنع الأبواب المقاومة للحريق', city: 'شنغهاي', country: 'China', badge: 'الصين' },
];

const FACTORIES_ZH: Factory[] = [
    { id: 'uae-door', name: '阿联酋门厂', city: '—', country: 'UAE', badge: '阿联酋' },
    { id: 'cn-wpc', name: 'WPC 门厂', city: '江西', country: 'China', badge: '中国' },
    { id: 'cn-wood', name: '木门厂', city: '浙江', country: 'China', badge: '中国' },
    { id: 'cn-cabinet', name: '橱柜厂', city: '浙江', country: 'China', badge: '中国' },
    { id: 'cn-steel', name: '钢制入户门厂', city: '浙江', country: 'China', badge: '中国' },
    { id: 'cn-fire', name: '防火门厂', city: '上海', country: 'China', badge: '中国' },
];

export default function GlobalPresence() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];
    const factories =
        locale === 'ar' ? FACTORIES_AR : locale === 'zh' ? FACTORIES_ZH : FACTORIES_EN;

    const uae = factories.filter((f) => f.country === 'UAE');
    const cn = factories.filter((f) => f.country === 'China');

    return (
        <section className="py-16 md:py-24 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="max-w-3xl">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-3">
                        <Globe2 className="w-4 h-4" />
                        {t.eyebrow}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                        {t.title}
                    </h2>
                    <p className="mt-3 text-[var(--color-text-light)]">{t.intro}</p>
                </div>

                {/* Feature chips */}
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1">
                        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                        {t.quality}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1">
                        <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                        {t.customization}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1">
                        <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                        {t.logistics}
                    </span>
                </div>

                {/* Grids: UAE & China */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* UAE */}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{t.uae}</h3>
                            <span className="text-xs text-[var(--color-text-light)]">({uae.length})</span>
                        </div>
                        <ul className="divide-y">
                            {uae.map((f) => (
                                <li key={f.id} className="py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{f.name}</div>
                                            <div className="text-xs text-[var(--color-text-light)]">
                                                {f.city === '—' ? t.uae : `${f.city}, ${t.uae}`}
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                            {f.badge}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* China */}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{t.cn}</h3>
                            <span className="text-xs text-[var(--color-text-light)]">({cn.length})</span>
                        </div>
                        <ul className="divide-y">
                            {cn.map((f) => (
                                <li key={f.id} className="py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{f.name}</div>
                                            <div className="text-xs text-[var(--color-text-light)]">
                                                {f.city}, {t.cn}
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                            {f.badge}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* CTA Row */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href="/contact">
                        <Button variant="outline">{t.contact}</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
