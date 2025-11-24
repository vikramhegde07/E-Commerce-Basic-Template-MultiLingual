import * as React from "react";
import Image from "next/image";
import Link from "next/link";

export type ProductLite = {
    id: number | string;
    name: string;
    slug: string;
    desc?: string | null;     // from API
    imgurl?: string | null;   // from API
    category?: string | null; // optional
};

const apiBaseNoApi = (process.env.NEXT_PUBLIC_API_BASE_URL || "");

export default function ProductCard({ product }: { product: ProductLite }) {
    const raw = product.imgurl || null;
    const imgSrc = raw ? (raw.startsWith("http") ? raw : apiBaseNoApi + raw) : null;

    return (
        <Link
            href={`/products/${encodeURIComponent(product.slug)}`}
            className="group block rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden hover:shadow-md transition-shadow"
        >
            <div className="relative aspect-[4/3] bg-slate-50">
                {imgSrc ? (
                    <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        No Image
                    </div>
                )}
            </div>

            <div className="p-3 space-y-1">
                <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                </div>
                {product.desc && (
                    <p className="text-xs text-slate-600 line-clamp-2">{product.desc}</p>
                )}
                {product.category && (
                    <div className="pt-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {product.category}
                    </div>
                )}
            </div>
        </Link>
    );
}
