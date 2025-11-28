import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
    Mail,
    Phone,
    User,
    Send,
    Image as ImageIcon,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "@/lib/axios";
import { useLanguage } from "@/context/LanguageContext";

// --- Types matching NEW API shape ---

type ApiListMap = {
    [key: string]: {
        title: string;
        desc?: string | null;
        items: string[];
    };
};

type ApiSpecItem = {
    key: string;
    value: string;
    unit?: string | null;
};

type ApiSpecMap = {
    [key: string]: {
        title: string;
        desc?: string | null;
        items: ApiSpecItem[];
    };
};

type ApiTableMap = {
    [key: string]: {
        title: string;
        subtitle?: string | null;
        columns: string[];
        rows: (string | number | null)[][];
        notes?: string | null;
    };
};

type Bundle = {
    meta?: {
        fullData?: boolean;
        locale?: string;
        slug?: string;
        id?: number;
    };
    base: {
        name: string;
        desc?: string | null; // new field
        description?: string | null; // keep for safety / old data
        category?: string | null;
        sku?: string | null;
    };

    layout?: {
        id: number | string;
        name: string;
        is_default: number;
        blocks: Array<{
            id: number;
            block_type: "images" | "basic" | "spec_group" | "table" | "list";
            ref_id: number | null;
            sort_order: number;
            config: any | null;
        }>;
    } | null;

    images?: Array<{
        group_id: number;
        name: string;
        items: {
            id: number;
            url: string;
            alt?: string | null;
            sort_order: number;
        }[];
    }>;

    // new list/spec/table shapes (keyed objects)
    lists?: ApiListMap[];
    specs?: ApiSpecMap[];
    tables?: ApiTableMap[];
};

const currency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function KVTable({
    specs,
}: {
    specs: Array<{ label: string; value: string; unit?: string | null }>;
}) {
    return (
        <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm border-collapse">
                <tbody>
                    {specs.map((s, i) => (
                        <tr
                            key={`${s.label}-${i}`}
                            className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                            <td className="w-1/3 px-3 py-2 font-medium text-slate-700 border-b">
                                {s.label}
                            </td>
                            <td className="px-3 py-2 border-b">
                                {s.value}
                                {s.unit ? ` ${s.unit}` : ""}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ProductDetail({ initialBundle }: { initialBundle: Bundle | null }) {
    const [bundle, setBundle] = useState<Bundle | null>(initialBundle);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const rawSlug = router.query.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    const { locale } = useLanguage();

    const [inqOpen, setInqOpen] = useState(false);
    const [inqName, setInqName] = useState("");
    const [inqEmail, setInqEmail] = useState("");
    const [inqPhone, setInqPhone] = useState("");
    const [inqSubject, setInqSubject] = useState("");
    const [inqMessage, setInqMessage] = useState("");

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    // NEW: flatten image groups → array of images
    const imageGroups = bundle?.images || [];
    const allImages =
        imageGroups.length > 0
            ? imageGroups.flatMap((g) => g.items || [])
            : [];
    const images = allImages;
    const mainImg = images[selectedIndex]?.url
        ? apiBase + images[selectedIndex].url
        : null;

    const getBundle = async (slugValue: string) => {
        try {
            const res = await api.get(`/api/products/${encodeURIComponent(slugValue)}?locale=${locale}`);

            const data = res.data as Bundle;
            setBundle(data);
            setSelectedIndex(0);

            const baseName = data.base?.name ?? "Product";

            setInqSubject(`Requesting inquiry for "${baseName}"`);

            setInqMessage(
                `Hello,\n\nI would like to request an inquiry for the product "${baseName}".\nPlease share details about the product.\n\nThanks.`
            );
        } catch (error) {
            toast.error("Failed to load the product!");
        }
    };

    useEffect(() => {
        if (!slug) return;
        getBundle(slug);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const submitInquiry = async () => {
        if (
            !inqName.trim() ||
            !inqEmail.trim() ||
            !inqSubject.trim() ||
            !inqMessage.trim()
        ) {
            toast.error("Please fill name, email, subject and message");
            return;
        }
        try {
            await api.post("/api/public/inquiries", {
                name: inqName.trim(),
                email: inqEmail.trim(),
                phone: inqPhone.trim() || null,
                subject: inqSubject.trim(),
                message: inqMessage.trim(),
            });
            toast.success("Inquiry sent");
            setInqOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to send inquiry");
        }
    };

    // --- Helpers to read NEW keyed list/spec/table structures ---

    const renderList = (listId: number) => {
        const key = `list-${listId}`;
        const listEntry = (bundle?.lists || []).find((obj) => key in obj) as
            | ApiListMap
            | undefined;

        if (!listEntry) return null;

        const l = listEntry[key];
        if (!l) return null;

        return (
            <Card key={`list-${key}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{l.title}</CardTitle>
                    {l.desc && <CardDescription>{l.desc}</CardDescription>}
                </CardHeader>
                <CardContent>
                    {l.items?.length ? (
                        <ul className="list-disc pl-6 space-y-1">
                            {l.items.map((caption, idx) => (
                                <li key={idx} className="text-sm">
                                    {caption}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-sm text-muted-foreground">No items.</div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderSpecGroup = (groupId: number) => {
        const key = `spec-${groupId}`;
        const specEntry = (bundle?.specs || []).find((obj) => key in obj) as
            | ApiSpecMap
            | undefined;

        if (!specEntry) return null;

        const g = specEntry[key];
        if (!g) return null;

        const specsForTable =
            g.items?.map((it) => ({
                label: it.key,
                value: it.value,
                unit: it.unit ?? undefined,
            })) || [];

        return (
            <Card key={`spec-${key}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{g.title}</CardTitle>
                    {g.desc && <CardDescription>{g.desc}</CardDescription>}
                </CardHeader>
                <CardContent>
                    {specsForTable.length ? (
                        <KVTable specs={specsForTable} />
                    ) : (
                        <div className="text-sm text-muted-foreground">No specs.</div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderTable = (tableId: number) => {
        const key = `table-${tableId}`;
        const tableEntry = (bundle?.tables || []).find((obj) => key in obj) as
            | ApiTableMap
            | undefined;

        if (!tableEntry) return null;

        const t = tableEntry[key];
        if (!t) return null;

        const cols = t.columns || [];
        const rows = t.rows || [];

        return (
            <Card key={`table-${key}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{t.title}</CardTitle>
                    {t.subtitle && <CardDescription>{t.subtitle}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            {cols.length > 0 && (
                                <thead>
                                    <tr className="bg-slate-100">
                                        {cols.map((c, i) => (
                                            <th
                                                key={i}
                                                className="px-3 py-2 text-left font-semibold border-b"
                                            >
                                                {c}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {rows.length ? (
                                    rows.map((row, ri) => (
                                        <tr
                                            key={ri}
                                            className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                        >
                                            {cols.map((_, ci) => (
                                                <td
                                                    key={ci}
                                                    className="px-3 py-2 align-top border-b"
                                                >
                                                    {String(row?.[ci] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-3 py-2 text-muted-foreground"
                                            colSpan={Math.max(1, cols.length)}
                                        >
                                            No rows.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {t.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{t.notes}</p>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (!bundle) {
        return (
            <div className="container py-8 text-sm text-muted-foreground">
                Loading...
            </div>
        );
    }

    // --- SEO values with new base.desc support ---

    const baseDescription = bundle.base.description || bundle.base.desc || "";
    const productName = bundle.base.name || "Product";
    const productDescription =
        baseDescription ||
        `${bundle.base.name} available at Primeconnects General Trading.`;
    const sku = bundle.base.sku || "";
    const category = bundle.base.category || "";
    const website = "https://primeconnects.ae";
    const productUrl = `${website}/products/${slug}`;

    const ogImage =
        images?.[0]?.url
            ? apiBase + images[0].url
            : `${website}/og/product-fallback.jpg`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productName,
        image: images.map((img) => apiBase + img.url),
        description: productDescription,
        sku: sku || undefined,
        category: category || undefined,
        url: productUrl,
    };

    return (
        <>
            <Head>
                <title>{productName} | Primeconnects General Trading</title>

                <meta name="description" content={productDescription} />

                <meta
                    name="keywords"
                    content={`${productName}, ${category}, power tools UAE, hardware Dubai, building materials UAE`}
                />

                <link rel="canonical" href={productUrl} />

                {/* Open Graph */}
                <meta property="og:type" content="product" />
                <meta property="og:title" content={productName} />
                <meta property="og:description" content={productDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:url" content={productUrl} />
                <meta
                    property="og:site_name"
                    content="Primeconnects General Trading"
                />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={productName} />
                <meta name="twitter:description" content={productDescription} />
                <meta name="twitter:image" content={ogImage} />

                {/* Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd),
                    }}
                />
            </Head>

            <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                {/* 2-column layout: LEFT details, RIGHT gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT: Base & Pricing */}
                    <Card className="order-2">
                        <CardHeader>
                            <CardTitle className="text-xl">
                                {bundle.base.name}
                            </CardTitle>
                            {baseDescription && (
                                <CardDescription className="text-black/70">
                                    {baseDescription}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Button
                                    variant={"outline"}
                                    className="mt-2"
                                    onClick={() => setInqOpen(true)}
                                >
                                    Inquire
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RIGHT: Gallery (using grouped images) */}
                    <Card className="order-1">
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                <CardTitle>Product Images</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-full relative rounded-lg overflow-hidden border bg-muted">
                                    <div className="relative w-full aspect-[16/9]">
                                        {mainImg ? (
                                            <Image
                                                src={mainImg}
                                                alt={bundle.base.name}
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                                No image
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {images.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto w-full py-1">
                                        {images.map((im, i) => {
                                            const thumb = im.url ? apiBase + im.url : "";
                                            return (
                                                <button
                                                    key={im.id}
                                                    className={`h-16 w-24 shrink-0 border rounded overflow-hidden ${i === selectedIndex ? "ring-2 ring-primary" : ""
                                                        }`}
                                                    onClick={() => setSelectedIndex(i)}
                                                    title={`Image ${i + 1}`}
                                                >
                                                    {thumb ? (
                                                        <div className="relative h-full w-full">
                                                            <Image
                                                                src={thumb}
                                                                alt={im.alt || ""}
                                                                fill
                                                                className="object-cover"
                                                                sizes="96px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Structured Content via layout (below the two-column header) */}
                <div className="space-y-4">
                    {bundle.layout?.blocks?.map((b) => {
                        if (b.block_type === "images" || b.block_type === "basic")
                            return null;
                        if (b.block_type === "list" && b.ref_id)
                            return renderList(b.ref_id);
                        if (b.block_type === "spec_group" && b.ref_id)
                            return renderSpecGroup(b.ref_id);
                        if (b.block_type === "table" && b.ref_id)
                            return renderTable(b.ref_id);
                        return null;
                    })}
                </div>

                {/* Inquiry Dialog */}
                <Dialog open={inqOpen} onOpenChange={setInqOpen}>
                    <DialogContent className="sm:!max-w-3xl md:max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>Request Quote</DialogTitle>
                            <DialogDescription>
                                Send us your details — we'll get back with the best offer
                                for <b>{bundle.base.name}</b>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="inline-flex items-center gap-1">
                                        <User className="h-3.5 w-3.5" /> Name
                                    </Label>
                                    <Input
                                        value={inqName}
                                        onChange={(e) => setInqName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="inline-flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" /> Email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={inqEmail}
                                        onChange={(e) => setInqEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="inline-flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" /> Phone (optional)
                                </Label>
                                <Input
                                    value={inqPhone}
                                    onChange={(e) => setInqPhone(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Subject</Label>
                                <Input
                                    value={inqSubject}
                                    onChange={(e) => setInqSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Message</Label>
                                <Textarea
                                    rows={8}
                                    value={inqMessage}
                                    onChange={(e) => setInqMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={submitInquiry}>
                                <Send className="h-4 w-4 mr-1" /> Send Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
