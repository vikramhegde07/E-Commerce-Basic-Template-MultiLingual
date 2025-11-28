'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const TEXTS = {
    en: {
        title: 'Dubai Office',
        addressLabel: 'Address',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        contactPersonLabel: 'Contact Person',
        address: 'Warehouse No.8, Industrial area 18, Warehouse land Maliha Road Sharjah-UAE',
        phone: '+971 06 573 3816',
        email: 'sales@primeconnects.ae',

        personName: 'Abde Mostafa',
        personPhone: '+917 58 912 6137',
        personEmail: 'abde@primeconnects.ae',

        mapCta: 'Open in Google Maps',
    },
    ar: {
        title: 'مكتب دبي',
        addressLabel: 'العنوان',
        phoneLabel: 'الهاتف',
        emailLabel: 'البريد الإلكتروني',
        contactPersonLabel: 'المسؤول',
        address: 'المستودع رقم 8، المنطقة الصناعية 18، أرض المستودعات طريق مليحة، الشارقة – الإمارات',
        phone: '+971 06 573 3816',
        email: 'sales@primeconnects.ae',

        personName: 'عبده مصطفى',
        personPhone: '+917 58 912 6137',
        personEmail: 'abde@primeconnects.ae',

        mapCta: 'فتح في خرائط جوجل',
    },
    zh: {
        title: '迪拜办公室',
        addressLabel: '地址',
        phoneLabel: '电话',
        emailLabel: '邮箱',
        contactPersonLabel: '联系人',
        address: '8号仓库，工业区18，Maliha公路仓库用地，阿联酋沙迦',
        phone: '+971 06 573 3816',
        email: 'sales@primeconnects.ae',

        personName: 'Abde Mostafa',
        personPhone: '+917 58 912 6137',
        personEmail: 'abde@primeconnects.ae',

        mapCta: '在谷歌地图打开',
    },
} as const;

export default function ContactInfo() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const mapsHref = 'https://maps.app.goo.gl/qngssaczjTuqDNqy7';

    return (
        <section className="py-14 md:py-20 bg-[var(--color-bg)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Info Left Card */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">{t.title}</h2>

                    <ul className="mt-4 space-y-6 text-sm">

                        {/* Address */}
                        <li className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.addressLabel}</div>
                                <div className="text-[var(--color-text-light)]">{t.address}</div>
                                <Link
                                    href={mapsHref}
                                    target="_blank"
                                    className="text-[var(--color-primary)] underline underline-offset-2"
                                >
                                    {t.mapCta}
                                </Link>
                            </div>
                        </li>

                        {/* Main Office Phone */}
                        <li className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.phoneLabel}</div>
                                <a
                                    href={`tel:${t.phone.replace(/\s+/g, '')}`}
                                    className="text-[var(--color-text-light)]"
                                >
                                    {t.phone}
                                </a>
                            </div>
                        </li>

                        {/* Main Office Email */}
                        <li className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.emailLabel}</div>
                                <a href={`mailto:${t.email}`} className="text-[var(--color-text-light)]">
                                    {t.email}
                                </a>
                            </div>
                        </li>

                        {/* Contact Person */}
                        <li className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                            <div>
                                <div className="font-medium">{t.contactPersonLabel}</div>

                                <div className="text-[var(--color-text)] font-medium">
                                    {t.personName}
                                </div>

                                <a
                                    href={`tel:${t.personPhone.replace(/\s+/g, '')}`}
                                    className="text-[var(--color-text-light)] block"
                                >
                                    {t.personPhone}
                                </a>

                                <a
                                    href={`mailto:${t.personEmail}`}
                                    className="text-[var(--color-text-light)] block"
                                >
                                    {t.personEmail}
                                </a>
                            </div>
                        </li>

                    </ul>
                </Card>

                {/* Map Card */}
                <Card className="p-0 overflow-hidden">
                    <div className="relative w-full aspect-[16/10] bg-[var(--color-bg-alt)]">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3434.659228381356!2d55.519375999999994!3d25.253539999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjXCsDE1JzEyLjciTiA1NcKwMzEnMDkuOCJF!5e1!3m2!1sen!2sin!4v1764219818190!5m2!1sen!2sin"
                            width="600"
                            height="450"
                            style={{ border: '0' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </Card>
            </div>
        </section>
    );
}
