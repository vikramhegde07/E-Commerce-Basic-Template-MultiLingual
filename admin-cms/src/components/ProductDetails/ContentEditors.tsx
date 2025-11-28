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
type TableForm = {
    title: string;
    subtitle: string;
    columns: string[];
    rows: string[][];
    notes: string;
    sort_order: number;
};
type TableEditorProps = FormProps & {
    formTable: TableForm;
    setFormTable: React.Dispatch<React.SetStateAction<TableForm>>;
};

export const TableEditor: React.FC<TableEditorProps> = ({
    formTable,
    setFormTable,
    editing,
    saveEdit,
    saveAdd,
    setAddingType,
    setEditing,
}) => {
    const columnsValue = formTable.columns.join(", ");

    const rowsValue =
        formTable.rows && formTable.rows.length
            ? formTable.rows.map((row) => row.join(", ")).join("\n")
            : "";

    const handleColumnsChange = (value: string) => {
        const cols = value
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c.length > 0);

        setFormTable((s) => ({
            ...s,
            columns: cols.length ? cols : [""],
        }));
    };

    const handleRowsChange = (value: string) => {
        const lines = value.split(/\r?\n/);

        const rows = lines
            .map((line) =>
                line
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0)
            )
            .filter((row) => row.length > 0);

        setFormTable((s) => ({
            ...s,
            rows: rows.length ? rows : [[""]],
        }));
    };

    return (
        <div className="space-y-3 border rounded-lg p-4">
            {/* Title / Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Title</Label>
                    <Input
                        value={formTable.title}
                        onChange={(e) =>
                            setFormTable((s) => ({ ...s, title: e.target.value }))
                        }
                    />
                </div>
                <div className="space-y-1">
                    <Label>Subtitle (optional)</Label>
                    <Input
                        value={formTable.subtitle}
                        onChange={(e) =>
                            setFormTable((s) => ({ ...s, subtitle: e.target.value }))
                        }
                    />
                </div>
            </div>

            {/* Columns as CSV */}
            <div className="space-y-1">
                <Label>Columns (comma separated)</Label>
                <Input
                    value={columnsValue}
                    onChange={(e) => handleColumnsChange(e.target.value)}
                    placeholder="e.g. Size, Weight, Color"
                />
                <p className="text-xs text-muted-foreground">
                    Type column headers separated by commas.
                </p>
            </div>

            {/* Rows as CSV per line */}
            <div className="space-y-1">
                <Label>Rows (one row per line, comma separated)</Label>
                <Textarea
                    rows={5}
                    value={rowsValue}
                    onChange={(e) => handleRowsChange(e.target.value)}
                    placeholder={"Size S, 10kg, Red\nSize M, 12kg, Blue"}
                />
                <p className="text-xs text-muted-foreground">
                    Each line is a row. Within a line, separate cells with commas.
                </p>
            </div>

            {/* Notes */}
            <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea
                    rows={3}
                    value={formTable.notes}
                    onChange={(e) =>
                        setFormTable((s) => ({ ...s, notes: e.target.value }))
                    }
                />
            </div>

            {/* Sort order */}
            <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input
                    type="number"
                    value={formTable.sort_order}
                    onChange={(e) =>
                        setFormTable((s) => ({
                            ...s,
                            sort_order: Number(e.target.value) || 0,
                        }))
                    }
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
                <Button
                    variant="outline"
                    onClick={() => {
                        setAddingType(null);
                        setEditing(null);
                    }}
                >
                    Cancel
                </Button>
                {editing ? (
                    <Button onClick={saveEdit}>Save</Button>
                ) : (
                    <Button onClick={saveAdd}>Create</Button>
                )}
            </div>
        </div>
    );
};
