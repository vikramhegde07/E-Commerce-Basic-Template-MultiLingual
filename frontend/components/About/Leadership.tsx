'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Linkedin } from 'lucide-react';

type Leader = { name: string; role: string; photo?: string; linkedin?: string; bio?: string };
type LeadershipProps = { people?: Leader[] };

const TEXTS = {
    en: { title: 'Leadership', intro: 'Experienced leadership driving product innovation and operational excellence.' },
    ar: { title: 'فريق القيادة', intro: 'قيادة بخبرات كبيرة تقود الابتكار والتميز التشغيلي.' },
    zh: { title: '管理团队', intro: '经验丰富的领导团队推动产品创新与卓越运营。' },
} as const;

export default function Leadership({
    people = [
        { name: 'Alex Chen', role: 'CEO', photo: '/leaders/ceo.jpg', linkedin: '#', bio: '25+ years in manufacturing and international operations.' },
        { name: 'Sara Ahmed', role: 'Head of Operations (UAE)', photo: '/leaders/ops.jpg', linkedin: '#', bio: 'Oversees UAE factory and regional logistics.' },
        { name: 'Li Wei', role: 'R&D Director', photo: '/leaders/rnd.jpg', linkedin: '#', bio: 'Drives material testing and product development.' },
    ],
}: LeadershipProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    return (
        <section className="py-16 md:py-20 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.title}</h2>
                <p className="mt-3 text-[var(--color-text-light)]">{t.intro}</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {people.map((p, i) => (
                        <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
                            <div className="relative h-56 bg-[var(--color-bg-alt)]">
                                {p.photo ? (
                                    <Image src={p.photo} alt={p.name} fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 grid place-items-center text-sm text-[var(--color-text-light)]">No Photo</div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-base font-semibold text-[var(--color-text)]">{p.name}</div>
                                        <div className="text-xs text-[var(--color-text-light)]">{p.role}</div>
                                    </div>
                                    {p.linkedin && (
                                        <Link href={p.linkedin} aria-label={`${p.name} LinkedIn`} className="text-[var(--color-primary)] hover:opacity-80">
                                            <Linkedin className="w-5 h-5" />
                                        </Link>
                                    )}
                                </div>
                                {p.bio && <p className="mt-3 text-sm text-[var(--color-text-light)]">{p.bio}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
