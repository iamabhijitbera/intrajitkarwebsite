# Debanshu Interior Decoration — Static Website

A plain **HTML + CSS + JavaScript** version of the site. No React, no build step, no npm packages.
Everything the visitor sees is driven by the JSON files in `data/`.

---

## Run it locally

The pages load `data/*.json` with `fetch()`, and browsers block that on the `file://` protocol.
So serve the folder over HTTP — pick whichever you have:

```bash
# bundled, zero dependencies (Node 18+)
node server.js            # http://localhost:5500
node server.js 3000       # custom port

# or any other static server
npx serve .
python3 -m http.server 5500
```

Opening `index.html` by double-clicking will show a warning banner and the JSON-driven
sections (services, portfolio, location lists) will be empty. Use a server during development.

---

## Folder structure

```
staticweb/
├── index.html              Home — hero slider, services, portfolio, process, areas
├── about.html              About
├── services.html           All services + specialist services
├── projects.html           Portfolio with category filter
├── locations.html          Service areas index
├── contact.html            Call + WhatsApp cards (no form)
├── 404.html                Not found
├── sitemap.xml             Generated
├── robots.txt              Generated
├── server.js               Local development server
├── css/styles.css          All styling (design tokens at the top)
├── js/main.js              Loads the JSON and renders the site
├── data/
│   ├── site.json           Business name, phone, WhatsApp, nav, footer areas
│   ├── images.json         Product image registry (heroes + interior photos)
│   ├── services.json       Main services, specialist services, process, why-us points
│   ├── projects.json       Portfolio items + filter categories
│   └── locations.json      Every service area with its own intro, context and FAQs
├── assets/
│   ├── favicon.ico
│   └── images/             hero-1/2/3.jpg + 8 numbered interior photos
├── locations/              25 area pages (generated from locations.json)
└── tools/
    └── build-location-pages.mjs
```

---

## Editing content

Everything below is edited in `data/` — never in the HTML.

| To change… | Edit |
| --- | --- |
| Phone number, WhatsApp number/message, business name, footer areas | `data/site.json` |
| Add or replace an interior photo | drop the file into `assets/images/`, then update `data/images.json` |
| Service names, descriptions, benefits, "suitable for" | `data/services.json` → `main` |
| False ceiling, lighting, custom furniture etc. | `data/services.json` → `extended` |
| The 5-step process | `data/services.json` → `process` |
| The dark "Why Debanshu" section | `data/services.json` → `why` |
| Portfolio items and filter categories | `data/projects.json` |
| An area's intro, local context, service focus, FAQs | `data/locations.json` |

### How the images work

`data/images.json` is the image registry.

- `heroes` — the three full-width hero images.
- `products` — the interior photos. Each one has an `id` and a `usedFor` list.

`services.json` entries point at a photo by `imageId`, and `projects.json` entries use `image`
directly. To swap a photo everywhere it appears, change the `src` of that one entry in
`images.json` — or add a new entry with the same `usedFor` values.

Supported formats: `.webp` (what the current photos use), `.jpg`, `.png`, `.svg`.

### Adding a new service area

1. Add an object to `data/locations.json`:

   ```json
   {
     "slug": "bally-jagacha",
     "name": "Bally Jagacha",
     "intro": "Unique text about interiors in this locality…",
     "context": "Unique local context — housing type, climate, what clients usually ask for…",
     "focus": ["home-interior", "modular-kitchen"],
     "faqs": [{ "q": "Question?", "a": "Answer." }]
   }
   ```

2. Re-run the generator from inside `staticweb/`:

   ```bash
   node tools/build-location-pages.mjs
   ```

That writes `locations/bally-jagacha.html` with its own title, meta description, canonical,
breadcrumb + service structured data, and FAQs — and refreshes `sitemap.xml` and `robots.txt`.

The header dropdown, the mobile menu, the location grids and the footer all pick the new area up
automatically, because they are rendered from the same JSON.

**Keep every area's `intro`, `context` and `faqs` distinct.** Duplicating one locality's text and
just swapping the name is what the original brief specifically asked to avoid.

---

## Before you publish

1. **Set your real domain.** The `siteUrl` value in `data/site.json` and the `canonical` /
   `og:url` tags in the HTML files still point at the old Lovable preview URL. Replace them with
   your live domain (`https://yourdomain.com`), then re-run
   `node tools/build-location-pages.mjs` so the area pages and sitemap match.
2. **Upload the whole `staticweb/` folder** to your host (Netlify, Vercel, GitHub Pages, cPanel —
   any static host). There is nothing to compile.
3. Point your 404 handler at `404.html`.

---

## Notes

- **No contact forms anywhere**, by design. Every conversion path is the phone number
  (`tel:+918900478744`) or WhatsApp (`https://wa.me/918900478744`), including a floating
  WhatsApp + Call button on desktop and a fixed two-button bar on mobile.
- The phone number and WhatsApp link live only in `data/site.json`, so changing them updates the
  header, footer, floating buttons and every page CTA at once.
- `js/main.js` has no dependencies and no build step — it is plain browser JavaScript.
- If JavaScript is disabled, each page shows a banner with working call and WhatsApp links, and
  the header/footer contain real links, so the site is still navigable.
