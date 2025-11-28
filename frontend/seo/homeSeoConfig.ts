// seo/homeSeoConfig.ts
export type LangCode = "en" | "ar" | "zh";

export const HOME_SEO: Record<
    LangCode,
    {
        title: string;
        description: string;
        ogTitle: string;
        ogDescription: string;
    }
> = {
    en: {
        title:
            "Primeconnects Doors & Cabinets Solutions | Door Manufacturing & Supply UAE & China",
        description:
            "Primeconnects is a multinational manufacturer and supplier of doors, panels, and cabinetry with factories in the UAE and China. We provide fire-rated doors, wooden doors, WPC doors, cabinet systems, and custom door solutions for residential and commercial projects.",
        ogTitle: "Primeconnects | Door Manufacturing & Cabinet Solutions",
        ogDescription:
            "Multinational manufacturer of doors, panels, and cabinetry serving commercial, residential, hospitality, education, and healthcare projects.",
    },

    ar: {
        title:
            "برايمكونيكتس لحلول الأبواب والخزائن | تصنيع وتوريد الأبواب في الإمارات والصين",
        description:
            "تعد برايمكونيكتس شركة متعددة الجنسيات متخصصة في تصنيع وتوريد الأبواب، الألواح وخزائن التخزين مع مصانع في الإمارات والصين. نوفر أبواباً خشبية وWPC وأبواباً مقاومة للحريق وأنظمة خزائن مخصصة للمشاريع السكنية والتجارية.",
        ogTitle: "برايمكونيكتس | حلول تصنيع وتوريد الأبواب والخزائن",
        ogDescription:
            "مصنّع ومورّد عالمي للأبواب والألواح والخزائن يخدم مشاريع تجارية، سكنية، فندقية، تعليمية وصحية.",
    },

    zh: {
        title:
            "Primeconnects 门与柜体解决方案 | 阿联酋与中国门类制造与供应",
        description:
            "Primeconnects 是一家集制造与贸易于一体的跨国企业，在阿联酋和中国设有工厂，专注生产与供应各类门、板材及橱柜系统，为住宅与商业项目提供防火门、木门、WPC 门及定制柜体解决方案。",
        ogTitle: "Primeconnects | 门类与柜体制造解决方案",
        ogDescription:
            "跨国门类、板材及柜体制造商，为商业楼宇、酒店、教育、医疗及住宅项目提供一站式门与柜体产品。",
    },
};
