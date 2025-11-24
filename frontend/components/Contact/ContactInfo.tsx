'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

const TEXTS = {
    en: {
        title: 'Dubai Office',
        addressLabel: 'Address',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        hoursLabel: 'Hours',
        address: 'Industrial Area, Dubai, UAE',
        phone: '+971-000-0000',
        email: 'sales@primeconnects.com',
        hours: 'Mon–Fri, 9:00–18:00',
        mapCta: 'Open in Google Maps',
    },
    ar: {
        title: 'مكتب دبي',
        addressLabel: 'العنوان',
        phoneLabel: 'الهاتف',
        emailLabel: 'البريد الإلكتروني',
        hoursLabel: 'ساعات العمل',
        address: 'المنطقة الصناعية، دبي، الإمارات',
        phone: '+971-000-0000',
        email: 'sales@primeconnects.com',
        hours: 'الاثنين–الجمعة، 9:00–18:00',
        mapCta: 'فتح في خرائط جوجل',
    },
    zh: {
        title: '迪拜办公室',
        addressLabel: '地址',
        phoneLabel: '电话',
        emailLabel: '邮箱',
        hoursLabel: '时间',
        address: '阿联酋 迪拜 工业区',
        phone: '+971-000-0000',
        email: 'sales@primeconnects.com',
        hours: '周一至周五 9:00–18:00',
        mapCta: '在谷歌地图打开',
    },
} as const;

export default function ContactInfo() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    // Replace with your real Google Maps place link
    const mapsHref = 'https://maps.google.com/?q=Dubai+Industrial+Area';

    return (
        <section className="py-14 md:py-20 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">{t.title}</h2>
                    <ul className="mt-4 space-y-4 text-sm">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.addressLabel}</div>
                                <div className="text-[var(--color-text-light)]">{t.address}</div>
                                <Link href={mapsHref} target="_blank" className="text-[var(--color-primary)] underline underline-offset-2">
                                    {t.mapCta}
                                </Link>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.phoneLabel}</div>
                                <a href={`tel:${t.phone}`} className="text-[var(--color-text-light)]">{t.phone}</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.emailLabel}</div>
                                <a href={`mailto:${t.email}`} className="text-[var(--color-text-light)]">{t.email}</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.hoursLabel}</div>
                                <div className="text-[var(--color-text-light)]">{t.hours}</div>
                            </div>
                        </li>
                    </ul>
                </Card>

                {/* Optional: simple map embed placeholder (replace src with your map embed) */}
                <Card className="p-0 overflow-hidden">
                    <div className="relative w-full aspect-[16/10] bg-[var(--color-bg-alt)]">
                        <iframe
                            title="Dubai Map"
                            className="absolute inset-0 h-full w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.google.com/maps?q=Dubai%20Industrial%20Area&output=embed"
                        />
                    </div>
                </Card>
            </div>
        </section>
    );
}
