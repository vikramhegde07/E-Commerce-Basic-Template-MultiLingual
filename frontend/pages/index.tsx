// pages/index.tsx
import AboutSection from '@/components/Home/AboutSection';
import GlobalPresence from '@/components/Home/GlobalPresence';
import HomeHeroCarousel from '@/components/Home/HomeHeroCarousel';
import IndustriesServed from '@/components/Home/IndustriesServed';
import ProductRange from '@/components/Home/ProductRange';
import QualityAndRnD from '@/components/Home/QualityAndRnD';
import Head from "next/head";
import { HOME_SEO } from "@/seo/homeSeoConfig";
import { useLanguage } from "@/context/LanguageContext";
export default function Home() {
  const { locale } = useLanguage(); // "en" | "ar" | "zh"
  const seo = HOME_SEO[locale] ?? HOME_SEO.en;

  const siteUrl = "https://primeconnects.ae";
  const pageUrl = siteUrl + "/";
  return (
    <>
      <Head>
        {/* Basic SEO */}
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={pageUrl} />

        {/* Language hint (helps a bit even without separate URLs) */}
        <meta httpEquiv="content-language" content={locale} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta
          property="og:image"
          content={`${siteUrl}/og-image.jpg`} // replace with real image
        />
        <meta property="og:site_name" content="Primeconnects Doors & Cabinets Solutions" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle} />
        <meta name="twitter:description" content={seo.ogDescription} />
        <meta
          name="twitter:image"
          content={`${siteUrl}/og-image.jpg`} // replace with real image
        />

        {/* JSON-LD: Organization (kept mostly language-agnostic) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Primeconnects Doors & Cabinets Solutions",
              url: siteUrl,
              logo: `${siteUrl}/logo.png`, // update
              description:
                "Primeconnects is a multinational manufacturer and supplier of doors, panels, and cabinetry with factories in the UAE and China.",
              foundingDate: "1999",
              address: [
                {
                  "@type": "PostalAddress",
                  addressCountry: "AE",
                  addressLocality: "United Arab Emirates",
                },
                {
                  "@type": "PostalAddress",
                  addressCountry: "CN",
                  addressLocality: "China",
                },
              ],
              areaServed: ["AE", "SA", "OM", "QA", "CN"],
              makesOffer: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Interior and entrance doors",
                    category: "Doors",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Fire-rated doors",
                    category: "Doors",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Cabinet and wardrobe systems",
                    category: "Cabinetry",
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <HomeHeroCarousel />
      <AboutSection
        mediaType="youtube"
        youtubeUrl="https://www.youtube.com/watch?v=WecEaqY_9PQ"
      />
      <ProductRange />
      <GlobalPresence />
      <IndustriesServed />
      <QualityAndRnD />
    </>
  );
}
