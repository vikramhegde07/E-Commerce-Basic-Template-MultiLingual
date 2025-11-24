// src/pages/admin/CategoriesList.tsx
import React, { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import toast from "react-hot-toast";
import { useLoading } from "@/context/LoadingContext";
import { useLang } from "@/context/LangContext";

import {
    FolderTree,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    MoveUp,
    MoveDown,
    Image as ImageIcon,
} from "lucide-react";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Category = {
    id: number;
    name: string;
    slug: string;
    image_url?: string | null;
    description?: string | null;
    parent_id?: number | null;
    sort_order: number;
    path?: string | null;
    depth?: number;
    meta?: any;
    created_at?: string | null;
    updated_at?: string | null;
    fallbackLocale?: string | boolean;
    translations?: Array<{
        id: number;
        category_id: number;
        locale: string;
        name?: string | null;
        description?: string | null;
        meta?: any;
        created_at?: string;
        updated_at?: string;
    }>;
};

type IndexResponse = {
    data: Category[];
    meta: {
        total: number;
        page: number;
        limit: number;
        q?: string;
        parent_id?: number | null;
        sortBy?: string;
        order?: "ASC" | "DESC";
        locale?: string;
    };
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const SUPPORTED_LOCALES = ["en", "ar", "zh"] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

const CategoriesList: React.FC = () => {
    const { setLoading } = useLoading();
    const { locale, isRTL } = useLang();

    // table state
    const [rows, setRows] = useState<Category[]>([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [sortBy, setSortBy] = useState<"sort_order" | "name" | "slug" | "created_at" | "depth">("sort_order");
    const [order, setOrder] = useState<"ASC" | "DESC">("ASC");
    const [parentFilter, setParentFilter] = useState<string>("");

    const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    // parent list for filter and forms
    const [allCatsFlat, setAllCatsFlat] = useState<Category[]>([]);

    // view modal
    const [viewOpen, setViewOpen] = useState(false);
    const [viewCat, setViewCat] = useState<Category | null>(null);

    // create modal + upload
    const [createOpen, setCreateOpen] = useState(false);
    const [cName, setCName] = useState("");
    const [cSlug, setCSlug] = useState("");
    const [cParent, setCParent] = useState<string>("");
    const [cDesc, setCDesc] = useState("");
    const [cSort, setCSort] = useState<number>(0);
    const [cFile, setCFile] = useState<File | null>(null);
    const [cPreview, setCPreview] = useState<string | null>(null);

    // edit modal (tabs)
    const [editOpen, setEditOpen] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    // Base tab
    const [eSlug, setESlug] = useState("");
    const [eParent, setEParent] = useState<string>("");
    const [eSort, setESort] = useState<number>(0);
    const [eExistingImage, setEExistingImage] = useState<string>("");
    const [eFile, setEFile] = useState<File | null>(null);
    const [ePreview, setEPreview] = useState<string | null>(null);
    const [eRemoveImage, setERemoveImage] = useState<boolean>(false);
    // Translations tab
    type TrForm = Record<Locale, { name: string; description: string; meta: string }>;
    const blankTr = (): TrForm => ({ en: { name: "", description: "", meta: "" }, ar: { name: "", description: "", meta: "" }, zh: { name: "", description: "", meta: "" } });
    const [trForm, setTrForm] = useState<TrForm>(blankTr());

    // ---- data loading ----
    const loadAllParents = async () => {
        try {
            const res = await client.get<{ data: Category[] }>("/api/public/categories", { params: { flat: 1 } });
            const list = (res.data?.data || []).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setAllCatsFlat(list);
        } catch {/* ignore */ }
    };

    const loadCategories = async () => {
        try {
            setLoading(true);
            const params: any = { q, page, limit, sortBy, order };
            if (parentFilter !== "") params.parent_id = parentFilter === "0" ? 0 : Number(parentFilter);
            const res = await client.get<IndexResponse>("/api/categories", { params });
            setRows(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    // initial + when locale changes
    useEffect(() => { loadAllParents(); }, [locale]);
    // table reload on filters
    useEffect(() => { loadCategories(); }, [page, limit, sortBy, order, parentFilter, locale]);

    const onSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadCategories();
    };

    // ---- view ----
    const openView = async (row: Category) => {
        try {
            setLoading(true);
            const res = await client.get<Category>(`/api/categories/${row.id}`);
            setViewCat(res.data);
            setViewOpen(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to fetch category");
        } finally {
            setLoading(false);
        }
    };

    // ---- create ----
    const resetCreate = () => {
        setCName(""); setCSlug(""); setCParent(""); setCDesc(""); setCSort(0);
        if (cPreview) URL.revokeObjectURL(cPreview);
        setCFile(null); setCPreview(null);
    };

    const onCreateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        if (!f) { if (cPreview) URL.revokeObjectURL(cPreview); setCFile(null); setCPreview(null); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast.error("Image must be JPG/PNG/WEBP"); e.target.value = ""; return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("Max size 5MB"); e.target.value = ""; return; }
        if (cPreview) URL.revokeObjectURL(cPreview);
        setCFile(f); setCPreview(URL.createObjectURL(f));
    };

    const submitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cName) return toast.error("Name is required");
        try {
            setLoading(true);

            if (cFile) {
                const form = new FormData();
                form.append("name", cName); // translation for current locale
                if (cSlug) form.append("slug", cSlug); // EN-only slug
                form.append("parent_id", cParent === "" || cParent === "none" ? "" : String(Number(cParent)));
                if (cDesc) form.append("description", cDesc);
                form.append("sort_order", String(Number.isFinite(cSort) ? cSort : 0));
                form.append("image", cFile);

                await client.post("/api/categories", form, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                const payload: any = {
                    name: cName,
                    slug: cSlug || undefined,
                    parent_id: cParent === "" || cParent === "none" ? null : Number(cParent),
                    description: cDesc || undefined,
                    sort_order: Number.isFinite(cSort) ? cSort : 0,
                };
                await client.post("/api/categories", payload);
            }

            toast.success("Category created");
            setCreateOpen(false);
            resetCreate();
            setPage(1);
            loadCategories(); loadAllParents();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to create category");
        } finally {
            setLoading(false);
        }
    };

    // ---- edit (new: tabs + load all translations) ----
    const openEdit = async (row: Category) => {
        try {
            setLoading(true);
            const res = await client.get<Category>(`/api/categories/${row.id}`, { params: { include: "translations" } });
            const c = res.data;
            setEditCat(c);

            // base
            setESlug(c.slug || "");
            setEParent(c.parent_id != null ? String(c.parent_id) : "");
            setESort(Number(c.sort_order || 0));
            setEExistingImage(c.image_url || "");
            if (ePreview) URL.revokeObjectURL(ePreview);
            setEFile(null); setEPreview(null); setERemoveImage(false);

            // translations -> form state
            const tr = blankTr();
            (c.translations || []).forEach(t => {
                const l = t.locale as Locale;
                if (SUPPORTED_LOCALES.includes(l)) {
                    tr[l] = {
                        name: t.name || "",
                        description: t.description || "",
                        meta: t.meta ? (typeof t.meta === "string" ? t.meta : JSON.stringify(t.meta, null, 2)) : "",
                    };
                }
            });
            setTrForm(tr);

            setEditOpen(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to fetch category");
        } finally {
            setLoading(false);
        }
    };

    const onEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        if (!f) { if (ePreview) URL.revokeObjectURL(ePreview); setEFile(null); setEPreview(null); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast.error("Image must be JPG/PNG/WEBP"); e.target.value = ""; return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("Max size 5MB"); e.target.value = ""; return; }
        if (ePreview) URL.revokeObjectURL(ePreview);
        setEFile(f); setEPreview(URL.createObjectURL(f));
        setERemoveImage(false);
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCat) return;

        try {
            setLoading(true);

            // build payload
            const base: any = {
                slug: eSlug || undefined,
                parent_id: eParent === "" || eParent === "none" ? null : Number(eParent),
                sort_order: Number.isFinite(eSort) ? eSort : 0,
            };
            if (eRemoveImage) base.image_url = ""; // clear
            const translations = SUPPORTED_LOCALES.map(l => {
                const item = trForm[l];
                // send only if something is set (avoid accidental overwrite)
                const hasAny = (item.name?.trim() || item.description?.trim() || item.meta?.trim());
                if (!hasAny) return null;
                return {
                    locale: l,
                    name: item.name?.trim() || undefined,
                    description: item.description || undefined,
                    meta: safeParseMeta(item.meta),
                };
            }).filter(Boolean);

            if (eFile) {
                const form = new FormData();
                form.append("base", JSON.stringify(base));
                form.append("translations", JSON.stringify(translations));
                form.append("image", eFile);
                await client.post(`/api/categories/${editCat.id}/update`, form, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                await client.post(`/api/categories/${editCat.id}/update`, { base, translations });
            }

            toast.success("Category updated");
            setEditOpen(false);
            loadCategories(); loadAllParents();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    const safeParseMeta = (txt: string) => {
        const t = txt?.trim();
        if (!t) return undefined;
        try { return JSON.parse(t); } catch { return t; }
    };

    // ---- delete ----
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const askDelete = (id: number) => { setDeleteId(id); setDeleteOpen(true); };
    const doDelete = async () => {
        if (!deleteId) return;
        try {
            setLoading(true);
            await client.delete(`/api/categories/${deleteId}`);
            toast.success("Category deleted");
            const newTotal = total - 1;
            const lastPage = Math.max(1, Math.ceil(newTotal / limit));
            if (page > lastPage) setPage(lastPage); else loadCategories();
            loadAllParents();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete category");
        } finally {
            setLoading(false); setDeleteOpen(false); setDeleteId(null);
        }
    };

    const moveUp = async (row: Category) => {
        try {
            setLoading(true);
            const newSort = (row.sort_order ?? 0) - 1;
            await client.post(`/api/categories/${row.id}/reorder`, { sort_order: newSort });
            loadCategories();
        } catch { toast.error("Failed to move up"); }
        finally { setLoading(false); }
    };
    const moveDown = async (row: Category) => {
        try {
            setLoading(true);
            const newSort = (row.sort_order ?? 0) + 1;
            await client.post(`/api/categories/${row.id}/reorder`, { sort_order: newSort });
            loadCategories();
        } catch { toast.error("Failed to move down"); }
        finally { setLoading(false); }
    };

    const findParentName = (pid?: number | null) => {
        if (pid == null) return "[Root]";
        const p = allCatsFlat.find(c => c.id === pid);
        return p ? p.name : `[${pid}]`;
    };

    const rtlClass = isRTL ? "rtl" : "";

    return (
        <div className={`w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4 ${rtlClass}`}>
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FolderTree className="h-5 w-5" />
                            Categories
                        </CardTitle>
                        <CardDescription>
                            Manage product categories. Working locale: <b>{locale}</b>
                        </CardDescription>
                    </div>

                    <div className="flex gap-2 items-center">

                        <form onSubmit={onSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Input placeholder="Search name/slug…" value={q} onChange={(e) => setQ(e.target.value)} className="pr-10 w-56" />
                                <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                            </div>
                            <Button type="submit" variant="outline">Search</Button>
                        </form>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Category
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Parent</Label>
                            <Select value={parentFilter} onValueChange={(v) => { setParentFilter(v === "none" ? "" : v); setPage(1); }}>
                                <SelectTrigger className="w-[220px]"><SelectValue placeholder="All parents" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">All</SelectItem>
                                    <SelectItem value="0">[Root]</SelectItem>
                                    {allCatsFlat.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Sort</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sort_order">Sort Order</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="slug">Slug</SelectItem>
                                    <SelectItem value="depth">Depth</SelectItem>
                                    <SelectItem value="created_at">Created</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ASC">Asc</SelectItem>
                                    <SelectItem value="DESC">Desc</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="ml-auto flex items-center gap-1">
                            <Label className="text-sm">Per Page</Label>
                            <Select value={String(limit)} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
                                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-2 text-sm">Page {page} / {pages}</div>
                            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableCaption>{total} category(ies) total</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">ID</TableHead>
                                <TableHead>Img</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Parent</TableHead>
                                <TableHead>Depth</TableHead>
                                <TableHead>Sort</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">No categories found.</TableCell>
                                </TableRow>
                            ) : rows.map((c) => (
                                <TableRow key={c.id} className="cursor-pointer" onClick={() => openView(c)}>
                                    <TableCell>{c.id}</TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="w-8 h-8 rounded overflow-hidden border bg-muted flex items-center justify-center">
                                            {c.image_url ? (
                                                <img src={API_BASE + c.image_url} alt={c.name} className="w-8 h-8 object-cover" />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 opacity-60" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <span className="inline-flex items-center gap-2">
                                            {c.name}
                                            {c.fallbackLocale === "1" || c.fallbackLocale === true ? (
                                                <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800">EN</span>
                                            ) : <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800">{locale}</span>
                                            }
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                                    <TableCell>{findParentName(c.parent_id ?? null)}</TableCell>
                                    <TableCell>{c.depth ?? 0}</TableCell>
                                    <TableCell className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Button variant="outline" size="icon" onClick={() => moveUp(c)} title="Move up"><MoveUp className="h-4 w-4" /></Button>
                                        <div className="w-10 text-center">{c.sort_order ?? 0}</div>
                                        <Button variant="outline" size="icon" onClick={() => moveDown(c)} title="Move down"><MoveDown className="h-4 w-4" /></Button>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                                                <Pencil className="h-4 w-4 mr-1" /> Edit
                                            </Button>

                                            <AlertDialog open={deleteOpen && deleteId === c.id} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteId(null); } }}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" onClick={() => askDelete(c.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove the category. Its children (if any) will have <b>parent_id</b> set to <i>NULL</i>. Any stored image will be deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Category Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-scroll">
                    <DialogHeader>
                        <DialogTitle>Category Details</DialogTitle>
                        <DialogDescription>Read-only details. Use Edit to make changes.</DialogDescription>
                    </DialogHeader>
                    {viewCat ? (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-sm text-muted-foreground">ID</div>
                            <div className="col-span-2 text-sm">{viewCat.id}</div>

                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="col-span-2 text-sm flex items-center gap-2">
                                {viewCat.name}
                                {viewCat.fallbackLocale ? (
                                    <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800">EN</span>
                                ) : null}
                            </div>

                            <div className="text-sm text-muted-foreground">Slug</div>
                            <div className="col-span-2 text-sm">{viewCat.slug}</div>

                            <div className="text-sm text-muted-foreground">Parent</div>
                            <div className="col-span-2 text-sm">{findParentName(viewCat.parent_id ?? null)}</div>

                            <div className="text-sm text-muted-foreground">Depth</div>
                            <div className="col-span-2 text-sm">{viewCat.depth ?? 0}</div>

                            <div className="text-sm text-muted-foreground">Sort Order</div>
                            <div className="col-span-2 text-sm">{viewCat.sort_order ?? 0}</div>

                            <div className="text-sm text-muted-foreground">Image</div>
                            <div className="col-span-2">
                                {viewCat.image_url ? (
                                    <img src={API_BASE + viewCat.image_url} alt={viewCat.name} className="h-16 w-16 rounded object-cover border" />
                                ) : (
                                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 opacity-60" />
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-muted-foreground">Description</div>
                            <div className="col-span-2 text-sm whitespace-pre-wrap">{viewCat.description || "-"}</div>

                            <div className="text-sm text-muted-foreground">Path</div>
                            <div className="col-span-2 text-sm">{viewCat.path || "-"}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Loading…</div>
                    )}
                    <DialogFooter><Button onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Category */}
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-scroll">
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                        <DialogDescription>Upload an image or leave empty. Saves to locale: <b>{locale}</b></DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCreate} className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="cname">Name</Label>
                            <Input id="cname" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Door Frames" required />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cslug">Slug (EN-only, optional)</Label>
                            <Input id="cslug" value={cSlug} onChange={(e) => setCSlug(e.target.value)} placeholder="door-frames" />
                        </div>

                        <div className="space-y-1">
                            <Label>Parent</Label>
                            <Select value={cParent} onValueChange={setCParent}>
                                <SelectTrigger><SelectValue placeholder="[Root]" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">[Root]</SelectItem>
                                    {allCatsFlat.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cimage">Image (JPG/PNG/WEBP, max 5MB)</Label>
                            <Input id="cimage" type="file" accept="image/png,image/jpeg,image/webp" onChange={onCreateFile} />
                            <div className="mt-2">
                                {cPreview ? (
                                    <img src={cPreview} alt="Preview" className="h-16 w-16 rounded object-cover border" />
                                ) : (
                                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 opacity-60" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cdesc">Description (optional)</Label>
                            <Textarea id="cdesc" value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="About this category..." />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="csort">Sort Order</Label>
                            <Input id="csort" type="number" value={cSort} onChange={(e) => setCSort(parseInt(e.target.value || "0", 10))} />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Category (Tabs: Base + Translations) */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-scroll">
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update base fields and translations (multiple languages at once).</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="base" className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="base">Base</TabsTrigger>
                            <TabsTrigger value="translations">Translations</TabsTrigger>
                        </TabsList>

                        {/* Base Tab */}
                        <TabsContent value="base" className="pt-4 space-y-3">
                            <form onSubmit={submitEdit} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="eslug">Slug (EN-only)</Label>
                                    <Input id="eslug" value={eSlug} onChange={(e) => setESlug(e.target.value)} />
                                </div>

                                <div className="space-y-1">
                                    <Label>Parent</Label>
                                    <Select value={eParent} onValueChange={setEParent}>
                                        <SelectTrigger><SelectValue placeholder="[Root]" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">[Root]</SelectItem>
                                            {allCatsFlat.filter(c => c.id !== (editCat?.id ?? -1)).map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="eimage">Image (JPG/PNG/WEBP, max 5MB)</Label>
                                    <Input id="eimage" type="file" accept="image/png,image/jpeg,image/webp" onChange={onEditFile} />
                                    <div className="mt-2 flex items-center gap-3">
                                        {ePreview ? (
                                            <img src={ePreview} alt="Preview" className="h-16 w-16 rounded object-cover border" />
                                        ) : eExistingImage ? (
                                            <img src={API_BASE + eExistingImage} alt="Existing" className="h-16 w-16 rounded object-cover border" />
                                        ) : (
                                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 opacity-60" />
                                            </div>
                                        )}

                                        {!eFile && eExistingImage && (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <Checkbox checked={eRemoveImage} onCheckedChange={(v) => setERemoveImage(Boolean(v))} />
                                                Remove existing image
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="esort">Sort Order</Label>
                                    <Input id="esort" type="number" value={eSort} onChange={(e) => setESort(parseInt(e.target.value || "0", 10))} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>

                        {/* Translations Tab */}
                        <TabsContent value="translations" className="pt-4">
                            <form onSubmit={submitEdit} className="space-y-6">
                                {SUPPORTED_LOCALES.map((l) => (
                                    <div key={l} className="rounded-lg border p-3 space-y-3">
                                        <div className="text-sm font-medium uppercase tracking-wide">{l}</div>

                                        <div className="space-y-1">
                                            <Label>Name ({l})</Label>
                                            <Input value={trForm[l].name} onChange={(e) => setTrForm(s => ({ ...s, [l]: { ...s[l], name: e.target.value } }))} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Description ({l})</Label>
                                            <Textarea value={trForm[l].description} onChange={(e) => setTrForm(s => ({ ...s, [l]: { ...s[l], description: e.target.value } }))} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Meta (JSON) ({l})</Label>
                                            <Textarea placeholder='{"seoTitle":"..."}'
                                                value={trForm[l].meta}
                                                onChange={(e) => setTrForm(s => ({ ...s, [l]: { ...s[l], meta: e.target.value } }))} />
                                        </div>
                                    </div>
                                ))}

                                <DialogFooter className="gap-2">
                                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Translations</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteId(null); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                        <AlertDialogDescription>Children will have parent_id set to NULL. Stored image (if any) will be deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CategoriesList;
