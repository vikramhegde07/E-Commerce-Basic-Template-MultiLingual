// components/Categories/CategoriesGrid.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Category = {
    id: string | number;
    name: string;
    slug: string;
    image_url?: string | null;
    parent_id?: string | number | null;
};

type ApiResponse =
    | { data: Category[]; meta?: unknown }
    | { items: Category[]; meta?: unknown }; // supports either shape

// Base URL helper (same pattern as your example)
const API_BASE =
    (typeof window !== "undefined" && (window as unknown as { __API_BASE__?: string }).__API_BASE__) ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

const absUrl = (p?: string | null) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return `${API_BASE}${p}`;
};

type Props = {
    title?: string;
    limit?: number; // max items to render (desktop grid handles responsiveness)
};

export default function CategoriesGrid({ title = "Browse by Category", limit = 24 }: Props) {
    const [cats, setCats] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const r = await api.get<ApiResponse>("/api/public/categories", {
                    params: { flat: 1, limit: 200, sortBy: "sort_order", order: "ASC" },
                });
                if (!mounted) return;
                const list = ("data" in r.data ? r.data.data : r.data.items) ?? [];
                // top-level only
                const topLevel = list.filter((c) => !c.parent_id);
                setCats(limit ? topLevel.slice(0, limit) : topLevel);
            } catch (e) {
                if (!mounted) return;
                setErr("Failed to load categories");
                setCats([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [limit]);

    return (
        <section className="container max-w-6xl mx-auto px-6 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
                    <p className="text-slate-600 mt-1">Jump into any category to see matching products.</p>
                </div>
                <div className="text-sm text-slate-500">
                    {loading ? "Loading…" : `Showing ${cats.length} categor${cats.length === 1 ? "y" : "ies"}`}
                </div>
            </div>

            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-4">
                            <div className="w-full aspect-[4/3] bg-slate-100 animate-pulse rounded-md" />
                            <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded mt-3" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && err && <div className="text-center text-red-600 py-8">{err}</div>}

            {!loading && !err && cats.length === 0 && (
                <div className="text-center text-slate-600 py-8">No categories available right now.</div>
            )}

            {!loading && !err && cats.length > 0 && (
                <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.35 }}
                >
                    {cats.map((c) => (
                        <Link key={c.slug} href={`/products?category_slug=${encodeURIComponent(c.slug)}&brand_slug=&search=`} className="group">
                            <Card className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                                <div className="relative aspect-[4/3] bg-white">
                                    {c.image_url ? (
                                        <Image
                                            src={absUrl(c.image_url)}
                                            alt={c.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-slate-100" />
                                    )}
                                </div>
                                <div className="px-3 py-2 font-medium text-center">{c.name}</div>
                            </Card>
                        </Link>
                    ))}
                </motion.div>
            )}

            <div className="flex justify-center mt-8">
                <Link href="/products">
                    <Button variant="outline">View all products</Button>
                </Link>
            </div>
        </section>
    );
}
