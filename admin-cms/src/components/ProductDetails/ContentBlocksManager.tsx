import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BlockToolbar } from './BlockToolbar';
import { ParagraphEditor, ListEditor, SpecEditor, TableEditor } from './ContentEditors';
import { ParagraphView, ListView, SpecView, TableView } from './ContentViews';

type ContentBlocksManagerProps = {
    bundle: any; // AdminBundle
    blocksSorted: any[]; // LayoutBlock[]
    addingType: string | null;
    editing: any; // { type: string; id?: number | null } | null
    moveBlock: (id: number, dir: "up" | "down") => void;
    beginAdd: (type: any) => void;
    beginEdit: (type: any, id: number) => void;
    deleteBlock: (type: any, id: number) => Promise<void>;

    // Content Maps
    listsById: Map<number, any>;
    specsById: Map<number, any>;
    tablesById: Map<number, any>;
    parasById: Map<number, any>;

    // Form State (passing all of them down)
    formParagraph: any; setFormParagraph: any;
    formList: any; setFormList: any;
    formSpec: any; setFormSpec: any;
    formTable: any; setFormTable: any;

    // Handlers
    saveAdd: () => Promise<void>;
    saveEdit: () => Promise<void>;
    setAddingType: (type: any) => void;
    setEditing: (edit: any) => void;
};

// Helper to pass form props easily
const editorFormProps = (props: ContentBlocksManagerProps) => ({
    editing: props.editing,
    saveEdit: props.saveEdit,
    saveAdd: props.saveAdd,
    setAddingType: props.setAddingType,
    setEditing: props.setEditing,
});


export const ContentBlocksManager: React.FC<ContentBlocksManagerProps> = (props) => {
    return (
        <>
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Content Blocks</div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(v: any) => props.beginAdd(v)}>
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
            {props.addingType === "paragraph" && <ParagraphEditor formParagraph={props.formParagraph} setFormParagraph={props.setFormParagraph} {...editorFormProps(props)} />}
            {props.addingType === "list" && <ListEditor formList={props.formList} setFormList={props.setFormList} {...editorFormProps(props)} />}
            {props.addingType === "spec_group" && <SpecEditor formSpec={props.formSpec} setFormSpec={props.setFormSpec} {...editorFormProps(props)} />}
            {props.addingType === "table" && <TableEditor formTable={props.formTable} setFormTable={props.setFormTable} {...editorFormProps(props)} />}

            {props.editing && (
                <div className="space-y-2">
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                        Editing <span className="font-medium">{props.editing.type}</span> (ID {props.editing.id})
                    </div>
                    {props.editing.type === "paragraph" && <ParagraphEditor formParagraph={props.formParagraph} setFormParagraph={props.setFormParagraph} {...editorFormProps(props)} />}
                    {props.editing.type === "list" && <ListEditor formList={props.formList} setFormList={props.setFormList} {...editorFormProps(props)} />}
                    {props.editing.type === "spec_group" && <SpecEditor formSpec={props.formSpec} setFormSpec={props.setFormSpec} {...editorFormProps(props)} />}
                    {props.editing.type === "table" && <TableEditor formTable={props.formTable} setFormTable={props.setFormTable} {...editorFormProps(props)} />}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {props.blocksSorted.map((block: any) => {
                    const blockType = block.block_type;

                    if (["images", "image_set", "basic", "custom_html", "table_group", "specs_all"].includes(blockType)) {
                        // Render minimal stubs for non-editable/system blocks
                        return (
                            <Card key={block.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="capitalize">{blockType.replace("_", " ")}</CardTitle>
                                    <BlockToolbar block={block} moveBlock={props.moveBlock} />
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    This block is managed automatically or by other editors.
                                </CardContent>
                            </Card>
                        );
                    }
                    if (blockType === "content_paragraph") return <ParagraphView key={block.id} block={block} moveBlock={props.moveBlock} beginEdit={props.beginEdit} deleteBlock={props.deleteBlock} contentById={props.parasById} type="paragraph" title="Paragraph" />;
                    if (blockType === "list") return <ListView key={block.id} block={block} moveBlock={props.moveBlock} beginEdit={props.beginEdit} deleteBlock={props.deleteBlock} contentById={props.listsById} type="list" title="List" />;
                    if (blockType === "spec_group") return <SpecView key={block.id} block={block} moveBlock={props.moveBlock} beginEdit={props.beginEdit} deleteBlock={props.deleteBlock} contentById={props.specsById} type="spec_group" title="Specs" />;
                    if (blockType === "table") return <TableView key={block.id} block={block} moveBlock={props.moveBlock} beginEdit={props.beginEdit} deleteBlock={props.deleteBlock} contentById={props.tablesById} type="table" title="Table" />;
                    return null;
                })}
            </div>
        </>
    );
};