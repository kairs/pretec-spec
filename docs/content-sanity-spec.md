# Content & CMS Specification — Sanity to Storefront

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Editorial content authored in Sanity and rendered in the Storefront (integration + rendering)
**Index ref:** [spec-index.md](spec-index.md) → I-5 (integration) · F-8 (rendering)
**Related:** [I-2 Catalog publish](catalog-publish-spec.md) · [F-1 Catalog browsing](catalog-browsing-spec.md)

---

## 1. Purpose

This specification covers two related concerns in one document:

- **I-5 (integration):** How Sanity content reaches the Mosaik Storefront — the delivery mechanism, publishing workflow, and asset handling.
- **F-8 (rendering):** Which content types are in Phase 1 scope, what they contain, and how they are rendered alongside catalog data.

```
Pretec editor → Sanity (authoring)
                    │
                    │ Publish event → webhook
                    ▼
            Mosaik Storefront (near-real-time update)
```

---

## 2. Systems and roles

| System | Role |
|---|---|
| **Sanity** | Headless CMS — editorial content and content assets; authored by Pretec |
| **Mosaik Storefront** | Renders content; merges editorial pages with the surrounding site layout |
| **Mosaik Catalog** | Drives navigation — the category tree is the source for site navigation, not Sanity |

---

## 3. Phase 1 content scope

In Phase 1, Sanity manages **editorial landing pages only**.

| Content type | Phase 1 | Notes |
|---|---|---|
| Editorial landing pages | ✅ | Standalone pages — About, Contact, Terms, etc. |
| Category content (banners, descriptions) | ❌ | Phase 2 |
| Campaign / promotional banners | ❌ | Phase 2 |
| Navigation / mega menu | ❌ | Driven from catalog category tree — not Sanity |

Keeping the Phase 1 content scope narrow lets Pretec launch without a full content authoring setup. Editorial pages can be added and iterated independently of product data.

---

## 4. Editorial landing pages

### 4.1 What they are

Standalone informational pages authored and maintained entirely in Sanity. Examples: About Pretec, Contact, Terms and conditions, Privacy policy, FAQ.

### 4.2 Content model

Each editorial page contains:

| Field | Notes |
|---|---|
| Title | Displayed as the page heading and `<title>` tag |
| Slug / URL path | e.g. `/om-oss`, `/kontakt` — set by the editor |
| Body content | Rich text (block content): headings, paragraphs, lists, links, inline images |
| SEO meta description | For search engine snippets |
| Published / draft state | Controlled in Sanity — only published pages appear on the storefront |

The full field schema is finalized during Sanity content model configuration. Additional fields (e.g. hero image, call-to-action) can be added as needed.

### 4.3 Rendering

Editorial pages are rendered using the Storefront's standard page layout (header, footer, navigation). The page body renders the Sanity rich-text content. No catalog data is merged onto editorial pages.

---

## 5. Navigation

Site navigation (header, mega menu, breadcrumbs) is driven **automatically from the Mosaik Catalog category tree** — the same hierarchy synced from RamBase via Struct (I-1 → I-2). Pretec editors do not manage navigation in Sanity.

| Navigation element | Source |
|---|---|
| Top-level categories (segments) | Catalog category tree |
| Sub-category levels (K1 → K2 → K3) | Catalog category tree |
| Editorial page links in footer/header | Sanity page slugs (linked manually in Storefront config) |
| Breadcrumbs | Catalog category hierarchy + current page |

If a new category level is added in RamBase and synced through Harmony, it appears in navigation within the next 10-minute catalog sync cycle — no Sanity authoring required.

---

## 6. Content delivery and publishing

### 6.1 Delivery mechanism

Sanity content reaches the Storefront via **Sanity webhook → Storefront near-real-time update**. When a Pretec editor publishes (or unpublishes) a page in Sanity, a webhook triggers the Storefront to fetch and render the updated content. Changes are live within seconds to minutes of publishing.

| Property | Value |
|---|---|
| Delivery | Sanity Content Lake API + webhook-triggered update |
| Latency | Near-real-time (seconds to minutes after publish) |
| Draft preview | Standard Sanity draft/publish workflow; drafts are not visible on the live storefront |
| Unpublish | Unpublishing a page in Sanity removes it from the storefront; the URL returns 404 |

### 6.2 Draft and preview

Sanity's built-in draft/publish workflow applies:

- **Drafts** are only visible inside Sanity Studio — not on the live storefront.
- **Published** documents are live on the storefront.
- Sanity Studio's preview function can be used to review drafts before publishing.

---

## 7. Assets

Images and files embedded in editorial page content are hosted on the **Sanity CDN** and referenced via Sanity's asset pipeline. The Storefront renders them directly from Sanity's CDN URLs.

Assets uploaded to Sanity for editorial content are separate from product assets, which are managed in Struct (see [I-2 §4.2](catalog-publish-spec.md)).

---

## 8. Sanity / Struct boundary

| Content | Managed in | Notes |
|---|---|---|
| Editorial pages (About, Contact, etc.) | Sanity | Pure CMS content, no catalog data |
| Product descriptions | Struct | Product enrichment — not duplicated in Sanity |
| Category descriptions | Struct (Phase 2: Sanity) | Category enrichment stays in Struct for Phase 1 |
| Product images and documents | Struct | Product assets — not in Sanity |
| Campaign/category banners | ❌ Phase 2 | Not in scope for Phase 1 |

The rule: anything that relates to a specific product or category lives in Struct. Standalone editorial content lives in Sanity.

---

## 9. Phase 2 considerations

| Capability | Notes |
|---|---|
| Category content (banner, description on category pages) | Sanity content overlaid on catalog listing pages — editorial and catalog combined |
| Campaign / promotional banners | Homepage or site-wide banners, time-limited campaigns |
| Navigation managed in Sanity | If Pretec needs to control top-level navigation independently of the catalog |

---

## 10. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Sanity content model | Define and configure schema for editorial pages | Review and confirm fields |
| Sanity Studio setup | Configure and deploy Sanity Studio for Pretec | Author and maintain editorial content |
| Storefront content rendering | Implement editorial page rendering and webhook integration | — |
| Navigation | Implement catalog-driven navigation | Maintain category structure in RamBase |
| Editorial page URLs | Implement slug-based routing | Define page slugs and content |
| Asset hosting | Configure Sanity CDN asset pipeline | Upload images and files in Sanity |

---

## 11. Open questions

| Question | Status |
|---|---|
| Final list of editorial pages needed at launch | Confirm with Pretec — e.g. About, Contact, Terms, Privacy |
| Additional content fields beyond rich text (hero image, CTA button) | Confirm with Pretec during content model setup |
| Who at Pretec has publishing rights in Sanity Studio | Confirm operating process with Pretec |

---

## 12. Related specs

- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 product/category catalog sync (separate from editorial content)
- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 catalog-driven navigation rendering
- [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) — I-1 product data (Struct owns product enrichment, not Sanity)
- [localization-spec.md](localization-spec.md) — X-1 Norwegian-only Phase 1 (content is authored in Norwegian)
