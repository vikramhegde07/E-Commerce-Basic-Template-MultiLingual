import React, { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";
import toast from "react-hot-toast";

import {
    ArrowLeft, Trash2, Upload, Plus, PencilLine, ChevronUp, ChevronDown, ImagePlus, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/context/LangContext";
import { TableEditor } from "@/components/ProductDetails/ContentEditors";

// -------------------- Types (aligned with our admin bundle) --------------------
type ImageItem = {
    id: number;
    url: string;
    alt?: string | null;
    sort_order: number;
    group_id: number;
};

type ImageGroup = {
    group_id: number;
    name: string;
    sort_order: number;
    items: ImageItem[];
};

type LayoutBlock =
    | { id: number; layout_id: number; block_type: "images" | "image_set" | "basic"; ref_id: number | null; sort_order: number; config_json?: any }
    | { id: number; layout_id: number; block_type: "content_paragraph"; ref_id: number; sort_order: number; config_json?: any }
    | { id: number; layout_id: number; block_type: "list"; ref_id: number; sort_order: number; config_json?: any }
    | { id: number; layout_id: number; block_type: "spec_group"; ref_id: number; sort_order: number; config_json?: any }
    | { id: number; layout_id: number; block_type: "table"; ref_id: number; sort_order: number; config_json?: any }
    | { id: number; layout_id: number; block_type: "custom_html" | "specs_all" | "table_group"; ref_id: number | null; sort_order: number; config_json?: any };

type Layout = {
    id: number;
    name: string;
    is_default: 1 | 0;
    blocks: LayoutBlock[];
};

type BaseInfo = {
    id: number;
    slug: string;
    code?: string | null;
    type: "product" | "material" | "service";
    status: "draft" | "published" | "archived";
    published_at?: string | null;
    name?: string | null; // for current locale (no fallback on admin)
    desc?: string | null; // for current locale (no fallback on admin)
    translation_id?: number | null; // if translation row for current locale exists
};

type ListTranslation = {
    id: number;
    locale: string;
    title: string | null;
    description: string | null;
    items: string[]; // already flattened for this locale
};

type ListGroup = {
    id: number;
    slug: string;
    sort_order: number;
    translation?: ListTranslation | null; // may be missing in this locale
};

type SpecItem = { key: string; value: string; unit: string };
type SpecTranslation = {
    id: number;
    locale: string;
    title: string | null;
    description: string | null;
    items: SpecItem[];
};
type SpecGroup = {
    id: number;
    slug: string;
    sort_order: number;
    translation?: SpecTranslation | null;
};

type TableTranslation = {
    id: number;
    locale: string;
    title: string | null;
    subtitle?: string | null;
    columns: string[];
    rows: string[][];
    notes?: string | null;
};
type TableGroup = {
    id: number;
    sort_order: number;
    translation?: TableTranslation | null;
};

type ParagraphTranslation = {
    id: number;
    locale: string;
    title?: string | null;
    subtitle?: string | null;
    full_text?: string | null;
};
type Paragraph = {
    id: number;
    sort_order: number;
    translation?: ParagraphTranslation | null;
};

type AdminBundle = {
    meta: {
        fullData: boolean;
        locale: string;
        id: number;
    };
    base: BaseInfo;
    layout: Layout;
    images: ImageGroup[];        // per groups
    lists: ListGroup[];
    specs: SpecGroup[];
    tables: TableGroup[];
    paragraphs?: Paragraph[];    // optional; we’ll support if present
};

function normalizeBundle(raw: any, locale: string): AdminBundle {
    // layout
    const layoutId = Number(raw.layout?.id ?? 0);
    const blocks: LayoutBlock[] = (raw.layout?.blocks ?? []).map((b: any) => ({
        id: Number(b.id),
        layout_id: layoutId,                       // synthesize
        block_type: b.block_type,
        ref_id: b.ref_id === null ? null : Number(b.ref_id),
        sort_order: Number(b.sort_order ?? 0),
        config_json: b.config ?? b.config_json ?? null,
    }));

    // helper: turn [{ "list-4": {...} }, ...] into uniform array with translation
    const unfold = (arr: any[], type: "list" | "spec" | "table" | "paragraph") => {
        return (arr ?? []).map((obj: any) => {
            const key = Object.keys(obj)[0];
            const data = obj[key] || {};
            const id = Number(data.id);
            const sort = Number(data.sort_order ?? 0);
            if (type === "list") {
                return {
                    id,
                    slug: (key.startsWith("list-") ? key.slice(5) : (data.slug ?? "")),
                    sort_order: sort,
                    translation: {
                        id: data.translation_id ?? null,
                        locale,
                        title: data.title ?? null,
                        description: data.desc ?? null,
                        items: Array.isArray(data.items) ? data.items : [],
                    }
                } as ListGroup;
            }
            if (type === "spec") {
                return {
                    id,
                    slug: (key.startsWith("spec-") ? key.slice(5) : (data.slug ?? "")),
                    sort_order: sort,
                    translation: {
                        id: data.translation_id ?? null,
                        locale,
                        title: data.title ?? null,
                        description: data.desc ?? null,
                        items: Array.isArray(data.items) ? data.items.map((it: any) => ({
                            key: it.key ?? "", value: it.value ?? "", unit: it.unit ?? null
                        })) : [],
                    }
                } as SpecGroup;
            }
            if (type === "table") {
                return {
                    id,
                    sort_order: sort,
                    translation: {
                        id: data.translation_id ?? null,
                        locale,
                        title: data.title ?? null,
                        subtitle: data.subtitle ?? null,
                        columns: Array.isArray(data.columns) ? data.columns : [],
                        rows: Array.isArray(data.rows) ? data.rows : [],
                        notes: data.notes ?? null,
                    }
                } as TableGroup;
            }
            // paragraph
            return {
                id,
                sort_order: sort,
                translation: {
                    id: data.translation_id ?? null,
                    locale,
                    title: data.title ?? null,
                    subtitle: data.subtitle ?? null,
                    full_text: data.full_text ?? null,
                }
            } as Paragraph;
        });
    };

    return {
        meta: { fullData: !!raw.meta?.fullData, locale: raw.meta?.locale, id: Number(raw.meta?.id) },
        base: {
            id: Number(raw.meta?.id),
            slug: raw.meta?.slug,
            type: raw.base?.type ?? "product",
            status: raw.base?.status ?? "draft",
            published_at: raw.base?.published_at ?? null,
            name: raw.base?.name ?? null,
            desc: raw.base?.desc ?? null,
            translation_id: raw.base?.translation_id ?? null,
        },
        layout: { id: layoutId, name: raw.layout?.name ?? "Default", is_default: raw.layout?.is_default ? 1 : 0, blocks },
        images: Array.isArray(raw.images) ? raw.images : [],
        lists: unfold(raw.lists, "list") as ListGroup[],
        specs: unfold(raw.specs, "spec") as SpecGroup[],
        tables: unfold(raw.tables, "table") as TableGroup[],
        paragraphs: unfold(raw.paragraphs, "paragraph"),
    };
}


// -------------------- Page --------------------
const ProductDetails: React.FC = () => {
    const { slug = "" } = useParams();
    const navigate = useNavigate();
    const { setLoading } = useLoading();
    const { locale } = useLang();

    const [createGroup, setCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState("");

    const [bundle, setBundle] = useState<AdminBundle | null>(null);
    const [editing, setEditing] = useState<{ type: string; id?: number | null } | null>(null);
    const [addingType, setAddingType] = useState<"paragraph" | "list" | "spec_group" | "table" | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFiles, setImageFiles] = useState<FileList | null>(null);
    const [targetImageGroup, setTargetImageGroup] = useState<number | null>(null);

    // Forms for add/edit content (one set reused per block)
    const [formParagraph, setFormParagraph] = useState({ title: "", subtitle: "", full_text: "", sort_order: 0 });
    const [formList, setFormList] = useState({ slug: "", title: "", description: "", items: [""], sort_order: 0 });
    const [formSpec, setFormSpec] = useState({ slug: "", title: "", description: "", items: [{ key: "", value: "", unit: "" }], sort_order: 0 });
    const [formTable, setFormTable] = useState({ title: "", subtitle: "", columns: [""], rows: [[""]], notes: "", sort_order: 0 });

    // Local reorder tracker for blocks
    const [pendingBlocks, setPendingBlocks] = useState<LayoutBlock[] | null>(null);

    // which content block should be deleted (and how)
    const [deleteTarget, setDeleteTarget] = useState<{
        type: "paragraph" | "list" | "spec_group" | "table";
        id: number;
    } | null>(null);

    const API_BASE = import.meta.env.VITE_API_BASE || "";

    // -------- Fetch bundle --------
    const load = useCallback(async () => {
        try {
            setLoading(true);
            // Admin bundle (no fallback). Axios interceptor adds ?locale=
            const res = await client.get<AdminBundle>(`/api/admin/products/${encodeURIComponent(slug)}`);
            setBundle(normalizeBundle(res.data, locale));
            setPendingBlocks(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load product");
        } finally {
            setLoading(false);
        }
    }, [setLoading, slug]);

    useEffect(() => {
        load();
    }, [load, locale]);

    const productId = bundle?.base.id ?? 0;

    // Helpers to locate content by id from our arrays
    const listsById = useMemo(() => {
        const map = new Map<number, ListGroup>();
        (bundle?.lists || []).forEach((g) => map.set(g.id, g));
        return map;
    }, [bundle]);

    const specsById = useMemo(() => {
        const map = new Map<number, SpecGroup>();
        (bundle?.specs || []).forEach((g) => map.set(g.id, g));
        return map;
    }, [bundle]);

    const tablesById = useMemo(() => {
        const map = new Map<number, TableGroup>();
        (bundle?.tables || []).forEach((g) => map.set(g.id, g));
        return map;
    }, [bundle]);

    const parasById = useMemo(() => {
        const map = new Map<number, Paragraph>();
        (bundle?.paragraphs || []).forEach((p) => map.set(p.id, p));
        return map;
    }, [bundle]);

    // --------------------------------- UI small utilities ---------------------------------
    const pill = (text: string) => (
        <Badge variant="secondary" className="rounded-full">{text}</Badge>
    );

    const emptyMsg = (label: string) => (
        <div className="text-sm text-muted-foreground italic">{label}</div>
    );

    // --------------------------- Image handling (wire later) ---------------------------
    const onAddImages = async () => {
        if (!imageFiles || !targetImageGroup || !productId) return;
        try {
            setLoading(true);
            const fd = new FormData();
            Array.from(imageFiles).forEach((f) => fd.append("images[]", f));
            fd.append("group_id", String(targetImageGroup));
            await client.post(`/api/admin/products/${productId}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Images queued (wire endpoint to actually upload).");
            setShowImageModal(false);
            setImageFiles(null);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Image upload failed");
        } finally {
            setLoading(false);
        }
    };

    const onAddGroup = async () => {
        try {
            setLoading(true);
            await client.post(`/api/admin/products/${productId}/image-groups`, { name: groupName });
        } catch (error: any) {
            console.log(error);
            toast.error(error?.response?.data?.error || "Image group creation failed");
        } finally {
            setLoading(false);
            setCreateGroup(false);
        }
    }

    const onRemoveImage = async (imageId: number) => {
        try {
            setLoading(true);
            await client.delete(`/api/admin/products/${productId}/images/${imageId}`);
            toast.success("Image removed");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Delete failed");
        } finally {
            setLoading(false);
        }
    };

    // --------------------------- Block reorder (client-only for now) ---------------------------
    const setBlocks = (blocks: LayoutBlock[]) => {
        if (!bundle) return;
        const next: AdminBundle = { ...bundle, layout: { ...bundle.layout, blocks } };
        setBundle(next);
        setPendingBlocks(blocks);
    };

    const moveBlock = (blockId: number, dir: "up" | "down") => {
        if (!bundle) return;
        const blocks = [...bundle.layout.blocks].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        const idx = blocks.findIndex((b) => b.id === blockId);
        if (idx < 0) return;
        const swapIdx = dir === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= blocks.length) return;
        [blocks[idx].sort_order, blocks[swapIdx].sort_order] = [blocks[swapIdx].sort_order, blocks[idx].sort_order];
        blocks.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        setBlocks(blocks);
    };

    // --------------------------- Content: load form for edit/add ---------------------------
    const beginAdd = (type: "paragraph" | "list" | "spec_group" | "table") => {
        setAddingType(type);
        setEditing(null);
        // reset forms
        setFormParagraph({ title: "", subtitle: "", full_text: "", sort_order: 0 });
        setFormList({ slug: "", title: "", description: "", items: [""], sort_order: 0 });
        setFormSpec({ slug: "", title: "", description: "", items: [{ key: "", value: "", unit: "" }], sort_order: 0 });
        setFormTable({ title: "", subtitle: "", columns: [""], rows: [[""]], notes: "", sort_order: 0 });
    };

    const beginEdit = (type: "paragraph" | "list" | "spec_group" | "table", id: number) => {
        setAddingType(null);
        setEditing({ type, id });
        // hydrate forms from bundle in current locale (admin: no fallback)
        if (!bundle) return;

        if (type === "paragraph") {
            const p = parasById.get(id);
            const tr = p?.translation;
            setFormParagraph({
                title: tr?.title || "",
                subtitle: tr?.subtitle || "",
                full_text: tr?.full_text || "",
                sort_order: p?.sort_order ?? 0,
            });
        } else if (type === "list") {
            const g = listsById.get(id);
            const tr = g?.translation;
            setFormList({
                slug: g?.slug || "",
                title: tr?.title || "",
                description: tr?.description || "",
                items: tr?.items?.length ? tr.items.slice() : [""],
                sort_order: g?.sort_order ?? 0,
            });
        } else if (type === "spec_group") {
            const g = specsById.get(id);
            const tr = g?.translation;
            setFormSpec({
                slug: g?.slug || "",
                title: tr?.title || "",
                description: tr?.description || "",
                items: tr?.items?.length ? tr.items.slice() : [{ key: "", value: "", unit: "" }],
                sort_order: g?.sort_order ?? 0,
            });
        } else if (type === "table") {
            const t = tablesById.get(id);
            const tr = t?.translation;
            setFormTable({
                title: tr?.title || "",
                subtitle: tr?.subtitle || "",
                columns: tr?.columns?.length ? tr.columns.slice() : [""],
                rows: tr?.rows?.length ? tr.rows.map((r) => r.slice()) : [[""]],
                notes: tr?.notes || "",
                sort_order: t?.sort_order ?? 0,
            });
        }
    };

    // --------------------------- Content: save (create/replace) ---------------------------
    const saveAdd = async () => {
        if (!bundle) return;
        try {
            setLoading(true);
            const pid = bundle.meta.id;

            if (addingType === "paragraph") {
                await client.post(`/api/admin/products/${pid}/contents/paragraphs`, {
                    locale,
                    data: { ...formParagraph },
                });
            } else if (addingType === "list") {
                // backend creates slug if empty; we send if admin typed one
                await client.post(`/api/admin/products/${pid}/contents/lists`, {
                    locale,
                    data: {
                        slug: formList.slug || undefined,
                        title: formList.title,
                        description: formList.description || undefined,
                        items: formList.items.filter((t) => t.trim() !== ""),
                        sort_order: formList.sort_order,
                    },
                });
            } else if (addingType === "spec_group") {
                await client.post(`/api/admin/products/${pid}/contents/spec-groups`, {
                    locale,
                    data: {
                        slug: formSpec.slug || undefined,
                        title: formSpec.title,
                        description: formSpec.description || undefined,
                        items: formSpec.items
                            .filter((it) => (it.key?.trim() || it.value?.trim()))
                            .map((it, i) => ({ key: it.key.trim(), value: it.value.trim(), unit: it.unit?.trim() || undefined, sort_order: i })),
                        sort_order: formSpec.sort_order,
                    },
                });
            } else if (addingType === "table") {
                await client.post(`/api/admin/products/${pid}/contents/tables`, {
                    locale,
                    data: {
                        title: formTable.title,
                        subtitle: formTable.subtitle || undefined,
                        columns: formTable.columns.filter((c) => c.trim() !== ""),
                        rows: formTable.rows.map((r) => r.map((c) => c)),
                        notes: formTable.notes || undefined,
                        sort_order: formTable.sort_order,
                    },
                });
            }

            toast.success("Created");
            setAddingType(null);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Create failed");
        } finally {
            setLoading(false);
        }
    };

    const saveEdit = async () => {
        if (!bundle || !editing) return;
        try {
            setLoading(true);
            const pid = bundle.meta.id;

            if (editing.type === "paragraph" && editing.id) {
                await client.put(`/api/admin/products/${pid}/contents/paragraphs/${editing.id}`, {
                    locale,
                    data: { ...formParagraph },
                });
            } else if (editing.type === "list" && editing.id) {
                await client.put(`/api/admin/products/${pid}/contents/lists/${editing.id}`, {
                    locale,
                    data: {
                        slug: formList.slug || undefined,
                        title: formList.title,
                        description: formList.description || undefined,
                        items: formList.items.filter((t) => t.trim() !== ""),
                        sort_order: formList.sort_order,
                    },
                });
            } else if (editing.type === "spec_group" && editing.id) {
                await client.put(`/api/admin/products/${pid}/contents/spec-groups/${editing.id}`, {
                    locale,
                    data: {
                        slug: formSpec.slug || undefined,
                        title: formSpec.title,
                        description: formSpec.description || undefined,
                        items: formSpec.items
                            .filter((it) => (it.key?.trim() || it.value?.trim()))
                            .map((it, i) => ({ key: it.key.trim(), value: it.value.trim(), unit: it.unit?.trim() || undefined, sort_order: i })),
                        sort_order: formSpec.sort_order,
                    },
                });
            } else if (editing.type === "table" && editing.id) {
                await client.put(`/api/admin/products/${pid}/contents/tables/${editing.id}`, {
                    locale,
                    data: {
                        title: formTable.title,
                        subtitle: formTable.subtitle || undefined,
                        columns: formTable.columns.filter((c) => c.trim() !== ""),
                        rows: formTable.rows.map((r) => r.map((c) => c)),
                        notes: formTable.notes || undefined,
                        sort_order: formTable.sort_order,
                    },
                });
            }

            toast.success("Saved");
            setEditing(null);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    // --------------------------- Delete block ---------------------------
    // Step 1: clicking the trash icon only opens the dialog
    const deleteBlock = async (type: "paragraph" | "list" | "spec_group" | "table", id: number) => {
        if (!bundle) return;
        setDeleteTarget({ type, id });
    };

    // Step 2: actual delete (all or current locale)
    const performDelete = async (mode: "all" | "locale") => {
        if (!bundle || !deleteTarget) return;

        const pid = bundle.meta.id;
        const { type, id } = deleteTarget;

        try {
            setLoading(true);

            if (mode === "all") {
                // existing behaviour: delete block + layout references
                if (type === "paragraph") {
                    await client.delete(`/api/admin/products/${pid}/contents/paragraphs/${id}`);
                } else if (type === "list") {
                    await client.delete(`/api/admin/products/${pid}/contents/lists/${id}`);
                } else if (type === "spec_group") {
                    await client.delete(`/api/admin/products/${pid}/contents/spec-groups/${id}`);
                } else if (type === "table") {
                    await client.delete(`/api/admin/products/${pid}/contents/tables/${id}`);
                }
                toast.success("Content block deleted");
            } else {
                // mode === "locale" → delete only current locale translation
                // backend routes like:
                // products/{pid}/contents/lists/{listId}/{locale}
                // products/{pid}/contents/paragraphs/{id}/{locale}
                // products/{pid}/contents/spec-groups/{id}/{locale}
                // products/{pid}/contents/tables/{id}/{locale}
                const encodedLocale = encodeURIComponent(locale);

                if (type === "paragraph") {
                    await client.delete(`/api/admin/products/${pid}/contents/paragraphs/${id}/${encodedLocale}`);
                } else if (type === "list") {
                    await client.delete(`/api/admin/products/${pid}/contents/lists/${id}/${encodedLocale}`);
                } else if (type === "spec_group") {
                    await client.delete(`/api/admin/products/${pid}/contents/spec-groups/${id}/${encodedLocale}`);
                } else if (type === "table") {
                    await client.delete(`/api/admin/products/${pid}/contents/tables/${id}/${encodedLocale}`);
                }

                toast.success(`Translation (${locale}) deleted`);
            }

            setDeleteTarget(null);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Delete failed");
        } finally {
            setLoading(false);
        }
    };


    // --------------------------- Renderers ---------------------------
    const BlockToolbar: React.FC<{ block: LayoutBlock; onEdit?: () => void; onDelete?: () => void }> = ({ block, onEdit, onDelete }) => (
        <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => moveBlock(block.id, "up")} title="Move up">
                <ChevronUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => moveBlock(block.id, "down")} title="Move down">
                <ChevronDown className="h-4 w-4" />
            </Button>
            {onEdit && (
                <Button size="icon" variant="ghost" onClick={onEdit} title="Edit">
                    <PencilLine className="h-4 w-4" />
                </Button>
            )}
            {onDelete && (
                <Button size="icon" variant="ghost" onClick={onDelete} title="Remove">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
        </div>
    );

    const ParagraphView: React.FC<{ block: LayoutBlock }> = ({ block }) => {
        if (block.block_type !== "content_paragraph" || !block.ref_id) return null;
        const p = parasById.get(block.ref_id);
        const tr = p?.translation;
        const findBlock = bundle?.paragraphs?.map((blk) => blk.id === block.ref_id);
        console.log(findBlock);
        // console.log(p);

        return (
            <Card key={`para-${block.id}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Paragraph</CardTitle>
                    <BlockToolbar
                        block={block}
                        onEdit={() => beginEdit("paragraph", block.ref_id!)}
                        onDelete={() => deleteBlock("paragraph", block.ref_id!)}
                    />
                </CardHeader>
                <CardContent className="space-y-2">
                    {!tr ? (
                        emptyMsg("No translation for current locale. Click edit to add.")
                    ) : (
                        <>
                            {tr.title && <div className="text-lg font-medium">{tr.title}</div>}
                            {tr.subtitle && <div className="text-sm text-muted-foreground">{tr.subtitle}</div>}
                            {tr.full_text && <div className="text-sm whitespace-pre-wrap">{tr.full_text}</div>}
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    const ListView: React.FC<{ block: LayoutBlock }> = ({ block }) => {
        if (block.block_type !== "list" || !block.ref_id) return null;
        const g = listsById.get(block.ref_id);
        const tr = g?.translation;

        return (
            <Card key={`list-${block.id}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>List</CardTitle>
                        {g?.slug && pill(g.slug)}
                    </div>
                    <BlockToolbar
                        block={block}
                        onEdit={() => beginEdit("list", block.ref_id!)}
                        onDelete={() => deleteBlock("list", block.ref_id!)}
                    />
                </CardHeader>
                <CardContent className="space-y-2">
                    {!tr ? (
                        emptyMsg("No translation for current locale. Click edit to add.")
                    ) : (
                        <>
                            {tr.title && <div className="text-lg font-medium">{tr.title}</div>}
                            {tr.description && <div className="text-sm text-muted-foreground">{tr.description}</div>}
                            <ul className="list-disc pl-5 text-sm">
                                {tr.items.map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    const SpecView: React.FC<{ block: LayoutBlock }> = ({ block }) => {
        if (block.block_type !== "spec_group" || !block.ref_id) return null;
        const g = specsById.get(block.ref_id);
        const tr = g?.translation;
        return (
            <Card key={`spec-${block.id}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>Specs</CardTitle>
                        {g?.slug && pill(g.slug)}
                    </div>
                    <BlockToolbar
                        block={block}
                        onEdit={() => beginEdit("spec_group", block.ref_id!)}
                        onDelete={() => deleteBlock("spec_group", block.ref_id!)}
                    />
                </CardHeader>
                <CardContent className="space-y-2">
                    {!tr ? (
                        emptyMsg("No translation for current locale. Click edit to add.")
                    ) : (
                        <>
                            {tr.title && <div className="text-lg font-medium">{tr.title}</div>}
                            {tr.description && <div className="text-sm text-muted-foreground">{tr.description}</div>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {tr.items.map((it, i) => (
                                    <div key={i} className="flex items-center justify-between rounded border p-2">
                                        <div className="font-medium">{it.key}</div>
                                        <div className="text-right">
                                            {it.value}
                                            {it.unit ? ` ${it.unit}` : ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    const TableView: React.FC<{ block: LayoutBlock }> = ({ block }) => {
        if (block.block_type !== "table" || !block.ref_id) return null;
        const g = tablesById.get(block.ref_id);
        const tr = g?.translation;
        return (
            <Card key={`table-${block.id}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Table</CardTitle>
                    <BlockToolbar
                        block={block}
                        onEdit={() => beginEdit("table", block.ref_id!)}
                        onDelete={() => deleteBlock("table", block.ref_id!)}
                    />
                </CardHeader>
                <CardContent className="space-y-2">
                    {!tr ? (
                        emptyMsg("No translation for current locale. Click edit to add.")
                    ) : (
                        <>
                            <div className="space-y-1">
                                {tr.title && <div className="text-lg font-medium">{tr.title}</div>}
                                {tr.subtitle && <div className="text-sm text-muted-foreground">{tr.subtitle}</div>}
                            </div>
                            <div className="overflow-auto border rounded">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            {tr.columns.map((c, i) => (
                                                <th key={i} className="text-left font-medium p-2 border-b">{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tr.rows.map((row, r) => (
                                            <tr key={r}>
                                                {row.map((cell, c) => (
                                                    <td key={c} className="p-2 border-b">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {tr.notes && <div className="text-xs text-muted-foreground">{tr.notes}</div>}
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (!bundle) {
        return (
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="text-sm text-muted-foreground">Loading…</div>
            </div>
        );
    }

    const blocksSorted = [...bundle.layout.blocks].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id
    );

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="text-xl font-semibold">{bundle.base.name || "(no title in this language)"}</div>
                    <Badge variant="outline" className="capitalize">{bundle.base.status}</Badge>
                    <Badge variant="secondary">{bundle.base.type}</Badge>
                    <Badge variant="secondary">locale: {locale}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    {/* Reorder save (wire when endpoint exists) */}
                    <Button
                        variant={pendingBlocks ? "default" : "outline"}
                        disabled={!pendingBlocks}
                        onClick={() => {
                            // TODO: POST /api/admin/products/:id/layout/blocks/reorder
                            toast("Block reorder ready to send (wire endpoint).");
                        }}
                    >
                        Save Block Order
                    </Button>
                    {/* Product delete (optional; add route if needed) */}
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            if (!confirm("Delete this product? This cannot be undone.")) return;
                            try {
                                setLoading(true);
                                await client.delete(`/api/admin/products/${bundle.base.id}`);
                                navigate('/products');
                                setLoading(false);
                            } catch (err: any) {
                                setLoading(false);
                                toast.error(err?.response?.data?.error || "Delete failed");
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Product
                    </Button>
                </div>
            </div>

            {/* Images */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Images</CardTitle>
                    <div className="flex items-center gap-2">
                        <Select
                            value={targetImageGroup ? String(targetImageGroup) : ""}
                            onValueChange={(v) => {
                                if (v === 'add') return setCreateGroup(true)
                                setTargetImageGroup(Number(v))
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Choose group" />
                            </SelectTrigger>
                            <SelectContent>
                                {(bundle.images || []).map((g) => (
                                    <SelectItem key={g.group_id} value={String(g.group_id)}>
                                        {g.name} (#{g.group_id})
                                    </SelectItem>
                                ))}
                                <SelectItem value={'add'} onSelect={() => setCreateGroup(true)}>+ Create Group </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setShowImageModal(true)}>
                            <ImagePlus className="h-4 w-4 mr-2" /> Add images
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {(bundle.images || []).length === 0 ? (
                        emptyMsg("No image groups")
                    ) : (
                        <div className="space-y-4">
                            {bundle.images.map((group) => (
                                <div key={group.group_id}>
                                    <div className="text-sm font-medium mb-2">
                                        {group.name} {pill(`#${group.group_id}`)}
                                    </div>
                                    {group.items?.length === 0 ? (
                                        emptyMsg("No images in this group.")
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {group.items?.slice().sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map((img) => (
                                                <div key={img.id} className="relative group rounded overflow-hidden border bg-muted">
                                                    <img
                                                        src={`${API_BASE}${img.url}`}
                                                        alt={img.alt || ""}
                                                        className="w-full h-40 object-cover"
                                                    />
                                                    <button
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white/90 hover:bg-white rounded-full p-1 shadow"
                                                        onClick={() => onRemoveImage(img.id)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Base Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Name</Label>
                        <div className="text-sm">{bundle.base.name || emptyMsg("No translation for current locale")}</div>
                    </div>
                    <div className="space-y-1">
                        <Label>Slug</Label>
                        <div className="text-sm">{bundle.base.slug}</div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <Label>Description</Label>
                        <div className="text-sm whitespace-pre-wrap">
                            {bundle.base.desc || emptyMsg("No translation for current locale")}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Blocks by layout */}
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Content Blocks</div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(v: any) => beginAdd(v)}>
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="Add content…" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paragraph">Paragraph</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                            <SelectItem value="spec_group">Spec Group</SelectItem>
                            <SelectItem value="table">Table</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Inline editors (top or bottom) */}
            {addingType === "paragraph" && <ParagraphEditor
                editing={editing}
                saveAdd={saveAdd}
                saveEdit={saveEdit}
                setAddingType={setAddingType}
                setEditing={setEditing}
                formParagraph={formParagraph}
                setFormParagraph={setFormParagraph}
            />}
            {addingType === "list" && <ListEditor
                formList={formList}
                setFormList={setFormList}
                editing={editing}
                saveAdd={saveAdd}
                saveEdit={saveEdit}
                setAddingType={setAddingType}
                setEditing={setEditing}
            />}
            {addingType === "spec_group" && <SpecEditor
                formSpec={formSpec}
                setFormSpec={setFormSpec}
                editing={editing}
                saveAdd={saveAdd}
                saveEdit={saveEdit}
                setAddingType={setAddingType}
                setEditing={setEditing}
            />}
            {addingType === "table" && <TableEditor
                formTable={formTable}
                setFormTable={setFormTable}
                editing={editing}
                saveAdd={saveAdd}
                saveEdit={saveEdit}
                setAddingType={setAddingType}
                setEditing={setEditing}
            />}

            {editing && (
                <div className="space-y-2">
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                        Editing <span className="font-medium">{editing.type}</span> (ID {editing.id})
                    </div>
                    {editing.type === "paragraph" && <ParagraphEditor
                        editing={editing}
                        saveAdd={saveAdd}
                        saveEdit={saveEdit}
                        setAddingType={setAddingType}
                        setEditing={setEditing}
                        formParagraph={formParagraph}
                        setFormParagraph={setFormParagraph}
                    />}
                    {editing.type === "list" && <ListEditor
                        formList={formList}
                        setFormList={setFormList}
                        editing={editing}
                        saveAdd={saveAdd}
                        saveEdit={saveEdit}
                        setAddingType={setAddingType}
                        setEditing={setEditing}
                    />}
                    {editing.type === "spec_group" && <SpecEditor
                        formSpec={formSpec}
                        setFormSpec={setFormSpec}
                        editing={editing}
                        saveAdd={saveAdd}
                        saveEdit={saveEdit}
                        setAddingType={setAddingType}
                        setEditing={setEditing}
                    />}
                    {editing.type === "table" && <TableEditor
                        formTable={formTable}
                        setFormTable={setFormTable}
                        editing={editing}
                        saveAdd={saveAdd}
                        saveEdit={saveEdit}
                        setAddingType={setAddingType}
                        setEditing={setEditing}
                    />}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {blocksSorted.map((block) => {
                    if (block.block_type === "images" || block.block_type === "image_set" || block.block_type === "basic" || block.block_type === "custom_html" || block.block_type === "table_group" || block.block_type === "specs_all") {
                        // Render minimal stubs for non-editable/system blocks
                        return (
                            <Card key={`blk-${block.id}`}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="capitalize">{block.block_type.replace("_", " ")}</CardTitle>
                                    <BlockToolbar block={block} />
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    This block is managed automatically or by other editors.
                                </CardContent>
                            </Card>
                        );
                    }
                    if (block.block_type === "content_paragraph") return <ParagraphView key={block.id} block={block} />;
                    if (block.block_type === "list") return <ListView key={block.id} block={block} />;
                    if (block.block_type === "spec_group") return <SpecView key={block.id} block={block} />;
                    if (block.block_type === "table") return <TableView key={block.id} block={block} />;
                    return null;
                })}
            </div>

            {/* Add Images Modal */}
            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Images</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Target Group</Label>
                            <Select
                                value={targetImageGroup ? String(targetImageGroup) : ""}
                                onValueChange={(v) => setTargetImageGroup(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(bundle.images || []).map((g) => (
                                        <SelectItem key={g.group_id} value={String(g.group_id)}>
                                            {g.name} (#{g.group_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Files</Label>
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setImageFiles(e.target.files)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImageModal(false)}>Cancel</Button>
                        <Button onClick={onAddImages} disabled={!imageFiles || !targetImageGroup}>
                            <Upload className="h-4 w-4 mr-2" /> Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Add group modal  */}
            <Dialog open={createGroup} onOpenChange={setCreateGroup}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Image Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Group Name</Label>
                            <Input
                                type="text"
                                name="groupName"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateGroup(false)}>Cancel</Button>
                        <Button onClick={onAddGroup} disabled={!groupName}>
                            Create Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete content dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete content</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 text-sm">
                        <p>What do you want to delete for this block?</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                            <li>
                                <span className="font-medium">Only current language</span>{" "}
                                <span className="text-xs">(locale: {locale})</span> – keep the block and other languages.
                            </li>
                            <li>
                                <span className="font-medium">Entire block</span> – remove this block from all languages and the layout.
                            </li>
                        </ul>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => performDelete("locale")}
                            >
                                Delete current language
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => performDelete("all")}
                            >
                                Delete entire block
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ProductDetails;


// --------------------------- Editors ---------------------------

const ParagraphEditor = ({
    formParagraph, setFormParagraph, setAddingType, setEditing, editing, saveAdd, saveEdit
}: {
    formParagraph: { title: string, subtitle: string, full_text: string, sort_order: number },
    setFormParagraph: React.Dispatch<SetStateAction<{ title: string; subtitle: string; full_text: string; sort_order: number; }>>,
    setAddingType: React.Dispatch<SetStateAction<"list" | "spec_group" | "table" | "paragraph" | null>>,
    setEditing: React.Dispatch<React.SetStateAction<{
        type: string;
        id?: number | null;
    } | null>>,
    editing: {
        type: string;
        id?: number | null | undefined;
    } | null,
    saveAdd: () => void,
    saveEdit: () => void
}) => {

    return (
        <div className="space-y-3 border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={formParagraph.title} onChange={(e) => setFormParagraph((s) => ({ ...s, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                    <Label>Subtitle</Label>
                    <Input value={formParagraph.subtitle} onChange={(e) => setFormParagraph((s) => ({ ...s, subtitle: e.target.value }))} />
                </div>
            </div>
            <div className="space-y-1">
                <Label>Full Text</Label>
                <Textarea rows={5} value={formParagraph.full_text} onChange={(e) => setFormParagraph((s) => ({ ...s, full_text: e.target.value }))} />
            </div>
            <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input
                    type="number"
                    value={formParagraph.sort_order}
                    onChange={(e) => setFormParagraph((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                />
            </div>
            <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" onClick={() => { setAddingType(null); setEditing(null); }}>Cancel</Button>
                {editing ? (
                    <Button onClick={saveEdit}>Save</Button>
                ) : (
                    <Button onClick={saveAdd}>Create</Button>
                )}
            </div>
        </div>
    )
}


const ListEditor = ({
    formList, setFormList, setAddingType, setEditing, saveAdd, saveEdit, editing
}: {
    formList: {
        slug: string;
        title: string;
        description: string;
        items: string[];
        sort_order: number;
    }
    setFormList: React.Dispatch<React.SetStateAction<{
        slug: string;
        title: string;
        description: string;
        items: string[];
        sort_order: number;
    }>>
    setAddingType: React.Dispatch<SetStateAction<"list" | "spec_group" | "table" | "paragraph" | null>>,
    setEditing: React.Dispatch<React.SetStateAction<{
        type: string;
        id?: number | null;
    } | null>>,
    editing: {
        type: string;
        id?: number | null | undefined;
    } | null,
    saveAdd: () => void,
    saveEdit: () => void
}) => (
    <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label>Slug (optional)</Label>
                <Input value={formList.slug} onChange={(e) => setFormList((s) => ({ ...s, slug: e.target.value }))} />
            </div>
            <div className="space-y-1">
                <Label>Title</Label>
                <Input value={formList.title} onChange={(e) => setFormList((s) => ({ ...s, title: e.target.value }))} />
            </div>
        </div>
        <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={formList.description} onChange={(e) => setFormList((s) => ({ ...s, description: e.target.value }))} />
        </div>
        <div className="space-y-2">
            <Label>Items</Label>
            {formList.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={it}
                        onChange={(e) =>
                            setFormList((s) => {
                                const copy = s.items.slice();
                                copy[i] = e.target.value;
                                return { ...s, items: copy };
                            })
                        }
                        placeholder={`Item ${i + 1}`}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                            setFormList((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }))
                        }
                        disabled={formList.items.length <= 1}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => setFormList((s) => ({ ...s, items: [...s.items, ""] }))}
            >
                <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
        </div>
        <div className="space-y-1">
            <Label>Sort Order</Label>
            <Input
                type="number"
                value={formList.sort_order}
                onChange={(e) => setFormList((s) => ({ ...s, sort_order: Number(e.target.value) }))}
            />
        </div>
        <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => { setAddingType(null); setEditing(null); }}>Cancel</Button>
            {editing ? <Button onClick={saveEdit}>Save</Button> : <Button onClick={saveAdd}>Create</Button>}
        </div>
    </div>
);

const SpecEditor = ({
    formSpec, setFormSpec, setAddingType, setEditing, saveAdd, saveEdit, editing
}: {
    formSpec: {
        slug: string;
        title: string;
        description: string;
        items: {
            key: string;
            value: string;
            unit: string;
        }[];
        sort_order: number;
    }
    setFormSpec: React.Dispatch<React.SetStateAction<{
        slug: string;
        title: string;
        description: string;
        items: {
            key: string;
            value: string;
            unit: string;
        }[];
        sort_order: number;
    }>>
    setAddingType: React.Dispatch<SetStateAction<"list" | "spec_group" | "table" | "paragraph" | null>>,
    setEditing: React.Dispatch<React.SetStateAction<{
        type: string;
        id?: number | null;
    } | null>>,
    editing: {
        type: string;
        id?: number | null | undefined;
    } | null,
    saveAdd: () => void,
    saveEdit: () => void
}) => (
    <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label>Slug (optional)</Label>
                <Input value={formSpec.slug} onChange={(e) => setFormSpec((s) => ({ ...s, slug: e.target.value }))} />
            </div>
            <div className="space-y-1">
                <Label>Title</Label>
                <Input value={formSpec.title} onChange={(e) => setFormSpec((s) => ({ ...s, title: e.target.value }))} />
            </div>
        </div>
        <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={formSpec.description} onChange={(e) => setFormSpec((s) => ({ ...s, description: e.target.value }))} />
        </div>
        <div className="space-y-2">
            <Label>Items</Label>
            {formSpec.items.map((it, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                        value={it.key}
                        onChange={(e) =>
                            setFormSpec((s) => {
                                const copy = s.items.slice();
                                copy[i] = { ...copy[i], key: e.target.value };
                                return { ...s, items: copy };
                            })
                        }
                        placeholder="Key"
                    />
                    <Input
                        value={it.value}
                        onChange={(e) =>
                            setFormSpec((s) => {
                                const copy = s.items.slice();
                                copy[i] = { ...copy[i], value: e.target.value };
                                return { ...s, items: copy };
                            })
                        }
                        placeholder="Value"
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            value={it.unit || ""}
                            onChange={(e) =>
                                setFormSpec((s) => {
                                    const copy = s.items.slice();
                                    copy[i] = { ...copy[i], unit: e.target.value };
                                    return { ...s, items: copy };
                                })
                            }
                            placeholder="Unit (optional)"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setFormSpec((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }))
                            }
                            disabled={formSpec.items.length <= 1}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => setFormSpec((s) => ({ ...s, items: [...s.items, { key: "", value: "", unit: "" }] }))}
            >
                <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
        </div>
        <div className="space-y-1">
            <Label>Sort Order</Label>
            <Input
                type="number"
                value={formSpec.sort_order}
                onChange={(e) => setFormSpec((s) => ({ ...s, sort_order: Number(e.target.value) }))}
            />
        </div>
        <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => { setAddingType(null); setEditing(null); }}>Cancel</Button>
            {editing ? <Button onClick={saveEdit}>Save</Button> : <Button onClick={saveAdd}>Create</Button>}
        </div>
    </div>
);