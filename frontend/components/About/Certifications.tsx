'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

type Cert = { name: string; logo?: string; fileUrl?: string };
type CertificationsProps = {
    certs?: Cert[];
};

const TEXTS = {
    en: { title: 'Certifications & Compliance', intro: 'Our processes align with international standards for safety and quality.', downloadAll: 'Download Profile' },
    ar: { title: 'الشهادات والامتثال', intro: 'عملياتنا متوافقة مع المعايير الدولية للسلامة والجودة.', downloadAll: 'تحميل الملف التعريفي' },
    zh: { title: '认证与合规', intro: '我们的流程符合国际安全与质量标准。', downloadAll: '下载公司资料' },
} as const;

export default function Certifications({
    certs = [
        { name: 'ISO 9001', logo: '/certs/iso9001.png' },
        { name: 'ISO 14001', logo: '/certs/iso14001.png' },
        { name: 'CE', logo: '/certs/ce.png' },
        { name: 'FSC', logo: '/certs/fsc.png' },
    ],
}: CertificationsProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.title}</h2>
                <p className="mt-3 text-[var(--color-text-light)]">{t.intro}</p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {certs.map((c, i) => (
                        <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 grid place-items-center hover:shadow-sm transition-shadow">
                            {c.logo ? (
                                <Image src={c.logo} alt={c.name} width={120} height={120} className="opacity-80" />
                            ) : (
                                <div className="text-sm text-[var(--color-text-light)]">{c.name}</div>
                            )}
                            <div className="mt-3 text-xs text-[var(--color-text)]">{c.name}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <Link href="/downloads/company-profile.pdf">
                        <Button variant="outline">{t.downloadAll}</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
