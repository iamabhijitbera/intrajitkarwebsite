#!/usr/bin/env node
/**
 * Generates one static HTML page per area in data/locations.json,
 * plus sitemap.xml and robots.txt.
 *
 *   node tools/build-location-pages.mjs
 *
 * Add an area by editing data/locations.json, then re-run this script.
 * Run it from the staticweb/ folder.
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT_DIR = path.resolve(HERE, "..");

const site = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data/site.json"), "utf8"));
const { items: locations } = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data/locations.json"), "utf8"));

const OUT_DIR = path.join(ROOT_DIR, "locations");
fs.mkdirSync(OUT_DIR, { recursive: true });

const WA = site.whatsappLink;

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

// JSON embedded in <script> must not contain a literal </script>.
function jsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

const ICON_PHONE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

const ICON_WHATSAPP =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

// Hero buttons on the light/dark photography background.
function callButtons() {
  return `<div class="btn-group">
            <a class="btn btn-coral" href="${site.phoneTel}">${ICON_PHONE} Call Now</a>
            <a class="btn btn-outline-light" href="${WA}" target="_blank" rel="noopener noreferrer">${ICON_WHATSAPP} WhatsApp Us</a>
          </div>`;
}

// FAQ block buttons on a light background.
function faqButtons() {
  return `<div class="btn-group mt-8">
              <a class="btn btn-coral" href="${site.phoneTel}">${ICON_PHONE} Call Now</a>
              <a class="btn btn-outline-dark" href="${WA}" target="_blank" rel="noopener noreferrer">${ICON_WHATSAPP} WhatsApp Us</a>
            </div>`;
}

function page(l) {
  // "in Howrah, Howrah" reads badly, so the main area drops the region suffix.
  const place = l.name === site.locality ? l.name : `${l.name}, ${site.locality}`;
  const title = `Interior Decorator in ${place} | Debanshu Interior Decoration`;
  const description = `Interior design and decoration for homes, offices and commercial spaces in ${l.name}, Howrah. Call or WhatsApp ${site.phoneDisplay}.`;
  const url = `${site.siteUrl}/locations/${l.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${site.siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Locations", item: `${site.siteUrl}/locations` },
      { "@type": "ListItem", position: 3, name: l.name, item: url },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Interior decoration and interior design",
    areaServed: { "@type": "Place", name: `${l.name}, Howrah, West Bengal` },
    provider: {
      "@type": "LocalBusiness",
      name: site.businessName,
      telephone: "+918900478744",
      areaServed: "Howrah, West Bengal, India",
    },
  };

  const faqs = l.faqs
    .map(
      (f) => `            <div class="faq-item">
              <h3>${esc(f.q)}</h3>
              <p>${esc(f.a)}</p>
            </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="../assets/favicon.ico" type="image/x-icon" />
    <meta property="og:site_name" content="${esc(site.businessName)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&display=swap"
    />
    <link rel="stylesheet" href="../css/styles.css" />
    <script type="application/ld+json">
${jsonForScript(breadcrumbSchema)}
    </script>
    <script type="application/ld+json">
${jsonForScript(serviceSchema)}
    </script>
  </head>
  <body data-page="location" data-root="../" data-slug="${esc(l.slug)}">
    <header class="site-header" data-mount="header">
      <div class="container header-inner">
        <a class="logo" href="../index.html">
          <span class="logo__name">DEBANSHU</span>
          <span class="logo__sub">INTERIOR DECORATION</span>
        </a>
        <nav class="nav" aria-label="Main">
          <a class="nav__link" href="../index.html">Home</a>
          <a class="nav__link" href="../about.html">About</a>
          <a class="nav__link" href="../services.html">Services</a>
          <a class="nav__link" href="../projects.html">Projects</a>
          <a class="nav__link" href="../locations.html">Locations</a>
          <a class="nav__link" href="../contact.html">Contact</a>
        </nav>
        <div class="header-ctas">
          <a class="btn btn-coral" href="${site.phoneTel}">Call Now</a>
          <a class="btn btn-outline-dark" href="${WA}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      </div>
    </header>

    <noscript>
      <div class="noscript-banner">
        Interior Decorator in ${esc(l.name)} — call
        <a href="${site.phoneTel}">${esc(site.phoneDisplay)}</a> or
        <a href="${WA}" target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
      </div>
    </noscript>

    <main>
      <section class="page-hero">
        <img
          class="page-hero__media"
          src="../assets/images/hero-1.jpg"
          alt="Interior decorator in ${esc(l.name)}, Howrah — Debanshu Interior Decoration"
          width="1920"
          height="1080"
        />
        <div class="page-hero__overlay"></div>
        <div class="page-hero__content container">
          <p class="eyebrow eyebrow--taupe">Howrah · ${esc(l.name)}</p>
          <h1 class="page-hero__title h1">Interior Decorator in ${esc(l.name)}</h1>
          <p class="page-hero__text">
            Thoughtfully designed interiors for homes, apartments, offices and commercial spaces in ${esc(l.name)}.
          </p>
          ${callButtons()}
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a href="../index.html">Home</a>
            <span class="sep" aria-hidden="true"></span>
            <a href="../locations.html">Locations</a>
            <span class="sep" aria-hidden="true"></span>
            <span aria-current="page">${esc(l.name)}</span>
          </nav>
        </div>
      </section>

      <section class="section">
        <div class="container split">
          <div>
            <p class="eyebrow">Local Interiors</p>
            <h2 class="h2 mt-4">Interior Design &amp; Decoration in ${esc(l.name)}</h2>
          </div>
          <div class="stack">
            <p class="lede">${esc(l.intro)}</p>
            <p class="lede">${esc(l.context)}</p>
          </div>
        </div>
      </section>

      <section class="section section--white">
        <div class="container">
          <p class="eyebrow">Services</p>
          <h2 class="h2 mt-4">Interior Design Services in ${esc(l.name)}</h2>
          <div class="mt-16" data-mount="servicesGrid" data-slugs="${esc(l.focus.join(","))}" data-location="${esc(l.name)}"></div>
        </div>
      </section>

      <section data-mount="why" data-heading="Why Choose ${esc(site.businessName)} in ${esc(l.name)}?"></section>

      <section data-mount="process"></section>

      <section class="section section--white">
        <div class="container">
          <p class="eyebrow">Also Popular</p>
          <h2 class="h2 mt-4">Popular Interior Services in ${esc(l.name)}</h2>
          <div class="mt-12" data-mount="extendedServices" data-limit="6" data-link="true"></div>
        </div>
      </section>

      <section class="section section--beige">
        <div class="container split split--wide-left">
          <div>
            <p class="eyebrow">FAQ</p>
            <h2 class="h2 mt-4">Frequently Asked Questions — ${esc(l.name)}</h2>
            ${faqButtons()}
          </div>
          <div class="faq-list">
${faqs}
          </div>
        </div>
      </section>

      <section class="section section--tight">
        <div class="container">
          <h2 class="h3">Interior Services In Nearby Areas</h2>
          <div class="pill-cloud" data-mount="nearbyLocations"></div>
          <noscript>
            <p class="lede mt-8">See every area we serve on the <a href="../locations.html">service areas page</a>.</p>
          </noscript>
        </div>
      </section>

      <section data-mount="finalCta"></section>
    </main>

    <footer data-mount="footer"></footer>
    <div data-mount="floating"></div>

    <script src="../js/main.js"></script>
  </body>
</html>
`;
}

/* ------------------------------------------------------------- write pages */
let written = 0;
for (const l of locations) {
  fs.writeFileSync(path.join(OUT_DIR, `${l.slug}.html`), page(l));
  written += 1;
}

/* ------------------------------------------------------------- sitemap.xml */
const paths = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/locations",
  "/contact",
  ...locations.map((l) => `/locations/${l.slug}`),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((p) => `  <url>\n    <loc>${site.siteUrl}${p}</loc>\n  </url>`),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT_DIR, "sitemap.xml"), sitemap);

fs.writeFileSync(
  path.join(ROOT_DIR, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`
);

console.log(`Wrote ${written} location pages to locations/`);
console.log(`Wrote sitemap.xml (${paths.length} URLs) and robots.txt`);
