'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Phone, Mail } from 'lucide-react';

type ContactCTAProps = {
    uaeAddress?: string;
    phone?: string;
    email?: string;
};

const TEXTS = {
    en: {
        title: 'Visit Our Facilities or Speak with Sales',
        sub: 'We welcome partners and clients to explore collaboration opportunities.',
        visit: 'Book a Factory Visit',
        quote: 'Request Quote',
    },
    ar: {
        title: 'زوروا مرافقنا أو تحدثوا مع فريق المبيعات',
        sub: 'نرحب بالشركاء والعملاء لاستكشاف فرص التعاون.',
        visit: 'حجز زيارة للمصنع',
        quote: 'طلب عرض سعر',
    },
    zh: {
        title: '参观工厂或联系销售团队',
        sub: '欢迎全球合作伙伴前来洽谈合作机会。',
        visit: '预约参观工厂',
        quote: '获取报价',
    },
} as const;

export default function ContactCTA({
    uaeAddress = 'Industrial Area, UAE',
    phone = '+971-000-0000',
    email = 'sales@primeconnects.com',
}: ContactCTAProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="py-16 md:py-20 bg-[var(--color-primary)] text-white" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold">{t.title}</h2>
                <p className="mt-2 opacity-90">{t.sub}</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="rounded-2xl bg-white/10 p-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            <div className="font-medium">UAE</div>
                        </div>
                        <div className="mt-2 text-sm opacity-90">{uaeAddress}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            <a className="underline-offset-2 hover:underline" href={`tel:${phone}`}>{phone}</a>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            <a className="underline-offset-2 hover:underline" href={`mailto:${email}`}>{email}</a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href="/contact">
                        <Button className="bg-white text-[var(--color-primary)] hover:opacity-90 transition-opacity duration-300">
                            {t.visit}
                        </Button>
                    </Link>
                    <Link href="/contact">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">
                            {t.quote}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
