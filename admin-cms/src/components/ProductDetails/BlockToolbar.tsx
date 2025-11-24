import React from 'react';
import { ChevronUp, ChevronDown, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BlockToolbarProps = {
    block: any; // LayoutBlock
    moveBlock: (id: number, dir: "up" | "down") => void;
    onEdit?: () => void;
    onDelete?: () => void;
};

export const BlockToolbar: React.FC<BlockToolbarProps> = ({ block, moveBlock, onEdit, onDelete }) => (
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