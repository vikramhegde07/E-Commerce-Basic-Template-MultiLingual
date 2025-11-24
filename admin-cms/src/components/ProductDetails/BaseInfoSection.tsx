import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const emptyMsg = (label: string) => (
    <div className="text-sm text-muted-foreground italic">{label}</div>
);
type BaseInfo = any; // Use the actual BaseInfo type

export const BaseInfoSection: React.FC<{ base: BaseInfo }> = ({ base }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Name</Label>
                    <div className="text-sm">{base.name || emptyMsg("No translation for current locale")}</div>
                </div>
                <div className="space-y-1">
                    <Label>Slug</Label>
                    <div className="text-sm">{base.slug}</div>
                </div>
                <div className="space-y-1 md:col-span-2">
                    <Label>Description</Label>
                    <div className="text-sm whitespace-pre-wrap">
                        {base.desc || emptyMsg("No translation for current locale")}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};