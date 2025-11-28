// components/Common/Navbar.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Menu, X, Phone, Mail, HeadphonesIcon, Search,
    Linkedin, Instagram, Facebook, XIcon,
    Download
} from 'lucide-react';
import { useRouter } from 'next/router';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LanguageSwitcher from '@/components/Common/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { BrochureDownload } from './BrochureDownload';

const TEXTS = {
    en: {
        companyName: "Prime Connects Doors & Cabinet Solutions",
        home: 'Home',
        corePanels: 'Core Panels',
        categories: 'Categories',
        products: 'Products',
        about: 'About Us',
        contact: 'Contact Us',
        searchPH: 'Search products…',
        seeAll: 'See all →',
        followUs: 'Follow us:',
        salesSupport: 'Sales & Support',
        downloadAll: 'Download Brochures'
    },
    ar: {
        companyName: "برايم كونيكتس حلول للأبواب والخزائن",
        home: 'الرئيسية',
        corePanels: 'ألواح النواة',
        categories: 'الفئات',
        products: 'المنتجات',
        about: 'من نحن',
        contact: 'اتصل بنا',
        searchPH: 'ابحث عن المنتجات…',
        seeAll: 'عرض الكل →',
        followUs: 'تابعنا:',
        salesSupport: 'المبيعات والدعم',
        downloadAll: 'تحميل الكتيّب'
    },
    zh: {
        companyName: "Prime Connects 门柜解决方案",
        home: '首页',
        corePanels: '核心板',
        categories: '分类',
        products: '产品',
        about: '关于我们',
        contact: '联系我们',
        searchPH: '搜索产品…',
        seeAll: '查看全部 →',
        followUs: '关注我们：',
        salesSupport: '销售与支持',
        downloadAll: '下载宣传册'
    },
} as const;

type Category = {
    id: string | number;
    name: string;
    slug: string;
    parent_id?: string | number | null;
};

type ProductLite = { id: string | number; name: string; slug: string };

export default function Navbar() {
    const router = useRouter();
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const [q, setQ] = useState('');

    // dropdown states
    const [catsOpen, setCatsOpen] = useState(false);
    const catsCloseT = useRef<NodeJS.Timeout | null>(null);

    const [coreOpen, setCoreOpen] = useState(false);
    const coreCloseT = useRef<NodeJS.Timeout | null>(null);

    // data
    const [categories, setCategories] = useState<Category[]>([]);
    const [coreList, setCoreList] = useState<ProductLite[]>([]);

    const [mobileOpen, setMobileOpen] = useState(false);

    // fetch categories (for list only)
    useEffect(() => {
        (async () => {
            try {
                const r = await api.get('/api/public/categories', { params: { locale, limit: 200 } });
                setCategories(r.data?.data ?? []);
            } catch {
                setCategories([]);
            }
        })();
    }, [locale]);

    // fetch core panels list (category=doors)
    useEffect(() => {
        if (!coreOpen) return;
        (async () => {
            try {
                // If your backend expects category_slug, adjust accordingly:
                const r = await api.get('/api/products', {
                    params: { category_slug: 'core-panels', limit: 8, sortBy: 'created_at', order: 'DESC', locale },
                });
                setCoreList(r.data?.data ?? []);
            } catch {
                setCoreList([]);
            }
        })();
    }, [coreOpen, locale]);

    // hover handlers with small close delay
    const openCats = () => {
        if (catsCloseT.current) clearTimeout(catsCloseT.current);
        setCatsOpen(true);
    };
    const closeCats = () => {
        if (catsCloseT.current) clearTimeout(catsCloseT.current);
        catsCloseT.current = setTimeout(() => setCatsOpen(false), 220);
    };
    const openCore = () => {
        if (coreCloseT.current) clearTimeout(coreCloseT.current);
        setCoreOpen(true);
    };
    const closeCore = () => {
        if (coreCloseT.current) clearTimeout(coreCloseT.current);
        coreCloseT.current = setTimeout(() => setCoreOpen(false), 220);
    };

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q.trim()) params.set('search', q.trim());
        params.set('locale', locale);
        router.push(`/products?${params.toString()}`);
    };

    return (
        <header className="w-full border-b bg-[var(--color-bg)]" dir={dir}>
            {/* Top bar */}
            <div className="hidden md:flex items-center justify-center gap-6 text-xs font-medium px-4 py-2 bg-[var(--color-primary)] text-white">
                <div className="flex items-center gap-6">
                    <a href="mailto:info@primeconnects.com" className="flex items-center gap-1 transition-opacity duration-300 hover:opacity-80">
                        <Mail size={14} /> info@primeconnects.ae
                    </a>
                    <a href="mailto:abde@primeconnects.com" className="flex items-center gap-1 transition-opacity duration-300 hover:opacity-80">
                        <Mail size={14} /> abde@primeconnects.ae
                    </a>
                    <a href="tel:+971589126137" className="flex items-center gap-1 transition-opacity duration-300 hover:opacity-80">
                        <Phone size={14} /> +971 58 912 6137
                    </a>
                    <a href="tel:+971065733816" className="flex items-center gap-1 transition-opacity duration-300 hover:opacity-80">
                        <Phone size={14} /> +971 06 573 3816
                    </a>
                </div>
                <div className="flex flex-row flex-wrap items-center gap-3">
                    <span className="opacity-80">{t.followUs}</span>
                    <a href="#" aria-label="Facebook" className="transition-opacity duration-300 hover:opacity-80"><Facebook size={16} /></a>
                    <a href="#" aria-label="Instagram" className="transition-opacity duration-300 hover:opacity-80"><Instagram size={16} /></a>
                    <a href="#" aria-label="XIcon" className="transition-opacity duration-300 hover:opacity-80"><XIcon size={16} /></a>
                    <a href="#" aria-label="LinkedIn" className="transition-opacity duration-300 hover:opacity-80"><Linkedin size={16} /></a>
                </div>
            </div>

            {/* Middle: logo + search + language */}
            <div className="px-4 md:px-6">
                <div className="h-16 md:h-20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={18} />
                        </Button>

                        <Link href="/" className="inline-flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/21.png" className="h-12 w-12 rounded-lg bg-[var(--color-primary)]/10" alt="Primeconnects logo" />
                            <div className='flex flex-col'>
                                <span className="font-semibold leading-tight">{TEXTS.ar.companyName}</span>
                                {locale !== 'ar' && (
                                    <span className="font-semibold leading-tight">{t.companyName}</span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Desktop search */}
                    <form onSubmit={onSearch} className="flex-1 hidden md:flex max-w-2xl mx-4">
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t.searchPH}
                            className="rounded-l-2xl rounded-r-none focus:outline-none transition-[box-shadow,color] duration-300"
                        />
                        <Button className="rounded-s-none bg-[var(--color-primary)]/80 text-white hover:bg-(--color-primary)">
                            <Search size={16} className="mr-2" />
                            {t.products}
                        </Button>
                    </form>

                    <div className='flex gap-2 flex-row flex-wrap'>
                        <div className="hidden md:flex items-center gap-2">
                            <LanguageSwitcher />
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <BrochureDownload />
                        </div>
                    </div>
                </div>

                {/* Mobile search */}
                <form onSubmit={onSearch} className="flex md:hidden pb-3">
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t.searchPH}
                        className="flex-1 rounded-l-2xl"
                    />
                    <Button className="rounded-s-none bg-[var(--color-primary)] text-white opacity-80 hover:opacity-100 transition-opacity duration-300">
                        <Search size={16} className="mr-2" />
                        {t.products}
                    </Button>
                </form>
            </div>

            {/* Bottom nav (centered) */}
            <div className="border-t hidden md:block">
                <nav className="h-12 flex items-center justify-center gap-1 text-sm relative">
                    <Link href="/" className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]">
                        {t.home}
                    </Link>

                    {/* Core Panels — trigger is a Link; dropdown = single list (max 5) */}
                    <div
                        className="relative"
                        onMouseEnter={openCore}
                        onMouseLeave={closeCore}
                    >
                        <Link
                            href="/products?category_slug=core-panels"
                            className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]"
                        >
                            {t.corePanels}
                        </Link>

                        {coreOpen && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full z-40 mt-2 w-[min(100vw-1rem,600px)]">
                                <div className="h-2" />
                                <div
                                    className="bg-white border shadow-lg rounded-2xl p-4 transition-all duration-300"
                                    onMouseEnter={openCore}
                                    onMouseLeave={closeCore}
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        <ul className="divide-y">
                                            {coreList.slice(0, 5).map((p) => (
                                                <li key={p.id} className="py-2 px-3">
                                                    <Link
                                                        href={`/product/${p.slug}`}
                                                        className="block transition-colors duration-300 hover:text-[var(--color-primary)]"
                                                    >
                                                        {p.name}
                                                    </Link>
                                                </li>
                                            ))}
                                            <li className="py-2 px-3 text-right">
                                                <Link
                                                    href="/products?category_slug=core-panels"
                                                    className="text-xs underline"
                                                >
                                                    {t.seeAll}
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Categories — trigger is a Link; dropdown = single list (max 5) */}
                    <div
                        className="relative"
                        onMouseEnter={openCats}
                        onMouseLeave={closeCats}
                    >
                        <Link
                            href="/categories"
                            className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]"
                        >
                            {t.categories}
                        </Link>

                        {catsOpen && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full z-40 mt-2 w-[min(100vw-1rem,600px)]">
                                <div className="h-2" />
                                <div
                                    className="bg-white border shadow-lg rounded-2xl p-4 transition-all duration-300"
                                    onMouseEnter={openCats}
                                    onMouseLeave={closeCats}
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        <ul className="divide-y">
                                            {categories
                                                .filter((c) => !c.parent_id)
                                                .slice(0, 5)
                                                .map((c) => (
                                                    <li key={c.slug} className="py-2 px-3">
                                                        <Link
                                                            href={`/categories/${c.slug}`}
                                                            className="block transition-colors duration-300 hover:text-[var(--color-primary)]"
                                                        >
                                                            {c.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            <li className="py-2 px-3 text-right">
                                                <Link href="/categories" className="text-xs underline">
                                                    {t.seeAll}
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/products" className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]">
                        {t.products}
                    </Link>
                    <Link href="/about" className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]">
                        {t.about}
                    </Link>
                    <Link href="/contact" className="px-4 py-2 transition-colors duration-300 hover:text-[var(--color-primary)]">
                        {t.contact}
                    </Link>
                </nav>
            </div>

            {/* Mobile drawer (kept minimal) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <Link href="/" className="inline-flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                <img src="/images/21.png" className="h-12 w-12 rounded-lg bg-[var(--color-primary)]/10" alt="Primeconnects logo" />
                                <div className="flex flex-col">
                                    <span className="font-semibold leading-tight">{TEXTS.ar.companyName}</span>
                                    {locale !== 'ar' && (
                                        <span className="font-semibold leading-tight">{t.companyName}</span>
                                    )}
                                </div>
                            </Link>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <nav className="space-y-3">
                            <Link href="/" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.home}
                            </Link>
                            <Link href="/products?category_slug=core-panels" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.corePanels}
                            </Link>
                            <Link href="/categories" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.categories}
                            </Link>
                            <Link href="/products" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.products}
                            </Link>
                            <Link href="/about" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.about}
                            </Link>
                            <Link href="/contact" className="block py-2" onClick={() => setMobileOpen(false)}>
                                {t.contact}
                            </Link>
                        </nav>

                        <div className='flex gap-2 flex-row flex-wrap mt-6'>
                            <div className="md:hidden flex items-center gap-2">
                                <LanguageSwitcher />
                            </div>
                            <div className="md:hidden flex items-center gap-2">
                                <BrochureDownload />
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </header>
    );
}
