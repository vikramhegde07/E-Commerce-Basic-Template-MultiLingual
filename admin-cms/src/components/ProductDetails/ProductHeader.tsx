import React from 'react';
import { ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AdminBundle = any; // Use the actual type if you put types in a shared file
type ProductHeaderProps = {
    bundle: AdminBundle;
    navigate: (delta: number) => void;
    setLoading: (isLoading: boolean) => void;
    pendingBlocks: any[] | null;
};

export const ProductHeader: React.FC<ProductHeaderProps> = ({ bundle, navigate, setLoading, pendingBlocks }) => {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="text-xl font-semibold">{bundle.base.name || "(no title in this language)"}</div>
                <Badge variant="outline" className="capitalize">{bundle.base.status}</Badge>
                <Badge variant="secondary">{bundle.base.type}</Badge>
                <Badge variant="secondary">locale: {bundle.meta.locale}</Badge>
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
                            // TODO: await client.delete(`/api/admin/products/${bundle.base.id}`);
                            toast("Delete endpoint not wired yet.");
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
    );
};