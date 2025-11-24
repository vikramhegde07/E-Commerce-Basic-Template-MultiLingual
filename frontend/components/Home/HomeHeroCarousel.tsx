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

type HomeHeroCarouselProps = {
    urls: string[];
    aspect?: `${number}/${number}` | string;
    altBase?: string;
};

export default function HomeHeroCarousel({
    urls,
    aspect = '16/9',
    altBase = 'Hero slide',
}: HomeHeroCarouselProps) {
    const { dir } = useLanguage();

    // 👇 state typed to CarouselApi | null
    const [api, setApi] = React.useState<CarouselApi | null>(null);

    // 👇 adapter to satisfy setApi?: (api: CarouselApi | undefined) => void
    const handleSetApi = React.useCallback((next?: CarouselApi) => {
        setApi(next ?? null);
    }, []);

    const onPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const onNext = React.useCallback(() => api?.scrollNext(), [api]);

    const slides = urls.length ? urls : ['/hero-placeholder.jpg'];

    return (
        <section className="relative w-full" dir={dir}>
            <Carousel
                setApi={handleSetApi}               // ✅ correct type
                opts={{ loop: true, align: 'start' }}
                className="w-full"
            >
                <CarouselContent>
                    {slides.map((src, i) => (
                        <CarouselItem key={`${src}-${i}`} className="relative">
                            <div className="relative w-full overflow-hidden" style={{ aspectRatio: aspect }}>
                                <Image
                                    src={src}
                                    alt={`${altBase} ${i + 1}`}
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
