// pages/products/index.tsx
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "@/lib/axios";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/Common/ProductCard";
import ProductListRow from "@/components/Common/ProductListRow";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Grid3X3, List, Filter, ChevronLeft, ChevronRight } from "lucide-react";

type ProductLite = {
    id: number | string;
    name: string;
    slug: string;
    description?: string | null;
    category?: string | null;
    image?: string | null;
};

type Category = { id: number | string; name: string; slug: string; parent_id?: number | string | null };

function orderByToSort(orderBy: string | undefined) {
    switch (orderBy) {
        case "name-asc":
            return { sortBy: "name", order: "ASC" as const };
        case "name-desc":
            return { sortBy: "name", order: "DESC" as const };
        case "created-desc":
            return { sortBy: "created_at", order: "DESC" as const };
        default:
            return { sortBy: "name", order: "ASC" as const };
    }
}

export default function ProductsPage() {
    const router = useRouter();
    const q = router.query;
    const { locale } = useLanguage();

    // URL-driven state (w/ defaults)
    const [search, setSearch] = React.useState<string>(typeof q.search === "string" ? q.search : "");
    const [category, setCategory] = React.useState<string>(
        typeof q.category === "string" ? (q.category as string) : "doors" // default to doors
    );
    const [orderBy, setOrderBy] = React.useState<string>(typeof q.orderBy === "string" ? (q.orderBy as string) : "name-asc");
    const [page, setPage] = React.useState<number>(q.page ? Number(q.page) || 1 : 1);
    const [perPage, setPerPage] = React.useState<number>(q.perPage ? Number(q.perPage) || 15 : 15);
    const [view, setView] = React.useState<"grid" | "list">(q.view === "list" ? "list" : "grid");

    // filters
    const [categories, setCategories] = React.useState<Category[]>([]);

    // data
    const [items, setItems] = React.useState<ProductLite[]>([]);
    const [total, setTotal] = React.useState<number>(0);
    const [totalPages, setTotalPages] = React.useState<number>(1);
    const [loading, setLoading] = React.useState<boolean>(true);

    // Keep URL in sync with state
    const pushQuery = React.useCallback(
        (overrides: Partial<Record<string, string | number | undefined>> = {}, replace = false) => {
            const query = {
                search: search || undefined,
                category: category || undefined, // send empty to browse all
                orderBy: orderBy || undefined,
                page,
                perPage,
                view: view === "list" ? "list" : undefined,
                locale, // optional but handy for shareable URLs
                ...overrides,
            };
            const url = { pathname: "/products", query };
            replace
                ? router.replace(url, undefined, { shallow: true })
                : router.push(url, undefined, { shallow: true });
        },
        [router, search, category, orderBy, page, perPage, view, locale]
    );

    // Load categories (top-level only)
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const cRes = await api.get("/api/public/categories", {
                    params: { flat: 1, limit: 500, sortBy: "sort_order", order: "ASC", locale },
                });
                if (!mounted) return;
                const cats = (cRes.data?.data ?? cRes.data?.items ?? []).filter((c: Category) => !c.parent_id);
                setCategories(cats);
            } catch {
                if (!mounted) return;
                setCategories([]);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [locale]);

    // React to URL changes (e.g. user navigates via navbar)
    React.useEffect(() => {
        const query = router.query;
        setCategory((query.category as string) ?? "doors"); // respect URL else default to doors
        setSearch((query.search as string) ?? "");
    }, [router.asPath]);

    // Fetch products
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const { sortBy, order } = orderByToSort(orderBy);
                const params: Record<string, any> = {
                    limit: perPage,
                    page,
                    sortBy,
                    order,
                    locale,
                };
                if (search) params.search = search;
                if (category) params.category = category; // your backend will accept category slug (e.g., "doors")

                const r = await api.get("/api/products", { params }); // NOTE: base is /api via axios instance
                if (!mounted) return;
                const data: ProductLite[] = r.data?.data ?? r.data?.items ?? [];
                const meta = r.data?.meta ?? {};
                setItems(data);
                setTotal(Number(meta.total ?? data.length));
                setTotalPages(Number(meta.total_pages ?? Math.max(1, Math.ceil((meta.total ?? data.length) / perPage))));
            } catch {
                if (!mounted) return;
                setItems([]);
                setTotal(0);
                setTotalPages(1);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [search, category, orderBy, page, perPage, locale]);

    // Ensure URL reflects state (including default doors)
    React.useEffect(() => {
        pushQuery({}, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category, orderBy, page, perPage, view, locale]);

    // Handlers
    const handleCategory = (v: string) => {
        const next = v === "all" ? "" : v;
        setCategory(next);
        setPage(1);
    };
    const handleOrderBy = (v: string) => {
        setOrderBy(v);
        setPage(1);
    };
    const handlePerPage = (v: string) => {
        setPerPage(Number(v) || 15);
        setPage(1);
    };

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="container py-8 px-4 md:px-8">
            {/* Heading */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Our Products</h1>
                <p className="text-slate-600">Browse all products</p>
            </div>

            {/* Active meta chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
                <span className="px-2 py-1 rounded-full border bg-white">Page: {page}</span>
                <span className="px-2 py-1 rounded-full border bg-white">Per page: {perPage}</span>
                {search ? <span className="px-2 py-1 rounded-full border bg-white">Search: “{search}”</span> : null}
                {category ? <span className="px-2 py-1 rounded-full border bg-white">Category: {category}</span> : <span className="px-2 py-1 rounded-full border bg-white">Category: All</span>}
                <span className="px-2 py-1 rounded-full border bg-white">Total: {total}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                {/* Sidebar Filters */}
                <aside className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} />
                        <div className="font-medium">Filters</div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500">Category</div>
                        <Select value={category || "all"} onValueChange={handleCategory}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={String(c.id)} value={c.slug}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Order By */}
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500">Order by</div>
                        <Select value={orderBy} onValueChange={handleOrderBy}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Order by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                                <SelectItem value="created-desc">Newest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Per Page */}
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500">Per page</div>
                        <Select value={String(perPage)} onValueChange={handlePerPage}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="15" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="24">24</SelectItem>
                                <SelectItem value="48">48</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reset Filters */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setSearch("");
                            setCategory(""); // clear doors to browse everything
                            setOrderBy("name-asc");
                            setPerPage(15);
                            setPage(1);
                        }}
                    >
                        Reset
                    </Button>

                    {/* Quick links */}
                    <div className="text-xs text-slate-500 pt-2">
                        <Link href="/categories" className="underline">Browse categories</Link>
                    </div>
                </aside>

                {/* Main list */}
                <section className="space-y-4">
                    {/* Top controls: view toggle */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing {items.length} of {total}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={view === "grid" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setView("grid")}
                                aria-label="Grid view"
                            >
                                <Grid3X3 size={16} />
                            </Button>
                            <Button
                                variant={view === "list" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setView("list")}
                                aria-label="List view"
                            >
                                <List size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Items */}
                    {loading ? (
                        view === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-64 rounded-2xl border bg-slate-50 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-28 rounded-2xl border bg-slate-50 animate-pulse" />
                                ))}
                            </div>
                        )
                    ) : items.length ? (
                        view === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {items.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((p) => (
                                    <ProductListRow key={p.id} p={p} />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="text-center text-slate-500 py-10">No products found</div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canPrev}
                            onClick={() => {
                                if (!canPrev) return;
                                setPage((p) => Math.max(1, p - 1));
                            }}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Prev
                        </Button>
                        <div className="text-sm">
                            Page <span className="font-medium">{page}</span> of{" "}
                            <span className="font-medium">{totalPages}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canNext}
                            onClick={() => {
                                if (!canNext) return;
                                setPage((p) => p + 1);
                            }}
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
