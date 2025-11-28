import React, { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import toast from "react-hot-toast";
import { useLoading } from "@/context/LoadingContext";
import {
    Image as ImageIcon,
    Plus,
    Search,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type Banner = {
    id: number;
    image_url: string | null;
    is_permanent: 0 | 1;
    from_date: string | null;
    to_date: string | null;
    is_active: 0 | 1;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
};

type BannersIndexResponse = {
    data: Banner[];
    meta: {
        total: number;
        page: number;
        limit: number;
        q?: string;
        active?: "0" | "1" | "";
        permanent?: "0" | "1" | "";
        sortBy?: "id" | "created_at" | "updated_at" | "sort_order" | "is_active";
        order?: "ASC" | "DESC";
    };
};

const toSQL = (local: string | null): string | null => {
    if (!local) return null;
    const d = new Date(local);
    if (isNaN(d.getTime())) return local.includes("T") ? local.replace("T", " ") + ":00" : local;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const fromSQLToLocal = (sql: string | null): string => (sql ? sql.replace(" ", "T").slice(0, 16) : "");

const Banners: React.FC = () => {
    const { setLoading } = useLoading();

    // table/meta state
    const [rows, setRows] = useState<Banner[]>([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [sortBy, setSortBy] = useState<"id" | "created_at" | "updated_at" | "sort_order" | "is_active">("sort_order");
    const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
    const [activeFilter, setActiveFilter] = useState<"" | "0" | "1">("");
    const [permanentFilter, setPermanentFilter] = useState<"" | "0" | "1">("");

    const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    // create state
    const [createOpen, setCreateOpen] = useState(false);
    const [cFile, setCFile] = useState<File | null>(null);
    const [cPreview, setCPreview] = useState<string | null>(null);
    const [cPermanent, setCPermanent] = useState(false);
    const [cFrom, setCFrom] = useState("");
    const [cTo, setCTo] = useState("");

    // edit state
    const [editOpen, setEditOpen] = useState(false);
    const [editBanner, setEditBanner] = useState<Banner | null>(null);
    const [ePermanent, setEPermanent] = useState(false);
    const [eFrom, setEFrom] = useState("");
    const [eTo, setETo] = useState("");

    // delete state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const API_BASE = import.meta.env.VITE_API_BASE as string || "";
    const absUrl = (url?: string | null) => {
        if (!url) return "";
        if (/^https?:\/\//i.test(url)) return url;
        return API_BASE + url;
    };

    const loadBanners = async () => {
        try {
            setLoading(true);
            const res = await client.get<BannersIndexResponse>("/api/banners", {
                params: { q, page, limit, sortBy, order, active: activeFilter, permanent: permanentFilter },
            });
            setRows(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBanners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, sortBy, order, activeFilter, permanentFilter]);

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadBanners();
    };

    // create
    const resetCreate = () => {
        if (cPreview) URL.revokeObjectURL(cPreview);
        setCFile(null);
        setCPreview(null);
        setCPermanent(false);
        setCFrom("");
        setCTo("");
    };

    const onCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) {
            if (cPreview) URL.revokeObjectURL(cPreview);
            setCFile(null);
            setCPreview(null);
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Banner must be JPG/PNG/WEBP");
            e.target.value = "";
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error("Max size is 8 MB");
            e.target.value = "";
            return;
        }
        if (cPreview) URL.revokeObjectURL(cPreview);
        setCFile(file);
        setCPreview(URL.createObjectURL(file));
    };

    const submitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cFile) return toast.error("Please choose a banner image");

        try {
            setLoading(true);
            const form = new FormData();
            form.append("image", cFile); // backend expects "image"
            form.append("is_permanent", cPermanent ? "1" : "0");
            if (!cPermanent) {
                const fd = toSQL(cFrom);
                const td = toSQL(cTo);
                if (!fd || !td) {
                    setLoading(false);
                    return toast.error("Please set both From and To dates");
                }
                form.append("from_date", fd);
                form.append("to_date", td);
            } else {
                // empty strings -> backend normalizes to NULL
                form.append("from_date", "");
                form.append("to_date", "");
            }

            await client.post("/api/banners", form, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Banner created");
            setCreateOpen(false);
            resetCreate();
            setPage(1);
            loadBanners();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Failed to create banner");
        } finally {
            setLoading(false);
        }
    };

    // edit
    const openEdit = (b: Banner) => {
        setEditBanner(b);
        setEPermanent(b.is_permanent === 1);
        setEFrom(fromSQLToLocal(b.from_date));
        setETo(fromSQLToLocal(b.to_date));
        setEditOpen(true);
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBanner) return;

        try {
            setLoading(true);
            const payload: Partial<Banner> = {
                is_permanent: ePermanent ? 1 : 0,
                from_date: ePermanent ? null : toSQL(eFrom),
                to_date: ePermanent ? null : toSQL(eTo),
            };

            if (!ePermanent && (!payload.from_date || !payload.to_date)) {
                setLoading(false);
                return toast.error("Please set both From and To dates");
            }

            await client.put(`/api/banners/${editBanner.id}`, payload);
            toast.success("Banner updated");
            setEditOpen(false);
            loadBanners();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Failed to update banner");
        } finally {
            setLoading(false);
        }
    };

    // delete
    const askDelete = (id: number) => {
        setDeleteId(id);
        setDeleteOpen(true);
    };

    const doDelete = async () => {
        if (!deleteId) return;
        try {
            setLoading(true);
            await client.delete(`/api/banners/${deleteId}`);
            toast.success("Banner deleted");
            const newTotal = total - 1;
            const lastPage = Math.max(1, Math.ceil(newTotal / limit));
            if (page > lastPage) setPage(lastPage);
            else loadBanners();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Failed to delete banner");
        } finally {
            setLoading(false);
            setDeleteOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4">
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <CardTitle>Banners</CardTitle>
                        <CardDescription>Manage app/site banners. Images are displayed at a 6:1 ratio.</CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <form onSubmit={onSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Input
                                    placeholder="Search by image URL…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="pr-10 w-56"
                                />
                                <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                            </div>
                            <Button type="submit" variant="outline">Search</Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Active</Label>
                            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as any); setPage(1); }}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Permanent</Label>
                            <Select value={permanentFilter} onValueChange={(v) => { setPermanentFilter(v as any); setPage(1); }}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="1">Permanent</SelectItem>
                                    <SelectItem value="0">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Sort</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sort_order">Sort Order</SelectItem>
                                    <SelectItem value="created_at">Created</SelectItem>
                                    <SelectItem value="updated_at">Updated</SelectItem>
                                    <SelectItem value="is_active">Active</SelectItem>
                                    <SelectItem value="id">ID</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DESC">Desc</SelectItem>
                                    <SelectItem value="ASC">Asc</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Banner
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {rows.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-6">No banners found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {rows.map((b) => (
                                <Card key={b.id} className="overflow-hidden">
                                    <div className="w-full bg-muted">
                                        <div className="w-full aspect-[6/1] overflow-hidden">
                                            {b.image_url ? (
                                                <img
                                                    src={absUrl(b.image_url)}
                                                    alt={`Banner #${b.id}`}
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-6 w-6 opacity-60" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="text-sm">
                                            {b.is_permanent ? (
                                                <div className="font-medium">Permanent</div>
                                            ) : (
                                                <div className="space-x-2">
                                                    <span className="font-medium">From:</span>
                                                    <span className="text-muted-foreground">{b.from_date || "-"}</span>
                                                    <span className="font-medium ml-3">To:</span>
                                                    <span className="text-muted-foreground">{b.to_date || "-"}</span>
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                ID #{b.id} • Sort {b.sort_order} • {b.is_active ? "Active" : "Inactive"}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                                                <Pencil className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>

                                            <AlertDialog open={deleteOpen && deleteId === b.id} onOpenChange={(o) => {
                                                if (!o) { setDeleteOpen(false); setDeleteId(null); }
                                            }}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" onClick={() => askDelete(b.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete banner?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove the banner.
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
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-end gap-2">
                        <Label className="text-sm">Per Page</Label>
                        <Select value={String(limit)} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="24">24</SelectItem>
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
                </CardContent>
            </Card>

            {/* Create Banner */}
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Banner</DialogTitle>
                        <DialogDescription>Upload a 6:1 image. If “Permanent” is checked, dates are ignored.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid md:grid-cols-[2fr,1fr] gap-4">
                            <div>
                                <Label>Preview</Label>
                                <div className="mt-2 w-full border rounded bg-muted overflow-hidden">
                                    <div className="aspect-[6/1]">
                                        {cPreview ? (
                                            <img src={cPreview} alt="Banner preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="h-6 w-6 opacity-60" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="cfile">Banner Image (JPG/PNG/WEBP, max 8MB)</Label>
                                    <Input id="cfile" type="file" accept="image/png,image/jpeg,image/webp" onChange={onCreateFileChange} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox id="cperm" checked={cPermanent} onCheckedChange={(v) => setCPermanent(Boolean(v))} />
                                    <Label htmlFor="cperm">Permanent</Label>
                                </div>

                                {!cPermanent && (
                                    <>
                                        <div className="space-y-1">
                                            <Label htmlFor="cfrom">From</Label>
                                            <Input id="cfrom" type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="cto">To</Label>
                                            <Input id="cto" type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Banner */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Banner</DialogTitle>
                        <DialogDescription>Modify schedule or mark as permanent.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEdit} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Checkbox id="eperm" checked={ePermanent} onCheckedChange={(v) => setEPermanent(Boolean(v))} />
                            <Label htmlFor="eperm">Permanent</Label>
                        </div>

                        {!ePermanent && (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="efrom">From</Label>
                                    <Input id="efrom" type="datetime-local" value={eFrom} onChange={(e) => setEFrom(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="eto">To</Label>
                                    <Input id="eto" type="datetime-local" value={eTo} onChange={(e) => setETo(e.target.value)} />
                                </div>
                            </>
                        )}

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Banners;
