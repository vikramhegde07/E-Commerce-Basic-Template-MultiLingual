import React from 'react';
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type AddImagesModalProps = {
    showImageModal: boolean;
    setShowImageModal: (show: boolean) => void;
    bundle: any; // AdminBundle
    targetImageGroup: number | null;
    setTargetImageGroup: (id: number | null) => void;
    setImageFiles: (files: FileList | null) => void;
    imageFiles: FileList | null;
    onAddImages: () => Promise<void>;
};

export const AddImagesModal: React.FC<AddImagesModalProps> = ({
    showImageModal, setShowImageModal, bundle, targetImageGroup, setTargetImageGroup, setImageFiles, imageFiles, onAddImages
}) => {
    return (
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
                                {(bundle?.images || []).map((g: any) => (
                                    <SelectItem key={g.id} value={String(g.id)}>
                                        {g.name} (#{g.id})
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
    );
};