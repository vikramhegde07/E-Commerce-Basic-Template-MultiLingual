import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import client from "@/lib/api";
import toast from "react-hot-toast";
import {
    Tag, Boxes, IndianRupee, Mail, Phone, User, Send, Image as ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Bundle = {
    base: {
        id: number; name: string; slug: string; sku?: string | null; description?: string | null;
        brand?: string | null; brand_id?: number | null; category?: string | null; category_id?: number | null; meta?: any;
    };
    price?: { mrp: number; discountPercent?: number; discountAmount?: number } | null;
    discounts?: { active: any[]; best?: { type: "percent" | "amount"; value: number; save_amount: number; title?: string } | null } | null;
    images?: { id: number; url: string; alt?: string | null; sort_order: number }[];
    specGroups?: Array<{ id: number; name: string; intro?: string | null; specs?: Array<{ id?: number; label: string; value: string; unit?: string | null }> }>;
    lists?: Array<{ id: number; title: string; description?: string | null; items?: Array<{ id?: number; caption: string; sort_order?: number }> }>;
    tables?: Array<{ id: number; heading: string; intro?: string | null; columns_json: string; rows_json: string; note?: string | null }>;
    layout?: { layout: { id: number; product_id: number; is_default: number; name: string }, blocks: Array<{ id: number; layout_id: number; block_type: 'images' | 'basic' | 'spec_group' | 'table' | 'list'; ref_id: number | null; sort_order: number; config_json?: string | null }> } | null;
};

const currency = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n);

const ProductPreview: React.FC = () => {
    const { slug } = useParams();
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // inquiry modal
    const [inqOpen, setInqOpen] = useState(false);
    const [inqName, setInqName] = useState("");
    const [inqEmail, setInqEmail] = useState("");
    const [inqPhone, setInqPhone] = useState("");
    const [inqSubject, setInqSubject] = useState("");
    const [inqMessage, setInqMessage] = useState("");

    const images = bundle?.images || [];
    const mainImg = images[selectedIndex]?.url;

    const best = bundle?.discounts?.best || null;
    const price = bundle?.price || null;
    const finalPrice = useMemo(() => {
        const m = Number(price?.mrp || 0);
        if (!best) return m;
        return Math.max(0, m - best.save_amount);
    }, [price, best]);

    useEffect(() => {
        const load = async () => {
            if (!slug) return;
            try {
                const res = await client.get(`/api/public/products/slug/${encodeURIComponent(slug)}/bundle`);
                const bun = res.data as Bundle;
                setBundle(bun);
                setSelectedIndex(0);
                setInqSubject(`Requesting quote for "${bun.base.name}"`);
                setInqMessage(`Hello,\n\nI would like to request a quote for the product "${bun.base.name}"${bun.base.sku ? ` (SKU: ${bun.base.sku})` : ""}.\nPlease share pricing and availability.\n\nThanks.`);
            } catch (err: any) {
                toast.error(err?.response?.data?.error || "Failed to load product");
            }
        };
        load();
    }, [slug]);

    const submitInquiry = async () => {
        if (!inqName.trim() || !inqEmail.trim() || !inqSubject.trim() || !inqMessage.trim()) {
            return toast.error("Please fill name, email, subject and message");
        }
        try {
            await client.post("/api/inquiries", {
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

    // helpers
    const renderList = (listId: number) => {
        const l = (bundle?.lists || []).find(x => x.id === listId);
        if (!l) return null;
        return (
            <Card key={`list-${l.id}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{l.title}</CardTitle>
                    {l.description && <CardDescription>{l.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    {l.items?.length ? (
                        <ul className="list-disc pl-6 space-y-1">
                            {l.items.map((it, idx) => (
                                <li key={it.id ?? idx} className="text-sm">{it.caption}</li>
                            ))}
                        </ul>
                    ) : <div className="text-sm text-muted-foreground">No items.</div>}
                </CardContent>
            </Card>
        );
    };

    const renderSpecGroup = (groupId: number) => {
        const g = (bundle?.specGroups || []).find(x => x.id === groupId);
        if (!g) return null;
        return (
            <Card key={`spec-${g.id}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{g.name}</CardTitle>
                    {g.intro && <CardDescription>{g.intro}</CardDescription>}
                </CardHeader>
                <CardContent>
                    {g.specs?.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                            {g.specs.map((s, i) => (
                                <div key={s.id ?? i} className="text-sm">
                                    <span className="font-semibold">{s.label}</span>
                                    {": "}
                                    <span>{s.value}{s.unit ? ` ${s.unit}` : ""}</span>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-sm text-muted-foreground">No specs.</div>}
                </CardContent>
            </Card>
        );
    };

    const renderTable = (tableId: number) => {
        const t = (bundle?.tables || []).find(x => x.id === tableId);
        if (!t) return null;
        let cols: string[] = [];
        let rows: string[][] = [];
        try { cols = JSON.parse(t.columns_json || "[]"); } catch { }
        try { rows = JSON.parse(t.rows_json || "[]"); } catch { }
        return (
            <Card key={`table-${t.id}`}>
                <CardHeader>
                    <CardTitle className="text-lg">{t.heading}</CardTitle>
                    {t.intro && <CardDescription>{t.intro}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border border-border rounded-md text-sm">
                            {cols.length > 0 && (
                                <thead>
                                    <tr className="bg-muted/50">
                                        {cols.map((c, i) => (
                                            <th key={i} className="px-3 py-2 text-left font-semibold border-b">{c}</th>
                                        ))}
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {rows.length ? rows.map((r, ri) => (
                                    <tr key={ri} className="border-b">
                                        {cols.map((_, ci) => (
                                            <td key={ci} className="px-3 py-2 align-top">{r?.[ci] ?? ""}</td>
                                        ))}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="px-3 py-2 text-muted-foreground" colSpan={Math.max(1, cols.length)}>No rows.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {t.note && <p className="text-xs text-muted-foreground mt-2">{t.note}</p>}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {!bundle ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
                <>
                    {/* Gallery */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                <CardTitle>Gallery</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-full aspect-[16/9] bg-muted border rounded flex items-center justify-center overflow-hidden">
                                    {mainImg ? (
                                        <img
                                            src={import.meta.env.VITE_API_BASE + mainImg}
                                            alt={bundle.base.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground text-sm">No image</div>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto w-full py-1">
                                        {images.map((im, i) => (
                                            <button
                                                key={im.id}
                                                className={`h-16 w-24 shrink-0 border rounded overflow-hidden ${i === selectedIndex ? "ring-2 ring-primary" : ""}`}
                                                onClick={() => setSelectedIndex(i)}
                                                title={`Image ${i + 1}`}
                                            >
                                                <img src={import.meta.env.VITE_API_BASE + im.url} alt={im.alt || ""} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Base & Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">{bundle.base.name}</CardTitle>
                            {bundle.base.description && (
                                <CardDescription className="whitespace-pre-wrap">
                                    {bundle.base.description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Brand</div>
                                    <div className="text-sm inline-flex items-center gap-1">
                                        <Tag className="h-3.5 w-3.5" /> {bundle.base.brand || "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Category</div>
                                    <div className="text-sm inline-flex items-center gap-1">
                                        <Boxes className="h-3.5 w-3.5" /> {bundle.base.category || "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">SKU</div>
                                    <div className="text-sm">{bundle.base.sku || "-"}</div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <div className="text-xs text-muted-foreground">MRP</div>
                                    <div className="text-lg font-semibold">{price ? currency(price.mrp) : "-"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Best Discount</div>
                                    <div className="text-sm">
                                        {best
                                            ? (best.type === "percent" ? `${best.value}% off` : `${currency(best.value)} off`)
                                            : "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Final Price</div>
                                    <div className="text-xl font-bold inline-flex items-center gap-1">
                                        <IndianRupee className="h-5 w-5" />
                                        {price ? currency(finalPrice) : "-"}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Button size="lg" className="mt-2" onClick={() => setInqOpen(true)}>
                                    Request Quote
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Structured Content via layout */}
                    <div className="space-y-4">
                        {bundle.layout?.blocks?.map((b) => {
                            if (b.block_type === "images" || b.block_type === "basic") return null;
                            if (b.block_type === "list" && b.ref_id) return renderList(b.ref_id);
                            if (b.block_type === "spec_group" && b.ref_id) return renderSpecGroup(b.ref_id);
                            if (b.block_type === "table" && b.ref_id) return renderTable(b.ref_id);
                            return null;
                        })}
                    </div>

                    {/* Inquiry Dialog */}
                    <Dialog open={inqOpen} onOpenChange={setInqOpen}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Request Quote</DialogTitle>
                                <DialogDescription>
                                    Send us your details — we’ll get back with the best offer for <b>{bundle.base.name}</b>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> Name</Label>
                                        <Input value={inqName} onChange={(e) => setInqName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</Label>
                                        <Input type="email" value={inqEmail} onChange={(e) => setInqEmail(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone (optional)</Label>
                                    <Input value={inqPhone} onChange={(e) => setInqPhone(e.target.value)} />
                                </div>

                                <div className="space-y-1">
                                    <Label>Subject</Label>
                                    <Input value={inqSubject} onChange={(e) => setInqSubject(e.target.value)} />
                                </div>

                                <div className="space-y-1">
                                    <Label>Message</Label>
                                    <Textarea rows={5} value={inqMessage} onChange={(e) => setInqMessage(e.target.value)} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={submitInquiry}>
                                    <Send className="h-4 w-4 mr-1" /> Send Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
};

export default ProductPreview;
