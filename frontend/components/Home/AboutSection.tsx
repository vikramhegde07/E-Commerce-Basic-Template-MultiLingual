'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Play, Pause } from 'lucide-react';

type MediaType = 'image' | 'video' | 'youtube';

type AboutSectionProps = {
    mediaSrc?: string;           // for image or local video
    youtubeUrl?: string;         // for YouTube
    mediaType?: MediaType;
    companyName?: string;
    posterSrc?: string;
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

// helper for mm:ss format (still used if you keep local <video> option)
const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const padded = secs < 10 ? `0${secs}` : secs;
    return `${mins}:${padded}`;
};

// very simple YouTube ID extractor (handles youtu.be & watch?v=)
function extractYouTubeId(url?: string): string | null {
    if (!url) return null;

    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') {
            return u.pathname.slice(1);
        }
        if (u.hostname.includes('youtube.com')) {
            const v = u.searchParams.get('v');
            if (v) return v;
            // /embed/VIDEO_ID
            const parts = u.pathname.split('/');
            const embedIndex = parts.indexOf('embed');
            if (embedIndex !== -1 && parts[embedIndex + 1]) {
                return parts[embedIndex + 1];
            }
        }
    } catch {
        // if it's not a full URL, maybe it's already an ID
        if (!url.includes(' ') && !url.includes('/')) return url;
    }
    return null;
}

export default function AboutSection({
    mediaSrc = '/videos/intro.mp4',       // used for local video or image fallback
    youtubeUrl,                           // pass your YouTube link here
    mediaType = 'youtube',                // default to YouTube now
    companyName = 'Primeconnects',
    posterSrc = '/about-factory.jpg',
}: AboutSectionProps) {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale as keyof typeof TEXTS] ?? TEXTS.en;

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0); // 0–100

    const handlePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        const dur = videoRef.current.duration || 0;
        setDuration(dur);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const ct = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration || 1;
        setCurrentTime(ct);
        setProgress((ct / dur) * 100);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video || !duration) return;
        const value = Number(e.target.value);
        const newTime = (value / 100) * duration;
        video.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress(value);
    };

    const handleVideoClick = () => {
        handlePlayPause();
    };

    const youtubeId = extractYouTubeId(youtubeUrl);

    return (
        <section className="relative py-16 md:py-24 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Media */}
                <div className="relative order-2 lg:order-1">
                    <div className="group relative w-full aspect-[16/10] overflow-hidden rounded-2xl shadow-md border border-[var(--color-border)]">
                        {mediaType === 'youtube' && youtubeId ? (
                            <>
                                {/* YouTube iframe with autoplay (muted to satisfy browser policies) */}
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1&rel=0&modestbranding=1`}
                                    title={`${companyName} introduction video`}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                />
                            </>
                        ) : mediaType === 'video' ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={mediaSrc}
                                    poster={posterSrc}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 cursor-pointer"
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    onClick={handleVideoClick}
                                />

                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                {!isPlaying && (
                                    <button
                                        type="button"
                                        onClick={handlePlayPause}
                                        className="absolute inset-0 flex items-center justify-center"
                                        aria-label="Play video"
                                    >
                                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                                            <Play className="h-8 w-8 text-white translate-x-[2px]" />
                                        </span>
                                    </button>
                                )}

                                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            type="button"
                                            onClick={handlePlayPause}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white transition"
                                            aria-label={isPlaying ? 'Pause video' : 'Play video'}
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-4 w-4 text-black" />
                                            ) : (
                                                <Play className="h-4 w-4 text-black translate-x-[1px]" />
                                            )}
                                        </button>

                                        <div className="flex-1 flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={0.1}
                                                value={progress}
                                                onChange={handleSeek}
                                                className="w-full accent-[var(--color-primary)]"
                                                aria-label="Seek video"
                                            />
                                            <span className="text-xs text-white/80 whitespace-nowrap">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Fallback image
                            <>
                                <Image
                                    src={mediaSrc}
                                    alt={`${companyName} manufacturing unit`}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                    priority={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                            </>
                        )}
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
