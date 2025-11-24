const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const website = "https://hatimalanwar.com";

async function generate() {
    console.log("Generating sitemap...");

    // STATIC PAGES
    const staticUrls = [
        `${website}/`,
        `${website}/about-us`,
        `${website}/contact-us`,
        `${website}/categories`,
        `${website}/brands`,
        `${website}/products`,
    ];

    // FETCH PRODUCT SLUGS FROM CODEIGNITER BACKEND
    let slugs = [];
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        const { data } = await axios.get(apiBase + "/public/products/slugs");
        slugs = data.map((x) => `${website}/products/${x.slug}`);
    } catch (err) {
        console.error("Failed to fetch product slugs:", err);
    }

    // BUILD SITEMAP XML
    const urls = [...staticUrls, ...slugs]
        .map((u) => `<url><loc>${u}</loc></url>`)
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls}
</urlset>`;

    // WRITE TO PUBLIC FOLDER
    fs.writeFileSync("public/sitemap.xml", xml);
    console.log("Sitemap generated → public/sitemap.xml");
}

generate();
