import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockToolbar } from './BlockToolbar';
import { Badge } from '../ui/badge';

const pill = (text: string) => (
    <Badge variant="secondary" className="rounded-full">{text}</Badge>
);

const emptyMsg = (label: string) => (
    <div className="text-sm text-muted-foreground italic">{label}</div>
);

type ContentBlockProps = {
    block: any; // LayoutBlock
    moveBlock: (id: number, dir: "up" | "down") => void;
    beginEdit: (type: any, id: number) => void;
    deleteBlock: (type: any, id: number) => Promise<void>;
    contentById: any; // Map of content by ID (e.g., parasById)
    type: "paragraph" | "list" | "spec_group" | "table";
    title: string;
};

// --------------------------- Paragraph View ---------------------------
export const ParagraphView: React.FC<ContentBlockProps> = ({ block, moveBlock, beginEdit, deleteBlock, contentById }) => {
    if (block.block_type !== "content_paragraph" || !block.ref_id) return null;
    const p = contentById.get(block.ref_id);
    const tr = p?.translation;

    return (
        <Card key={`para-${block.id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Paragraph</CardTitle>
                <BlockToolbar
                    block={block}
                    moveBlock={moveBlock}
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

// --------------------------- List View ---------------------------
export const ListView: React.FC<ContentBlockProps> = ({ block, moveBlock, beginEdit, deleteBlock, contentById }) => {
    if (block.block_type !== "list" || !block.ref_id) return null;
    const g = contentById.get(block.ref_id);
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
                    moveBlock={moveBlock}
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
                            {tr.items.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ul>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// --------------------------- Spec View ---------------------------
export const SpecView: React.FC<ContentBlockProps> = ({ block, moveBlock, beginEdit, deleteBlock, contentById }) => {
    if (block.block_type !== "spec_group" || !block.ref_id) return null;
    const g = contentById.get(block.ref_id);
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
                    moveBlock={moveBlock}
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
                            {tr.items.map((it: any, i: number) => (
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

// --------------------------- Table View ---------------------------
export const TableView: React.FC<ContentBlockProps> = ({ block, moveBlock, beginEdit, deleteBlock, contentById }) => {
    if (block.block_type !== "table" || !block.ref_id) return null;
    const g = contentById.get(block.ref_id);
    const tr = g?.translation;

    return (
        <Card key={`table-${block.id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Table</CardTitle>
                <BlockToolbar
                    block={block}
                    moveBlock={moveBlock}
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
                                        {tr.columns.map((c: string, i: number) => (
                                            <th key={i} className="text-left font-medium p-2 border-b">{c}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tr.rows.map((row: string[], r: number) => (
                                        <tr key={r}>
                                            {row.map((cell: string, c: number) => (
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