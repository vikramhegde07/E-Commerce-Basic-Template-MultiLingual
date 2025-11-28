// components/Common/BrochureDownload.tsx
"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

type LangCode = "en" | "ar" | "zh";

type Brochure = {
    id: string;
    label: Record<LangCode, string>;
    fileName: string; // actual file name in /public/brochures
};

const TEXTS: Record<
    LangCode,
    {
        buttonLabel: string;
        dialogTitle: string;
        dialogDescription: string;
        downloadCta: string;
        emptyState: string;
    }
> = {
    en: {
        buttonLabel: "Download Brochures",
        dialogTitle: "Download Brochures",
        dialogDescription:
            "Select a brochure to download for detailed product and company information.",
        downloadCta: "Download",
        emptyState: "No brochures available at the moment.",
    },
    ar: {
        buttonLabel: "تحميل الكتيبات",
        dialogTitle: "تنزيل الكتيبات",
        dialogDescription:
            "اختر الكتيب الذي ترغب في تنزيله للحصول على معلومات تفصيلية عن المنتجات والشركة.",
        downloadCta: "تحميل",
        emptyState: "لا توجد كتيبات متاحة حالياً.",
    },
    zh: {
        buttonLabel: "下载宣传册",
        dialogTitle: "下载宣传册",
        dialogDescription:
            "请选择要下载的宣传册，以获取详细的产品和公司资料。",
        downloadCta: "下载",
        emptyState: "目前没有可用的宣传册。",
    },
};

interface BrochureDownloadProps {
    className?: string;
}

// IMPORTANT: these file names must match exactly what is inside /public/brochures
const brochures: Brochure[] = [
    {
        id: "doors",
        label: {
            en: "Prime Connects Doors Brochure",
            ar: "كتيب برايم كونيكتس للأبواب",
            zh: "Prime Connects 门类宣传册",
        },
        fileName: "Prime Connects Doors.pdf",
    },
    {
        id: "cylinder-locks",
        label: {
            en: "Primeconnects Cylinder Locks Brochure",
            ar: "كتيب برايم كونيكتس لأقفال الأسطوانة",
            zh: "Primeconnects 圆柱锁宣传册",
        },
        fileName: "Primeconnects Cylinder Locks.pdf",
    },
    {
        id: "doors-kitchen-cabinets",
        label: {
            en: "Primeconnects Doors & Kitchen Cabinets Brochure",
            ar: "كاتالوج برايم كونيكتس العام",
            zh: "Primeconnects 综合目录",
        },
        fileName: "Primeconnects General Catalogue.pdf",
    },
    {
        id: "hinges",
        label: {
            en: "Primeconnects Hinges Brochure",
            ar: "كتيب برايم كونيكتس للمفصلات",
            zh: "Primeconnects 合页宣传册",
        },
        fileName: "Primeconnects Hinges.pdf",
    },
    {
        id: "smart-rim-locks",
        label: {
            en: "Primeconnects Smart Rim Locks Brochure",
            ar: "كتيب برايم كونيكتس للأقفال الحلقية الذكية",
            zh: "Primeconnects 智能边锁宣传册",
        },
        fileName: "Primeconnects Smart Rim Locks.pdf",
    },
];

export function BrochureDownload({ className }: BrochureDownloadProps) {
    const { locale } = useLanguage(); // "en" | "ar" | "zh"
    const t = TEXTS[locale] ?? TEXTS.en;

    const isRtl = locale === "ar";

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className={className} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {t.buttonLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className={isRtl ? "rtl text-right" : ""}>
                <DialogHeader>
                    <DialogTitle>{t.dialogTitle}</DialogTitle>
                    <DialogDescription>{t.dialogDescription}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-3">
                    {brochures.length > 0 ? (
                        brochures.map((brochure) => {
                            // build a safe URL that handles spaces in file names
                            const href = `/brochures/${encodeURIComponent(
                                brochure.fileName
                            )}`;

                            return (
                                <div
                                    key={brochure.id}
                                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                                    dir={isRtl ? "rtl" : "ltr"}
                                >
                                    <span className="flex-1">
                                        {brochure.label[locale] ??
                                            brochure.label.en}
                                    </span>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        asChild
                                    >
                                        <a
                                            href={href}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download className="mr-1 h-4 w-4" />
                                            {t.downloadCta}
                                        </a>
                                    </Button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t.emptyState}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
