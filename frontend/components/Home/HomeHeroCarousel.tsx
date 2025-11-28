// components/home/HomeHeroCarousel.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi, // 👈 use shadcn's type
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { api as apiEndPoint } from '@/lib/axios';

type HomeHeroCarouselProps = {
    aspect?: `${number}/${number}` | string;
    altBase?: string;
};
type Banner = {
    id: string | number;
    image_url: string | null;
    is_permanent: string | boolean;
    is_active: string | boolean | null;
};

export default function HomeHeroCarousel({
    aspect = '16/8',
    altBase = 'Hero slide',
}: HomeHeroCarouselProps) {
    const { dir } = useLanguage();

    // 👇 state typed to CarouselApi | null
    const [api, setApi] = React.useState<CarouselApi | null>(null);
    const [banners, setBanners] = React.useState<Banner[]>([]);

    // --- fetchers (independent, robust) ---
    React.useEffect(() => {
        let mounted = true;

        const fetchBanners = async () => {
            try {
                const res = await apiEndPoint.get('/api/public/banners/active');
                setBanners(res.data)
            } catch (error) {
                console.log(error);
            }
        }

        fetchBanners();
        return () => { mounted = false; };
    }, []);

    const handleSetApi = React.useCallback((next?: CarouselApi) => {
        setApi(next ?? null);
    }, []);

    const onPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const onNext = React.useCallback(() => api?.scrollNext(), [api]);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string || "";
    const absUrl = (url?: string | null) => {
        if (!url) return "";
        if (/^https?:\/\//i.test(url)) return url;
        return API_BASE + url;
    };
    return (
        <section className="relative w-full" dir={dir}>
            <Carousel
                setApi={handleSetApi}               // ✅ correct type
                opts={{ loop: true, align: 'start' }}
                className="w-full"
            >
                <CarouselContent>
                    {banners.map((banner, i) => (
                        <CarouselItem key={`${banner.id}`} className="relative">
                            <div className="relative w-full overflow-hidden" style={{ aspectRatio: aspect }}>
                                <Image
                                    src={absUrl(banner.image_url)}
                                    alt={`Banner - ${i + 1}`}
                                    fill
                                    className="object-contain"
                                    priority={i === 0}
                                />
                                <div className="absolute inset-0 bg-black/10" />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Bottom-centered controls */}
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex w-full justify-center">
                <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 backdrop-blur-md">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onPrev}
                        aria-label="Previous slide"
                        className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors duration-300"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onNext}
                        aria-label="Next slide"
                        className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors duration-300"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
