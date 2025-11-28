'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Building2, Home, Factory, School, Hospital, Hotel } from 'lucide-react';
import { JSX } from 'react';

type Item = { id: string; icon: JSX.Element; title: string; desc: string; href: string };

const TEXTS = {
    en: {
        eyebrow: 'Industries We Serve',
        title: 'Trusted Across Sectors',
        intro:
            'From commercial towers to private villas, Primeconnects delivers durable doors, engineered panels, and cabinet systems tailored to each application.',
        ctaPrimary: 'Discuss Your Project',
        ctaSecondary: 'View Products',
        items: {
            commercial: { title: 'Commercial Buildings', desc: 'Office towers, retail, mixed-use developments', href: '/categories/doors' },
            hospitality: { title: 'Hospitality', desc: 'Hotels, resorts, serviced apartments', href: '/categories/doors' },
            education: { title: 'Education', desc: 'Schools, universities, training centers', href: '/categories/panels' },
            healthcare: { title: 'Healthcare', desc: 'Hospitals, clinics, labs', href: '/categories/doors' },
            industrial: { title: 'Industrial', desc: 'Warehouses, plants, logistics hubs', href: '/categories/panels' },
            residential: { title: 'Residential', desc: 'Villas, apartments, communities', href: '/categories/cabinets' },
        },
    },
    ar: {
        eyebrow: 'القطاعات التي نخدمها',
        title: 'موثوق بنا عبر مختلف القطاعات',
        intro:
            'من الأبراج التجارية إلى الفلل الخاصة، تقدم برايم كونيكتس أبوابًا متينة وألواحًا هندسية وأنظمة خزائن مصممة لكل استخدام.',
        ctaPrimary: 'ناقش مشروعك',
        ctaSecondary: 'عرض المنتجات',
        items: {
            commercial: { title: 'المباني التجارية', desc: 'مكاتب، محلات، مشاريع متعددة الاستخدام', href: '/categories/doors' },
            hospitality: { title: 'الضيافة', desc: 'فنادق، منتجعات، شقق فندقية', href: '/categories/doors' },
            education: { title: 'التعليم', desc: 'مدارس، جامعات، مراكز تدريب', href: '/categories/panels' },
            healthcare: { title: 'الرعاية الصحية', desc: 'مستشفيات، عيادات، مختبرات', href: '/categories/doors' },
            industrial: { title: 'الصناعي', desc: 'مستودعات، مصانع، مراكز لوجستية', href: '/categories/panels' },
            residential: { title: 'السكني', desc: 'فلل، شقق، مجمعات', href: '/categories/cabinets' },
        },
    },
    zh: {
        eyebrow: '服务行业',
        title: '广受各领域信赖',
        intro:
            '从商业高楼到私宅别墅，Primeconnects 为不同应用提供耐用门类、工程板材与柜体系统。',
        ctaPrimary: '咨询您的项目',
        ctaSecondary: '查看产品',
        items: {
            commercial: { title: '商业建筑', desc: '写字楼、零售、综合体', href: '/categories/doors' },
            hospitality: { title: '酒店业', desc: '酒店、度假村、服务式公寓', href: '/categories/doors' },
            education: { title: '教育领域', desc: '学校、大学、培训中心', href: '/categories/panels' },
            healthcare: { title: '医疗健康', desc: '医院、诊所、实验室', href: '/categories/doors' },
            industrial: { title: '工业场所', desc: '仓库、工厂、物流园', href: '/categories/panels' },
            residential: { title: '住宅', desc: '别墅、公寓、社区', href: '/categories/cabinets' },
        },
    },
} as const;

export default function IndustriesServed() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const items: Item[] = [
        { id: 'commercial', icon: <Building2 className="w-5 h-5" />, title: t.items.commercial.title, desc: t.items.commercial.desc, href: t.items.commercial.href },
        { id: 'hospitality', icon: <Hotel className="w-5 h-5" />, title: t.items.hospitality.title, desc: t.items.hospitality.desc, href: t.items.hospitality.href },
        { id: 'education', icon: <School className="w-5 h-5" />, title: t.items.education.title, desc: t.items.education.desc, href: t.items.education.href },
        { id: 'healthcare', icon: <Hospital className="w-5 h-5" />, title: t.items.healthcare.title, desc: t.items.healthcare.desc, href: t.items.healthcare.href },
        { id: 'industrial', icon: <Factory className="w-5 h-5" />, title: t.items.industrial.title, desc: t.items.industrial.desc, href: t.items.industrial.href },
        { id: 'residential', icon: <Home className="w-5 h-5" />, title: t.items.residential.title, desc: t.items.residential.desc, href: t.items.residential.href },
    ];

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg-alt)]" dir={dir}>
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
                    {items.map((it) => (
                        <div
                            className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm transition-transform duration-500 hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
                                    {it.icon}
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors duration-300">
                                        {it.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[var(--color-text-light)]">
                                        {it.desc}
                                    </p>
                                    <span className="mt-3 inline-block text-xs font-medium text-[var(--color-primary)] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                        →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href="/contact">
                        <Button className="bg-[var(--color-primary)] text-white opacity-90 hover:opacity-100 transition-opacity duration-300">
                            {t.ctaPrimary}
                        </Button>
                    </Link>
                    <Link href="/products">
                        <Button variant="outline">{t.ctaSecondary}</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
