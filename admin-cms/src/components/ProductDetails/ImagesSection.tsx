import React from 'react';
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from '../ui/badge';

const pill = (text: string) => (
    <Badge variant="secondary" className="rounded-full">{text}</Badge>
);

const emptyMsg = (label: string) => (
    <div className="text-sm text-muted-foreground italic">{label}</div>
);

type ImageSectionProps = {
    bundle: any; // AdminBundle
    API_BASE: string;
    onRemoveImage: (id: number) => Promise<void>;
    setShowImageModal: (show: boolean) => void;
    setTargetImageGroup: (id: number | null) => void;
    targetImageGroup: number | null;
};

export const ImagesSection: React.FC<ImageSectionProps> = ({
    bundle, API_BASE, onRemoveImage, setShowImageModal, setTargetImageGroup, targetImageGroup
}) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Images</CardTitle>
                <div className="flex items-center gap-2">
                    <Select
                        value={targetImageGroup ? String(targetImageGroup) : ""}
                        onValueChange={(v) => setTargetImageGroup(Number(v))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Choose group" />
                        </SelectTrigger>
                        <SelectContent>
                            {(bundle.images || []).map((g: any) => (
                                <SelectItem key={g.id} value={String(g.id)}>
                                    {g.name} (#{g.id})
                                </SelectItem>
                            ))}
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
                        {bundle.images.map((group: any) => (
                            <div key={group.id}>
                                <div className="text-sm font-medium mb-2">
                                    {group.name} {pill(`#${group.id}`)}
                                </div>
                                {group.images.length === 0 ? (
                                    emptyMsg("No images in this group.")
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {group.images
                                            .slice()
                                            .sort((a: any, b: any) => a.sort_order - b.sort_order || a.id - b.id)
                                            .map((img: any) => (
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
    );
};