// components/Categories/CategoriesHero.tsx
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const COPIES = {
    en: {
        badge: "Browse by category",
        title: "Explore our product categories",
        subtitle:
            "Jump straight into the product family you need – doors, windows, hardware, and more. Each category shows a curated list of matching products.",
        cardTitle: "Always up to date",
        cardSubtitle: "Categories sync with the latest catalogue",
    },
    zh: {
        badge: "按类别浏览",
        title: "浏览我们的产品类别",
        subtitle:
            "快速找到所需的产品系列——如门、窗、五金等。每个类别都会展示与之匹配的精选产品列表。",
        cardTitle: "实时更新",
        cardSubtitle: "类别与最新目录自动同步",
    },
    ar: {
        badge: "تصفّح حسب الفئة",
        title: "استكشف فئات المنتجات لدينا",
        subtitle:
            "انتقل مباشرةً إلى نوع المنتج الذي تحتاجه – الأبواب، النوافذ، الإكسسوارات والمزيد. كل فئة تعرض مجموعة منتجات مناسبة لها.",
        cardTitle: "محدّث دائماً",
        cardSubtitle: "الفئات متزامنة مع أحدث الكتالوج",
    },
} as const;

export default function CategoriesHero() {
    const { locale } = useLanguage();
    const lang = (["en", "zh", "ar"] as const).includes(locale as any)
        ? (locale as "en" | "zh" | "ar")
        : "en";

    const copy = COPIES[lang];
    const isRTL = lang === "ar";

    return (
        <section className="md:min-h-[450px] relative flex items-center overflow-hidden py-16 md:py-20 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[var(--color-secondary)]">
            {/* subtle radial highlights */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(40%_60%_at_0%_0%,white,transparent_60%)]" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(40%_60%_at_100%_100%,white,transparent_60%)]" />

            <div className="container max-w-6xl mx-auto px-6 relative z-10">
                <div
                    className={`flex flex-col md:flex-row items-center md:items-start gap-6 ${isRTL ? "md:flex-row-reverse" : ""
                        }`}
                >
                    {/* Text side */}
                    <div
                        className={`md:w-2/3 ${isRTL ? "text-right md:text-right" : "text-center md:text-left"
                            } text-[var(--color-bg)]`}
                    >
                        <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase bg-[var(--color-secondary)] text-[var(--color-bg)] px-3 py-1 rounded-full shadow-sm">
                            <BadgeCheck className="h-4 w-4" />
                            {copy.badge}
                        </span>

                        <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight drop-shadow-sm">
                            {copy.title}
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm md:text-base text-[var(--color-bg)]/90">
                            {copy.subtitle}
                        </p>
                    </div>

                    {/* Highlight card */}
                    <div
                        className={`md:w-1/3 flex ${isRTL ? "md:justify-start" : "md:justify-end"
                            }`}
                    >
                        <div className="rounded-2xl border border-white/25 bg-[rgba(15,23,42,0.85)] text-white backdrop-blur px-4 py-3 shadow-lg max-w-xs">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-[var(--color-secondary)]" />
                                <div className="text-sm">
                                    <div className="font-semibold">{copy.cardTitle}</div>
                                    <div className="text-xs opacity-80">{copy.cardSubtitle}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
