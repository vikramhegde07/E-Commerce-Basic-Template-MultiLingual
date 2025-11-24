import React from 'react';
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FormProps = {
    editing: any; // { type: string; id?: number | null } | null
    saveEdit: () => Promise<void>;
    saveAdd: () => Promise<void>;
    setAddingType: (type: any) => void;
    setEditing: (edit: any) => void;
}

// --------------------------- Paragraph Editor ---------------------------
type ParagraphForm = { title: string, subtitle: string, full_text: string, sort_order: number };
type ParagraphEditorProps = FormProps & {
    formParagraph: ParagraphForm;
    setFormParagraph: React.Dispatch<React.SetStateAction<ParagraphForm>>;
};

export const ParagraphEditor: React.FC<ParagraphEditorProps> = ({
    formParagraph, setFormParagraph, editing, saveEdit, saveAdd, setAddingType, setEditing
}) => (
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
);

// --------------------------- List Editor ---------------------------
type ListForm = { slug: string, title: string, description: string, items: string[], sort_order: number };
type ListEditorProps = FormProps & {
    formList: ListForm;
    setFormList: React.Dispatch<React.SetStateAction<ListForm>>;
};

export const ListEditor: React.FC<ListEditorProps> = ({
    formList, setFormList, editing, saveEdit, saveAdd, setAddingType, setEditing
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

// --------------------------- Spec Editor ---------------------------
type SpecItem = { key: string; value: string; unit: string };
type SpecForm = { slug: string, title: string, description: string, items: SpecItem[], sort_order: number };
type SpecEditorProps = FormProps & {
    formSpec: SpecForm;
    setFormSpec: React.Dispatch<React.SetStateAction<SpecForm>>;
};

export const SpecEditor: React.FC<SpecEditorProps> = ({
    formSpec, setFormSpec, editing, saveEdit, saveAdd, setAddingType, setEditing
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

// --------------------------- Table Editor ---------------------------
type TableForm = { title: string, subtitle: string, columns: string[], rows: string[][], notes: string, sort_order: number };
type TableEditorProps = FormProps & {
    formTable: TableForm;
    setFormTable: React.Dispatch<React.SetStateAction<TableForm>>;
};

export const TableEditor: React.FC<TableEditorProps> = ({
    formTable, setFormTable, editing, saveEdit, saveAdd, setAddingType, setEditing
}) => (
    <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label>Title</Label>
                <Input value={formTable.title} onChange={(e) => setFormTable((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
                <Label>Subtitle (optional)</Label>
                <Input value={formTable.subtitle} onChange={(e) => setFormTable((s) => ({ ...s, subtitle: e.target.value }))} />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Columns</Label>
            {formTable.columns.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={c}
                        onChange={(e) =>
                            setFormTable((s) => {
                                const cols = s.columns.slice();
                                cols[i] = e.target.value;
                                return { ...s, columns: cols };
                            })
                        }
                        placeholder={`Column ${i + 1}`}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                            setFormTable((s) => ({ ...s, columns: s.columns.filter((_, idx) => idx !== i) }))
                        }
                        disabled={formTable.columns.length <= 1}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => setFormTable((s) => ({ ...s, columns: [...s.columns, ""] }))}
            >
                <Plus className="h-4 w-4 mr-1" /> Add Column
            </Button>
        </div>

        <div className="space-y-2">
            <Label>Rows</Label>
            {formTable.rows.map((row, ri) => (
                <div key={ri} className="flex flex-col gap-2 p-2 border rounded">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Row {ri + 1}</div>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setFormTable((s) => ({ ...s, rows: s.rows.filter((_, idx) => idx !== ri) }))
                            }
                            disabled={formTable.rows.length <= 1}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {row.map((cell, ci) => (
                            <Input
                                key={ci}
                                value={cell}
                                onChange={(e) =>
                                    setFormTable((s) => {
                                        const rows = s.rows.map((r) => r.slice());
                                        rows[ri][ci] = e.target.value;
                                        return { ...s, rows };
                                    })
                                }
                                placeholder={`Cell ${ci + 1}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setFormTable((s) => {
                                    const rows = s.rows.map((r) => r.slice());
                                    rows[ri] = [...rows[ri], ""];
                                    return { ...s, rows };
                                })
                            }
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Cell
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => setFormTable((s) => ({ ...s, rows: [...s.rows, [""]] }))}
            >
                <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
        </div>

        <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} value={formTable.notes} onChange={(e) => setFormTable((s) => ({ ...s, notes: e.target.value }))} />
        </div>

        <div className="space-y-1">
            <Label>Sort Order</Label>
            <Input
                type="number"
                value={formTable.sort_order}
                onChange={(e) => setFormTable((s) => ({ ...s, sort_order: Number(e.target.value) }))}
            />
        </div>

        <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => { setAddingType(null); setEditing(null); }}>Cancel</Button>
            {editing ? <Button onClick={saveEdit}>Save</Button> : <Button onClick={saveAdd}>Create</Button>}
        </div>
    </div>
);