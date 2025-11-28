// pages/brochures/index.tsx
import Head from "next/head";
import { Download } from "lucide-react";

const brochures = [
    {
        label: "Prime Connects Doors.pdf",
        fileName: "Prime Connects Doors.pdf",
    },
    {
        label: "Primeconnects Cylinder Locks.pdf",
        fileName: "Primeconnects Cylinder Locks.pdf",
    },
    {
        label: "Primeconnects General Catalogue.pdf",
        fileName: "Primeconnects General Catalogue.pdf",
    },
    {
        label: "Primeconnects Hinges.pdf",
        fileName: "Primeconnects Hinges.pdf",
    },
    {
        label: "Primeconnects Smart Rim Locks.pdf",
        fileName: "Primeconnects Smart Rim Locks.pdf",
    },
];

export default function BrochureDownloadPage() {
    return (
        <>
            <Head>
                <title>Prime Connects Brochures</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div
                style={{
                    maxWidth: "600px",
                    margin: "40px auto",
                    padding: "20px",
                    fontFamily: "sans-serif",
                }}
            >
                <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>
                    Prime Connects Brochures
                </h1>

                <p style={{ marginBottom: "20px", color: "#555" }}>
                    Download the brochures directly using the links below:
                </p>

                <div
                    style={{
                        display: "grid",
                        gap: "14px",
                    }}
                >
                    {brochures.map((b, i) => {
                        const href = `/brochures/${encodeURIComponent(b.fileName)}`;

                        return (
                            <a
                                key={i}
                                href={href}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#333",
                                    background: "#fafafa",
                                }}
                            >
                                <span>{b.label}</span>
                                <Download size={18} />
                            </a>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
