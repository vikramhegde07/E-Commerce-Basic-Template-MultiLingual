'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

type AboutSectionProps = {
    mediaSrc?: string;
    companyName?: string;
};

const TEXTS = {
    en: {
        eyebrow: 'About Us',
        title: 'A Global Legacy in Manufacturing Excellence',
        body1:
            'Primeconnects Doors & Cabinets Solutions is a multinational enterprise integrating manufacturing and trade, with a strong legacy of over 25 years in the industry. Originally established in China, our company has built a reputation for quality and innovation in architectural decoration and construction materials.',
        body2:
            'With a fully equipped manufacturing facility in the UAE, we proudly serve the region with premium-quality doors, panels, and cabinetry — supported by advanced R&D, skilled professionals, and a network of six factories across China and the UAE.',
        body3:
            'Our mission is to deliver durable, precision-crafted products that combine technology, craftsmanship, and design excellence.',
        cta: 'Discover More',
    },
    ar: {
        eyebrow: 'من نحن',
        title: 'إرث عالمي في التميز الصناعي',
        body1:
            'تُعد برايم كونيكتس لحلول الأبواب والخزائن مؤسسة متعددة الجنسيات تجمع بين الصناعة والتجارة، بخبرة تمتد لأكثر من 25 عامًا في مجال التصنيع. تأسست الشركة في الصين، وبنت سمعتها على الجودة والابتكار في مواد الديكور والبناء المعماري.',
        body2:
            'مع منشأة تصنيع متكاملة في دولة الإمارات العربية المتحدة، نقدم منتجات عالية الجودة من الأبواب والألواح والخزائن، مدعومة بالبحث والتطوير المتقدمين وشبكة مصانعنا الستة في الصين والإمارات.',
        body3:
            'مهمتنا هي تقديم منتجات متينة مصممة بعناية تجمع بين التكنولوجيا والحرفية والتميز في التصميم.',
        cta: 'اعرف المزيد',
    },
    zh: {
        eyebrow: '关于我们',
        title: '制造卓越的全球传承',
        body1:
            'Primeconnects 门柜解决方案是一家集制造与贸易为一体的跨国企业，在行业内拥有超过25年的辉煌历史。公司最初成立于中国，在建筑装饰与建材领域树立了质量与创新的声誉。',
        body2:
            '我们在阿联酋设立了完善的生产基地，为区域市场提供高品质的门、板材及橱柜产品，并依托先进的研发实力、专业技术团队及位于中阿两地的六家工厂。',
        body3:
            '我们的使命是打造耐用、精密的产品，将技术、工艺与设计完美融合。',
        cta: '了解更多',
    },
} as const;

export default function AboutSection({ mediaSrc = '/about-factory.jpg', companyName = 'Primeconnects' }: AboutSectionProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="relative py-16 md:py-24 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Image / Video */}
                <div className="relative order-2 lg:order-1">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl shadow-md border border-[var(--color-border)]">
                        <Image
                            src={mediaSrc}
                            alt={`${companyName} manufacturing unit`}
                            fill
                            className="object-cover transition-transform duration-700 ease-in-out hover:scale-105"
                            priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="order-1 lg:order-2">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-3">
                        {t.eyebrow}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4 leading-snug">
                        {t.title}
                    </h2>

                    <p className="text-[var(--color-text-light)] leading-relaxed mb-4">
                        {t.body1}
                    </p>
                    <p className="text-[var(--color-text-light)] leading-relaxed mb-4">
                        {t.body2}
                    </p>
                    <p className="text-[var(--color-text-light)] leading-relaxed mb-6">
                        {t.body3}
                    </p>

                    <Link href="/about">
                        <Button className="bg-[var(--color-primary)] text-white opacity-90 hover:opacity-100 transition-opacity duration-300">
                            {t.cta}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
