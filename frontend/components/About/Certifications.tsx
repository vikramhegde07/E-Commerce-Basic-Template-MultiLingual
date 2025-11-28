'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { BrochureDownload } from '../Common/BrochureDownload';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Cert = { name: string; logo?: string; fileUrl?: string };
type CertificationsProps = {
    certs?: Cert[];
};

const TEXTS = {
    en: {
        title: 'Certifications & Compliance',
        intro: 'Our processes align with international standards for safety and quality.',
        downloadAll: 'Download Brochure',
        prev: 'Previous',
        next: 'Next',
    },
    ar: {
        title: 'الشهادات والامتثال',
        intro: 'عملياتنا متوافقة مع المعايير الدولية للسلامة والجودة.',
        downloadAll: 'تحميل الكتيّب',
        prev: 'السابق',
        next: 'التالي',
    },
    zh: {
        title: '认证与合规',
        intro: '我们的流程符合国际安全与质量标准。',
        downloadAll: '下载宣传册',
        prev: '上一张',
        next: '下一张',
    },
} as const;

export default function Certifications({
    certs = [
        { name: 'Commercial Licence', logo: '/certs/cert-1.png' },
        { name: 'ISO 9001:2015', logo: '/certs/cert-2.png' },
        { name: 'Certificate of Acceptance', logo: '/certs/cert-3.png' },
    ],
}: CertificationsProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const openCert = (index: number) => {
        if (!certs[index]?.logo) return; // only open modal if image exists
        setActiveIndex(index);
        setOpen(true);
    };

    const handlePrev = () => {
        if (activeIndex === null) return;
        const prevIndex = (activeIndex - 1 + certs.length) % certs.length;
        if (!certs[prevIndex].logo) {
            // skip certs without logo
            setActiveIndex((prevIndex - 1 + certs.length) % certs.length);
        } else {
            setActiveIndex(prevIndex);
        }
    };

    const handleNext = () => {
        if (activeIndex === null) return;
        const nextIndex = (activeIndex + 1) % certs.length;
        if (!certs[nextIndex].logo) {
            // skip certs without logo
            setActiveIndex((nextIndex + 1) % certs.length);
        } else {
            setActiveIndex(nextIndex);
        }
    };

    const currentCert = activeIndex !== null ? certs[activeIndex] : null;

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                    {t.title}
                </h2>
                <p className="mt-3 text-[var(--color-text-light)]">
                    {t.intro}
                </p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {certs.map((c, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => openCert(i)}
                            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 grid place-items-center hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                            {c.logo ? (
                                <Image
                                    src={c.logo}
                                    alt={c.name}
                                    width={120}
                                    height={120}
                                    className="opacity-80"
                                />
                            ) : (
                                <div className="text-sm text-[var(--color-text-light)]">
                                    {c.name}
                                </div>
                            )}
                            <div className="mt-3 text-xs text-[var(--color-text)] text-center">
                                {c.name}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8">
                    <BrochureDownload />
                </div>
            </div>

            {/* Modal for full-size certificate */}
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);
                    if (!value) setActiveIndex(null);
                }}
            >
                <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto">
                    {currentCert && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{currentCert.name}</DialogTitle>
                            </DialogHeader>

                            <div className="mt-4 flex flex-col items-center gap-4">
                                {currentCert.logo && (
                                    <div className="relative w-full !max-h-[90vh] flex items-center justify-center">
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img
                                                src={currentCert.logo}
                                                alt={currentCert.name}

                                                className="max-h-[80vh] w-auto h-auto object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex w-full justify-between gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrev}
                                    >
                                        {t.prev}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleNext}
                                    >
                                        {t.next}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
