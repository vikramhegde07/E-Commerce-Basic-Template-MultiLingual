import Image from "next/image";
import Link from "next/link";

type ProductLite = {
    id: number | string;
    name: string;
    slug: string;
    desc?: string | null;     // from API
    imgurl?: string | null;   // from API
    category?: string | null; // optional
};

const apiBaseNoApi = (process.env.NEXT_PUBLIC_API_BASE_URL || "");

// --- List row component (1:2 image/info) ---
export default function ProductListRow({ p }: { p: ProductLite }) {
    const raw = p.imgurl || null;
    const imgSrc =
        raw ? (raw.startsWith("http") ? raw : apiBaseNoApi + raw) : null;

    return (
        <Link
            href={`/product/${encodeURIComponent(p.slug)}`}
            className="rounded-2xl border bg-white overflow-hidden hover:shadow-sm transition"
        >
            <div className="grid grid-cols-3 gap-0">
                {/* Image */}
                <div className="col-span-1 relative aspect-[4/3] bg-slate-50">
                    {imgSrc ? (
                        <Image src={imgSrc} alt={p.name} fill className="object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                            No Image
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="col-span-2 p-3 md:p-4">
                    <div className="font-medium">{p.name}</div>
                    {p.desc && (
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">{p.desc}</p>
                    )}
                    {p.category && (
                        <div className="mt-2 text-xs text-slate-500">Category: {p.category}</div>
                    )}
                </div>
            </div>
        </Link>
    );
}
