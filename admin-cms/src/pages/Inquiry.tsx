import React, { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import toast from "react-hot-toast";
import { useLoading } from "@/context/LoadingContext";
import {
    Mail,
    Phone,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowUpRight,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type InquiryRow = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
    created_at?: string | null;
};

type IndexResponse = {
    data: InquiryRow[];
    meta: {
        total: number;
        page: number;
        perPage: number;
        sortBy: string;
        order: "ASC" | "DESC";
        q: string;
    };
};

const Inquiry: React.FC = () => {
    const { setLoading } = useLoading();

    // list state
    const [rows, setRows] = useState<InquiryRow[]>([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [sortBy, setSortBy] = useState<"created_at" | "name" | "email">("created_at");
    const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

    // selection
    const [selected, setSelected] = useState<InquiryRow | null>(null);

    // delete dialog
    const [confirmOpen, setConfirmOpen] = useState(false);

    const pages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await client.get<IndexResponse>("/api/inquiries", {
                params: { q, page, perPage, sortBy, order },
            });
            setRows(res.data.data || []);
            setTotal(res.data.meta?.total || 0);

            // preserve selection or select first item
            if (res.data.data?.length) {
                const existing = res.data.data.find((r) => r.id === selected?.id);
                setSelected(existing || res.data.data[0]);
            } else {
                setSelected(null);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to load inquiries";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, sortBy, order]);

    const onSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadData();
    };

    const deleteSelected = async () => {
        if (!selected) return;
        try {
            setLoading(true);
            await client.delete(`/api/inquiries/${selected.id}`);
            toast.success("Inquiry deleted");
            // reload and keep a sensible selection
            const newTotal = total - 1;
            const lastPage = Math.max(1, Math.ceil(newTotal / perPage));
            if (page > lastPage) setPage(lastPage);
            else loadData();
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to delete inquiry";
            toast.error(msg);
        } finally {
            setLoading(false);
            setConfirmOpen(false);
        }
    };

    const ListItem: React.FC<{ item: InquiryRow; active: boolean; onClick: () => void }> = ({
        item,
        active,
        onClick,
    }) => (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-3 rounded-md border transition
        ${active ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted"}`
            }
        >
            <div className="flex items-center justify-between">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.created_at?.replace("T", " ").slice(0, 19) || "-"}</div>
            </div>
            <div className="text-sm text-muted-foreground truncate">{item.email}{item.phone ? ` • ${item.phone}` : ""}</div>
            {item.subject ? <div className="text-sm mt-1 line-clamp-1">{item.subject}</div> : null}
        </button>
    );

    return (
        <div className="w-full h-full p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-140px)]">
                {/* Left: List panel */}
                <Card className="md:col-span-1 h-full flex flex-col overflow-hidden">
                    <CardHeader className="space-y-2">
                        <CardTitle>Inquiries</CardTitle>
                        <CardDescription>Click an item to view details.</CardDescription>
                        <form onSubmit={onSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Input
                                    placeholder="Search name, email, phone, subject…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="pr-9"
                                />
                                <Search className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                            </div>
                            <Button type="submit" variant="outline">Search</Button>
                        </form>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Sort</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at">Created</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
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
                    </CardHeader>

                    <CardContent className="flex-1 overflow-auto space-y-2">
                        {rows.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No inquiries found.</div>
                        ) : (
                            rows.map((item) => (
                                <ListItem
                                    key={item.id}
                                    item={item}
                                    active={selected?.id === item.id}
                                    onClick={() => setSelected(item)}
                                />
                            ))
                        )}
                    </CardContent>

                    <div className="flex items-center gap-2 px-3 justify-between">
                        <Label className="text-sm">Per Page</Label>
                        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-2 text-xs">Page {page} / {Math.max(1, Math.ceil(total / perPage))}</div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / perPage)), p + 1))}
                                disabled={page >= pages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Right: Details panel */}
                <Card className="md:col-span-2 h-full overflow-hidden">
                    <CardHeader className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Inquiry Details</CardTitle>
                                <CardDescription>Read and manage the selected inquiry.</CardDescription>
                            </div>

                            {/* Delete button with AlertDialog */}
                            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={!selected}>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. The inquiry will be permanently removed from the database.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={deleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="h-[calc(100%-120px)] overflow-auto">
                        {!selected ? (
                            <div className="text-sm text-muted-foreground">Select an inquiry from the list to view details.</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Name</Label>
                                        <div className="text-base">{selected.name}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Email</Label>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 opacity-70" />
                                            <a className="text-primary hover:underline break-all" href={`mailto:${selected.email}`}>
                                                {selected.email}
                                            </a>
                                            <a
                                                className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                                href={`mailto:${selected.email}?subject=${encodeURIComponent(selected.subject || "Inquiry")}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Compose <ArrowUpRight className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Phone</Label>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 opacity-70" />
                                            <div>{selected.phone || "-"}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Created At</Label>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 opacity-70" />
                                            <div>{selected.created_at?.replace("T", " ").slice(0, 19) || "-"}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-muted-foreground">Subject</Label>
                                        <div className="text-base">{selected.subject || "-"}</div>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-muted-foreground">Message</Label>
                                        <div className="text-sm whitespace-pre-wrap leading-6 p-3 rounded-md border bg-muted/30">
                                            {selected.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Inquiry;
