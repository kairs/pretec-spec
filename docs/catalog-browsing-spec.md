# Catalog & Product Browsing Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Storefront catalog browsing — category listing pages, product detail, anonymous browsing
**Index ref:** [spec-index.md](spec-index.md) → F-1
**Consolidates:** [overview §5.1](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) · [customer-overview §4.1](customer-overview-spec.md)

---

## 1. Purpose

This specification covers the customer-facing catalog browsing experience: how categories and products are presented to anonymous and logged-in users, what data is shown and from which source, and how listing pages, product detail pages, and variants behave.

Depends on:
- [I-1 Product & Category sync](product-rambase-struct-harmony-spec.md) — product master data RamBase → Struct
- [I-2 Catalog publish](catalog-publish-spec.md) — Struct → Storefront Catalog
- [I-3 Inventory sync](inventory-sync-spec.md) — inventory data RamBase → Storefront Catalog
- [F-2 Search & filtering](search-filtering-spec.md) — search behavior on listing pages
- [F-3 Pricing display](spec-index.md) — price rules and degradation

---

## 2. Data sources

| Data | Source | How it reaches the storefront |
|---|---|---|
| Product master data (ID, SKU, status, UoM, category) | RamBase | Harmony Product Sync → Struct → Harmony Catalog Sync → Storefront Catalog |
| Product name | **Struct** (overrides RamBase name) | Harmony Catalog Sync → Storefront Catalog |
| Product enrichment (descriptions, attributes, specs) | Struct | Harmony Catalog Sync → Storefront Catalog |
| Product assets (images, documents) | Struct | Harmony Catalog Sync → Storefront Catalog |
| Category hierarchy | RamBase → Struct | Harmony Category Sync → Storefront Catalog |
| Inventory / availability | RamBase | Harmony Inventory Sync → Storefront Catalog |
| Editorial content (category pages, banners) | Sanity | Content sync → Storefront |
| Live price | RamBase | Pretec Service API (on demand, logged-in users only) |

---

## 3. Anonymous vs logged-in access

| Capability | Anonymous | Logged-in (approved) |
|---|---|---|
| Browse category pages | ✅ | ✅ |
| View product detail pages | ✅ | ✅ |
| See product information and enrichment | ✅ | ✅ |
| See product assets (images, documents) | ✅ | ✅ |
| See availability (in stock / out of stock) | ❌ | ✅ |
| See customer-specific prices | ❌ | ✅ |
| Add to cart | ❌ | ✅ |
| Checkout / submit quote | ❌ | ✅ |

> **Applicants (pending invitation)** have no user account and browse exactly as anonymous visitors — catalog and content only. There is no "logged-in pending" state.

---

## 4. Category listing pages

### 4.1 Hierarchy

Categories follow the structure synced from RamBase via Struct — up to four levels deep (Segment → Kategori 1 → Kategori 2 → Kategori 3 → leaf). The storefront renders each level as a browsable listing page.

### 4.2 Product listing

- Products are displayed in a grid on leaf-category pages.
- **Default sort:** creation date, newest first.
- **Pagination:** traditional page-based pagination (not infinite scroll or load-more). Page size is the Mosaik platform default — confirm during implementation.
- Filtering and search behavior is specified separately in [F-2](search-filtering-spec.md).

### 4.3 Product card (on listing page)

Each product card shows:
- Product name (from Struct)
- Product image (primary asset from Struct)
- Article number / SKU
- **Availability badge** (logged-in users only): In stock / Out of stock
- **Price** (logged-in users only): ex-VAT, NOK; "Price on request" if lookup fails

Anonymous users see the product card without availability and without price.

---

## 5. Product detail page

### 5.1 Content

| Section | Content | Shown to |
|---|---|---|
| Product name | From Struct | All |
| Product images / assets | From Struct | All |
| Article number / SKU | From RamBase | All |
| Product description | From Struct | All |
| Technical specifications / attributes | From Struct | All |
| Documents (datasheets, etc.) | From Struct | All |
| Editorial content | From Sanity | All |
| Availability | In stock / Out of stock (from Inventory sync) | Logged-in only |
| Price | Live ex-VAT, NOK (from Service API) | Logged-in only |
| Add to cart | — | Logged-in only |
| Variant selector | Displayed when the product has variants | All |

### 5.2 Variants

Products may have one or more variant dimensions (e.g. size, dimension, finish). When a product has variants:

- A **variant selector** is shown on the product detail page.
- Each variant is a selectable option within the selector (not a separate page navigation).
- Selecting a variant updates the displayed article number, availability, and price without a full page reload.
- Each variant has its own SKU, availability, and price.
- The URL updates to reflect the selected variant (for linkability and SEO).

### 5.3 Price display

| State | Display |
|---|---|
| Logged-in, price returned | Price ex-VAT, NOK |
| Logged-in, Service API unavailable | "Price on request" |
| Anonymous | Price field not shown |

No quantity-break or tiered pricing in Phase 1.

### 5.4 Availability display

| State | Display |
|---|---|
| Logged-in, in stock | "På lager" (In stock) |
| Logged-in, out of stock | "Ikke på lager" (Out of stock) |
| Anonymous | Availability not shown |

Availability is per-variant when the product has variants.

---

## 6. Navigation and breadcrumbs

- A breadcrumb trail is shown on all category and product detail pages, reflecting the full category path.
- Breadcrumb levels are clickable links back to the respective category listing pages.
- The breadcrumb follows the category hierarchy synced from RamBase/Struct.
- Top-level navigation (mega menu, header links) is driven by Sanity and the category hierarchy — see [I-5 Content sync](content-sanity-spec.md).

---

## 7. SEO

- Each category listing page and product detail page has a unique URL based on the category/product slug.
- The URL includes the full category path for product pages (e.g. `/produkter/[kategori]/[produktnavn]`).
- Variant selection updates the URL so individual variants are linkable and indexable.
- Page `<title>` and meta description are populated from Struct enrichment data.
- Canonical tags are used to avoid duplicate content across variant URLs.

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Storefront catalog browsing UX | Build and configure | Validate behavior against requirements |
| Product data and enrichment | Configure Harmony sync | Maintain product data in RamBase; enrich in Struct |
| Product names | Configure Struct-name sync | Set product names in Struct |
| Product assets | Configure asset sync from Struct | Upload assets in Struct |
| Inventory sync | Configure Harmony Inventory Sync | Provide RamBase inventory data |
| Availability display logic | Implement in stock / out of stock display | Confirm acceptable display labels |
| Price display and degradation | Implement via Service API + fallback | Confirm "Price on request" wording |
| Editorial content on category pages | Content model + integration | Author content in Sanity |
| SEO (URL structure, metadata) | Implement | Review and validate |
| Variant selector | Implement | Define variant dimensions per product in Struct |

---

## 9. Open questions

| Question | Status |
|---|---|
| Page size (products per listing page) | Mosaik platform default — confirm during implementation |
| Exact Norwegian wording for availability labels | "På lager" / "Ikke på lager" — confirm with Pretec |
| Exact Norwegian wording for "Price on request" | Confirm with Pretec |
| Search and filtering behavior | Specified separately in [F-2](search-filtering-spec.md) |

---

## 10. Related specs

- [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) — I-1 product master data sync
- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 Struct → Storefront Catalog
- [inventory-sync-spec.md](inventory-sync-spec.md) — I-3 inventory sync
- [search-filtering-spec.md](search-filtering-spec.md) — F-2 search and filtering
- [content-sanity-spec.md](content-sanity-spec.md) — I-5 editorial content and navigation
- [customer-sync-spec.md](customer-sync-spec.md) — I-4 anonymous vs logged-in user rules
