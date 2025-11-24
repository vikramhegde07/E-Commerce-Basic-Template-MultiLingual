'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, FlaskConical, Settings2, ShieldCheck, BadgeCheck, Ruler, Layers } from 'lucide-react';
import Link from 'next/link';
import { JSX } from 'react';

type Feature = { id: string; icon: JSX.Element; title: string; desc: string };

const TEXTS = {
    en: {
        eyebrow: 'R&D • Quality • Customization',
        title: 'Engineered for Performance. Built for Longevity.',
        intro:
            'From material research to final inspection, Primeconnects combines advanced R&D, stringent quality assurance, and tailored manufacturing to meet project specifications with confidence.',
        features: {
            rnd: { title: 'Advanced R&D', desc: 'In-house material testing and continuous product improvement for demanding environments.' },
            qa: { title: 'Quality Assurance', desc: 'ISO-aligned processes, batch traceability, and multi-stage inspections at every factory.' },
            custom: { title: 'Custom Manufacturing', desc: 'Door sizes, cores, finishes, and cabinet modules tailored to architect/designer specs.' },
            compliance: { title: 'Compliance & Safety', desc: 'Fire-rating options and regional code compliance supported by documentation.' },
            precision: { title: 'Precision & Fit', desc: 'CNC machining and controlled tolerances ensure clean installation and long-term stability.' },
            materials: { title: 'Material Options', desc: 'MDF, MR MDF, WPC, marine & construction plywood, melamine/film-faced boards.' },
        },
        bullets: ['Multi-factory QA checkpoints', 'Rapid prototyping for special specs', 'Technical drawings & submittals support'],
        ctaPrimary: 'Request Specs',
        ctaSecondary: 'View Products',
    },
    ar: {
        eyebrow: 'البحث والتطوير • الجودة • التخصيص',
        title: 'مصمم للأداء. مبني ليدوم.',
        intro:
            'من بحث المواد إلى الفحص النهائي، تجمع برايم كونيكتس بين البحث والتطوير المتقدم وضمان الجودة الصارم والتصنيع المخصص لتلبية متطلبات المشاريع بثقة.',
        features: {
            rnd: { title: 'بحث وتطوير متقدم', desc: 'اختبارات مواد داخلية وتحسين مستمر للمنتجات للبيئات الصعبة.' },
            qa: { title: 'ضمان الجودة', desc: 'عمليات متوافقة مع ISO وتتبع للدفعات وفحوصات متعددة المراحل في كل مصنع.' },
            custom: { title: 'تصنيع مخصص', desc: 'مقاسات الأبواب والأنواع والتشطيبات ووحدات الخزائن حسب مواصفات المعماري/المصمم.' },
            compliance: { title: 'الامتثال والسلامة', desc: 'خيارات مقاومة الحريق والالتزام بالأنظمة المحلية مع وثائق داعمة.' },
            precision: { title: 'الدقة والتركيب', desc: 'تصنيع CNC وهوامش سماح مضبوطة لضمان تركيب نظيف وثبات طويل الأمد.' },
            materials: { title: 'خيارات المواد', desc: 'ألواح MDF وMR MDF وWPC وخشب معالج بحري وإنشائي وألواح مكسوة ميلامين/فيلم.' },
        },
        bullets: ['نقاط فحص جودة متعددة', 'نماذج أولية سريعة للمواصفات الخاصة', 'رسومات فنية ومستندات اعتماد'],
        ctaPrimary: 'طلب المواصفات',
        ctaSecondary: 'عرض المنتجات',
    },
    zh: {
        eyebrow: '研发 • 质量 • 定制',
        title: '为性能而设计，为耐久而造。',
        intro:
            '从材料研究到最终检验，Primeconnects 以先进研发、严格质控与定制化生产，可靠满足工程规范与项目需求。',
        features: {
            rnd: { title: '先进研发', desc: '内部材料测试与持续改进，适应严苛应用场景。' },
            qa: { title: '质量保证', desc: '对标 ISO 的流程、批次追溯、全流程多点检验。' },
            custom: { title: '定制制造', desc: '门体尺寸、芯材、饰面与柜体模组按设计规范灵活定制。' },
            compliance: { title: '合规与安全', desc: '提供耐火等级方案与本地规范合规文件。' },
            precision: { title: '精度与安装', desc: 'CNC 加工与严格公差，确保安装整洁与长期稳定。' },
            materials: { title: '材料选择', desc: 'MDF、MR MDF、WPC、海洋/建筑胶合板、三聚氰胺/覆膜板。' },
        },
        bullets: ['多工厂质检节点', '特殊规格快速打样', '技术图纸与报批资料支持'],
        ctaPrimary: '索取技术规格',
        ctaSecondary: '查看产品',
    },
} as const;

export default function QualityAndRnD() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const features: Feature[] = [
        { id: 'rnd', icon: <FlaskConical className="w-5 h-5" />, title: t.features.rnd.title, desc: t.features.rnd.desc },
        { id: 'qa', icon: <ClipboardCheck className="w-5 h-5" />, title: t.features.qa.title, desc: t.features.qa.desc },
        { id: 'custom', icon: <Settings2 className="w-5 h-5" />, title: t.features.custom.title, desc: t.features.custom.desc },
        { id: 'compliance', icon: <ShieldCheck className="w-5 h-5" />, title: t.features.compliance.title, desc: t.features.compliance.desc },
        { id: 'precision', icon: <Ruler className="w-5 h-5" />, title: t.features.precision.title, desc: t.features.precision.desc },
        { id: 'materials', icon: <Layers className="w-5 h-5" />, title: t.features.materials.title, desc: t.features.materials.desc },
    ];

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

                {/* Feature grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f) => (
                        <div
                            key={f.id}
                            className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5 shadow-sm transition-transform duration-500 hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
                                    {f.icon}
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors duration-300">
                                        {f.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[var(--color-text-light)]">
                                        {f.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Proof bullets */}
                <ul className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {t.bullets.map((b, i) => (
                        <li key={i} className="inline-flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-[var(--color-primary)]" />
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>

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
