// src/lib/price.ts
export type Discount = {
    id: number;
    name: string;
    type: "percent" | "amount";
    value: number;            // percent: 0–100, amount: >=0
    applies_to: "product" | "category";
    priority?: number;        // higher wins if tie in savings
};

export type PriceInfo = { mrp: number; currency: string };

export type ComputedPrice = {
    mrp: number;
    final: number;
    savings: number;
    discount?: Discount | null;
};

export function computeBestPrice(price: PriceInfo, discounts: Discount[] = []): ComputedPrice {
    const mrp = Math.max(0, Number(price.mrp || 0));
    if (!mrp || discounts.length === 0) return { mrp, final: mrp, savings: 0, discount: null };

    const evaluated = discounts.map(d => {
        const off = d.type === "percent" ? (mrp * (d.value / 100)) : d.value;
        const savings = Math.max(0, Math.min(off, mrp)); // clamp
        const final = Math.max(0, mrp - savings);
        return { d, savings, final };
    });

    // pick best by savings; tie-break by priority (desc), then id (desc)
    evaluated.sort((a, b) => {
        if (b.savings !== a.savings) return b.savings - a.savings;
        const pa = a.d.priority ?? 0, pb = b.d.priority ?? 0;
        if (pb !== pa) return pb - pa;
        return (b.d.id ?? 0) - (a.d.id ?? 0);
    });

    const best = evaluated[0];
    return { mrp, final: best.final, savings: best.savings, discount: best.d };
}
