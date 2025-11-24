import React, { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, RefreshCw, Search, Globe } from "lucide-react";

import {
    Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLang } from "@/context/LangContext";

type Category = {
    id: number;
    name: string;
    slug: string;
};

type ProductCardRow = {
    id: number;
    name: string | null;
    desc: string | null;
    imgurl: string | null;
    slug: string;
};

const ProductList: React.FC = () => {
    const { setLoading } = useLoading();
    const navigate = useNavigate();
    const { locale } = useLang(); // e.g., "en" | "zh" | "ar"

    const [q, setQ] = useState("");
    const [rows, setRows] = useState<ProductCardRow[]>([]);
    const [cats, setCats] = useState<Category[]>([]);
    const [openCreate, setOpenCreate] = useState(false);

    // Base info form (admin create contract)
    const [slug, setSlug] = useState("");
    const [code, setCode] = useState("");
    const [type, setType] = useState<"product" | "material" | "service">("product");
    const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
    const [publishedAt, setPublishedAt] = useState(""); // <input type="datetime-local">
    const [categoryId, setCategoryId] = useState<number | null>(null);

    // Translation for current locale only (admin create expects one locale)
    const [tName, setTName] = useState("");
    const [tDesc, setTDesc] = useState("");

    const API_BASE = import.meta.env.VITE_API_BASE || "";

    const loadAll = async () => {
        try {
            setLoading(true);
            const [listRes, catRes] = await Promise.all([
                // Admin listing endpoint (returns cards payload: name, desc, imgurl, slug, id)
                client.get<{ data: ProductCardRow[]; meta: any }>("/api/admin/products", {
                    params: q ? { q } : {},
                }),
                // Public categories list; name is localized with en fallback (fine for selector)
                client.get<{ data: Category[] }>("/api/categories"),
            ]);
            setRows(listRes.data.data || []);
            setCats(catRes.data.data || []);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => rows, [rows]);

    const resetForm = () => {
        setSlug("");
        setCode("");
        setType("product");
        setStatus("draft");
        setPublishedAt("");
        setCategoryId(null);
        setTName("");
        setTDesc("");
    };

    const generateSlugFromName = () => {
        if (tName) {
            const generatedSlug = tName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            setSlug(generatedSlug);
        }
    };

    // Convert <input type="datetime-local"> value to "YYYY-MM-DD HH:mm:ss"
    const normalizeDateTime = (val: string) => {
        if (!val) return undefined;
        // val: "2025-10-17T15:30"
        const parts = val.trim().replace("T", " ");
        return parts.length === 16 ? parts + ":00" : parts; // add seconds if missing
    };

    const createProduct = async () => {
        if (!tName.trim()) {
            return toast.error("Name is required for the current language");
        }

        try {
            setLoading(true);
            const payload = {
                base: {
                    slug: slug.trim() || undefined,
                    code: code.trim() || undefined,
                    type: type ?? 'product',
                    status,
                    published_at: normalizeDateTime(publishedAt),
                    category_id: categoryId ?? undefined,
                },
                translation: {
                    locale: locale, // from useLang()
                    name: tName.trim(),
                    description: tDesc.trim() || undefined,
                },
            };

            const res = await client.post("/api/admin/products", payload);

            toast.success("Product created");
            setOpenCreate(false);
            resetForm();

            // Backend create response shape:
            // { id, slug, code, type, status, published_at, category_id, layout_id, translation: { id, locale, name, description } }
            const createdSlug = res.data?.slug;
            if (createdSlug) navigate(`/product/${createdSlug}`);
            else navigate(`/products`); // fallback
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 w-72"
                            placeholder="Search products…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => loadAll()}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                </div>
                <Button onClick={() => setOpenCreate(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                </Button>
            </div>

            {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground">No products found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p) => (
                        <Card
                            key={p.id}
                            className="hover:shadow-md transition cursor-pointer"
                            onClick={() => navigate(`/product/${p.slug}`)}
                        >
                            <CardHeader className="p-0">
                                <div className="w-full h-44 bg-muted rounded-t overflow-hidden">
                                    {p.imgurl ? (
                                        <img
                                            src={`${API_BASE}${p.imgurl}`}
                                            alt={p.name ?? "Product"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <CardTitle className="text-base">
                                    {p.name || "(no title in this language)"}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {p.desc || "No description"}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    ID: {p.id}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    /{p.slug}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Product</DialogTitle>
                        <DialogDescription>
                            Base info + one translation for your current language.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="base" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="base">Base Information</TabsTrigger>
                            <TabsTrigger value="translation">
                                <Globe className="h-4 w-4 mr-2" />
                                Translation ({locale})
                            </TabsTrigger>
                        </TabsList>

                        {/* Base Info */}
                        <TabsContent value="base" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/*     <div className="space-y-2">
                                    <Label htmlFor="type">Product Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="product">Product</SelectItem>
                                            <SelectItem value="material">Material</SelectItem>
                                            <SelectItem value="service">Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>*/}

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">
                                        Slug{" "}
                                        {!slug && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 ml-2 text-xs"
                                                onClick={generateSlugFromName}
                                            >
                                                Generate from name
                                            </Button>
                                        )}
                                    </Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="product-slug"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Product Code (Optional)</Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="PROD-001"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="categories">Category (Optional)</Label>
                                    <Select
                                        value={categoryId ? String(categoryId) : ""}
                                        onValueChange={(v) => setCategoryId(Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cats.map((cat) => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="publishedAt">Publish Date (Optional)</Label>
                                    <Input
                                        id="publishedAt"
                                        type="datetime-local"
                                        value={publishedAt}
                                        onChange={(e) => setPublishedAt(e.target.value)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* One Translation (current locale) */}
                        <TabsContent value="translation" className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={tName}
                                    onChange={(e) => setTName(e.target.value)}
                                    placeholder={`Product name in ${locale}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    rows={3}
                                    value={tDesc}
                                    onChange={(e) => setTDesc(e.target.value)}
                                    placeholder={`Product description in ${locale}`}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenCreate(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createProduct}>Create Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductList;
