# Catalog Publish Specification — Struct to Storefront Catalog via Harmony

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Publishing enriched product and category data from Struct to the Mosaik Storefront Catalog via Harmony Catalog Sync
**Index ref:** [spec-index.md](spec-index.md) → I-2
**Upstream:** [I-1 Product & Category sync](product-rambase-struct-harmony-spec.md) — RamBase → Struct (the feed into Struct this spec reads from)
**Downstream:** [F-1 Catalog & product browsing](catalog-browsing-spec.md) · [F-2 Search & filtering](search-filtering-spec.md)

---

## 1. Purpose

This specification defines how enriched product and category data flows **from Struct to the Mosaik Storefront Catalog** via Harmony Catalog Sync.

The [I-1 product spec](product-rambase-struct-harmony-spec.md) covers the upstream half (RamBase → Struct). This document covers the downstream half:

```
Struct (enriched PIM)
        │
        ▼
Mosaik Harmony — Catalog Sync (scheduled, every 10 min)
        │
        ▼
Mosaik Storefront Catalog
```

---

## 2. Systems and roles

| System | Role |
|---|---|
| **Struct** | Source of enriched, catalog-ready product and category data; owns the publish flag |
| **Mosaik Harmony — Catalog Sync** | Reads Struct, maps to the Storefront catalog model, publishes on schedule |
| **Mosaik Storefront / Catalog** | Consumer — renders listing pages, product detail pages, navigation, and search |

---

## 3. Publish eligibility

A product is only published to the Storefront catalog when **both** of the following are true:

| Condition | Source | Notes |
|---|---|---|
| Product is active | RamBase (synced to Struct via I-1) | Deactivated products are never published |
| Product is marked "Published for web" | Struct (Pretec-controlled flag) | Pretec editors explicitly mark each product ready |

Products present in Struct but not yet marked "Published for web" are invisible to the Storefront — they do not appear in listings, search results, or navigation. This gives Pretec editorial control over launch timing and enrichment readiness.

---

## 4. Field mapping — Struct → Storefront Catalog

The Harmony Catalog Sync maps the following Struct fields to the Storefront catalog model.

### 4.1 Core product fields

| Storefront field | Source | Owned by |
|---|---|---|
| Product ID / SKU | RamBase (via Struct) | RamBase — stable key |
| Product name (display) | Struct | Struct/Pretec — overrides RamBase ERP name |
| Short description | Struct | Struct/Pretec |
| Long description | Struct | Struct/Pretec |
| Product status (active/inactive) | RamBase (via Struct) | RamBase |
| Unit of measure | RamBase (via Struct) | RamBase |
| Category assignment | RamBase (via Struct) | RamBase |
| Technical attributes / specifications | Struct | Struct/Pretec |
| SEO title | Struct | Struct/Pretec |
| SEO meta description | Struct | Struct/Pretec |
| URL slug | Derived from product name / SKU | Harmony / Storefront |
| Variant relationships | Struct | Struct/Pretec (see §6) |

### 4.2 Assets

| Asset type | Source | Notes |
|---|---|---|
| Product images | Struct | Primary image used for listing card; all images shown on detail page |
| Product documents (datasheets, etc.) | Struct | Linked on product detail page |

Assets are synced from Struct and served via the Mosaik Storefront CDN. The original Struct asset URLs are not exposed to the frontend.

### 4.3 Fields NOT synced via Catalog Sync

| Field | Source | How it reaches the storefront |
|---|---|---|
| Price | RamBase | Live fetch via Pretec Service API (logged-in users only) — see [F-3](pricing-display-spec.md) |
| Inventory / availability | RamBase | Separate Harmony Inventory Sync — see [I-3](inventory-sync-spec.md) |
| Editorial content (category banners, page text) | Sanity | Content sync — see [I-5](content-sanity-spec.md) |

---

## 5. Category tree

The category hierarchy in the Storefront Catalog derives from the category structure synced from RamBase (via Harmony) and enriched in Struct.

| Property | Value |
|---|---|
| Source | RamBase (authoritative) — enriched in Struct |
| Depth | Up to 4 levels: Segment → Kategori 1 → Kategori 2 → Kategori 3 |
| Storefront-only categories | Not in Phase 1 — all categories originate from RamBase |
| Category enrichment in Struct | Display name, description, images/banners, SEO metadata |

Category enrichment fields (description, images, SEO) are managed in Struct and synced to the Storefront alongside product data.

---

## 6. Variants

Products may have one or more variant dimensions (e.g. size, dimension, finish). Variant relationships are defined in Struct and synced to the Storefront Catalog.

- The parent product groups the variants; the detail page shows a variant selector.
- Each variant has its own SKU, article number, availability, and price.
- Selecting a variant updates the SKU, availability, and price display without a full page reload.
- Variant URL updates on selection for linkability and SEO.

See [F-1 §5.2](catalog-browsing-spec.md) for the storefront variant selector behavior.

---

## 7. Deactivation and unpublish behavior

### 7.1 Product deactivated in RamBase

When a product's active status in RamBase changes to inactive, Harmony syncs this to Struct (I-1), and the Catalog Sync picks it up within 10 minutes.

The deactivated product is **removed from listings and search results** but **remains accessible via its direct URL**, showing:

- Product name and basic detail
- "Ikke lenger tilgjengelig" label (prominently displayed)
- No price
- No availability indicator
- No add-to-cart button

The product URL does not redirect and does not return a 404. Direct links remain valid. This preserves external links and bookmark URLs.

### 7.2 Product unpublished in Struct

When a Pretec editor removes the "Published for web" flag in Struct, the product is treated the same as a deactivated product (see §7.1).

### 7.3 Product deleted in RamBase

If a product is fully deleted from RamBase (not just deactivated), it is removed from Struct by Harmony (I-1) and subsequently removed from the Storefront Catalog by Catalog Sync. The product URL returns 404. This is only expected in exceptional circumstances; deactivation (§7.1) is the normal lifecycle path.

---

## 8. Sync frequency

| Sync | Frequency |
|---|---|
| Harmony Catalog Sync (Struct → Storefront Catalog) | Every 10 minutes (scheduled) |
| Initial full sync | On first deployment and on demand for resync |
| Delta sync | Every 10 minutes — only changed/new products and categories |

The 10-minute cadence matches the Harmony customer sync and is the standard Harmony interval. Changes made in Struct (enrichment edits, publish flag changes) are reflected in the Storefront Catalog within approximately 10 minutes.

---

## 9. Error handling

- A sync failure for a single product must not block the sync of other products.
- Failed syncs are logged with product ID, reason, and timestamp.
- Errors are visible in the Harmony/Maestro operations view.
- After the underlying issue is corrected (in Struct or in source data), the next scheduled sync retries automatically — no manual cleanup required.

Common failure causes:
- Missing required field (product name, SKU)
- Invalid or missing asset reference
- Category reference not yet synced
- Struct API unavailable
- Storefront Catalog API unavailable

---

## 10. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony Catalog Sync configuration | Configure field mapping, sync schedule, error handling | Review and approve mapping |
| Publish flag | Implement in Struct model | Mark products "Published for web" before launch |
| Product enrichment quality | Support model and validation | Enrich products in Struct (name, description, attributes, assets) |
| Category enrichment | Configure sync | Enrich categories in Struct (description, images, SEO) |
| Asset pipeline | Configure Struct → Storefront CDN | Upload assets in Struct |
| Variant relationships | Configure sync | Define variant dimensions in Struct |
| Deactivation behavior | Implement "Ikke lenger tilgjengelig" state | Manage product lifecycle in RamBase |
| Sync operations | Monitor technical failures; provide alerting | Triage data-quality issues |

---

## 11. Open questions

| Question | Status |
|---|---|
| Exact field name for "Published for web" flag in Struct | Confirm during Harmony Catalog Sync configuration |
| Maximum number of assets per product (images + documents) | Confirm with Pretec |
| Whether category enrichment (images, banners) is in scope for launch | Confirm with Pretec |
| Alerting and operational contact for sync failures | Confirm during implementation |

---

## 12. Related specs

- [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) — I-1 upstream product sync (RamBase → Struct)
- [inventory-sync-spec.md](inventory-sync-spec.md) — I-3 inventory / availability sync (separate from catalog sync)
- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 storefront rendering of catalog data
- [search-filtering-spec.md](search-filtering-spec.md) — F-2 which catalog fields feed search and facets
- [harmony-sync-spec.md](harmony-sync-spec.md) — C-1 Harmony engine configuration (cross-cutting)
- [content-sanity-spec.md](content-sanity-spec.md) — I-5 editorial content (Sanity), separate from product catalog
