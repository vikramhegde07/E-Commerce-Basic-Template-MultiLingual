import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[var(--color-footer-bg)] text-[var(--color-footer-text)] pt-12 pb-6 mt-20">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                {/* --- Sitemap --- */}
                <div>
                    <h4 className="text-lg font-semibold mb-4 text-[var(--color-footer-link)]">Sitemap</h4>
                    <ul className="space-y-2 text-sm">
                        {[
                            { name: "Home", href: "/" },
                            { name: "About", href: "/about" },
                            { name: "Products", href: "/products" },
                            { name: "Categories", href: "/categories" },
                            { name: "Contact", href: "/contact" },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="hover:text-[var(--color-footer-link-hover)] transition-colors"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- CTA / Company --- */}
                <div className="col-span-2 lg:col-span-1">
                    <h4 className="text-lg font-semibold mb-4 text-[var(--color-footer-link)]">
                        Our Company
                    </h4>
                    <p className="text-sm mb-4 leading-relaxed">
                        We manufacture and supply high-quality doors, kitchen cabinets, and
                        accessories built for durability and elegance.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-[var(--color-secondary)] text-[var(--color-footer-bg)] px-4 py-2 rounded-md font-medium text-sm hover:bg-[var(--color-primary-light)] hover:text-white transition-colors"
                    >
                        Get in Touch
                    </Link>
                </div>

                {/* --- Placeholder for future columns --- */}
                <div className="hidden lg:block" />
                <div className="hidden lg:block" />

            </div>

            {/* --- Bottom Bar --- */}
            <div className="border-t border-[var(--color-border)]/10 mt-10 pt-6 text-center text-sm text-[var(--color-footer-text)]">
                © {new Date().getFullYear()}{" "}
                <span className="text-[var(--color-footer-link)] font-medium">
                    Your Company Name
                </span>
                . All rights reserved.
            </div>
        </footer>
    );
}
