# Search & Filtering Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Product search, faceted filtering, and sorting on the Storefront
**Index ref:** [spec-index.md](spec-index.md) → F-2
**Depends on:** [F-1 Catalog browsing](catalog-browsing-spec.md) · [I-2 Catalog publish](catalog-publish-spec.md) · [I-3 Inventory sync](inventory-sync-spec.md)

---

## 1. Purpose

This specification defines how search and filtering works on the Pretec storefront — which fields are searchable, what filters and sort options are available, and how behavior differs between anonymous and logged-in users.

---

## 2. Search engine

Search is powered by the **Mosaik search-catalog service** (`search-catalog-public` API). The storefront uses three endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /search` | Full-text + faceted catalog search with pagination and sorting |
| `GET /facets` | Retrieve available facet values for a given query/context |
| `POST /aggregate-search` | Multi-context search (global search across category groups) |

The search index is populated from the Storefront Catalog, which is kept current by [I-2 Catalog publish](catalog-publish-spec.md). Index freshness follows the Harmony sync cadence.

---

## 3. Access — anonymous vs logged-in

| Capability | Anonymous | Logged-in (approved) |
|---|---|---|
| Use search | ✅ | ✅ |
| See search results (product name, SKU, description) | ✅ | ✅ |
| Filter by category | ✅ | ✅ |
| Filter by product attributes | ✅ | ✅ |
| Filter by availability (In stock / Out of stock) | ❌ | ✅ |
| Sort results | ✅ | ✅ |
| See prices in results | ❌ | ✅ |
| See availability in results | ❌ | ✅ |

---

## 4. Searchable fields

Full-text search matches across the following fields:

| Field | Source |
|---|---|
| Product name | Struct |
| Article number / SKU | RamBase |
| Product description | Struct |

Product attributes, categories, and prices are **not** part of the full-text search index. Attributes are exposed as filterable facets (see §5).

---

## 5. Filters and facets

### 5.1 Available filters

| Filter | Type | Shown to |
|---|---|---|
| Category | Category tree selection | All users |
| Product attributes (e.g. dimension, material, surface treatment) | Faceted — driven by Struct attribute fields | All users |
| Availability — In stock / Out of stock | Boolean toggle | Logged-in users only |

### 5.2 Facet configuration

Product attribute facets are driven by the enrichment fields set in Struct. The specific attributes exposed as facets (e.g. diameter, thread size, material, surface treatment) are configured during implementation based on the product data available in Struct.

Facet values are fetched dynamically via `GET /facets` scoped to the current search context (query text + active category). Only facet values that have matching products are shown — empty facet values are hidden.

### 5.3 Availability filter

- The **In stock / Out of stock** filter toggle is only shown to logged-in users, consistent with [F-1 §3](catalog-browsing-spec.md) which hides availability from anonymous users.
- When active, the filter passes `IsInStock: true` or `IsInStock: false` to the search endpoint.
- Availability data in the index comes from [I-3 Inventory sync](inventory-sync-spec.md).

---

## 6. Sorting

| Sort option | Available to | Notes |
|---|---|---|
| Newest first (creation date) | All — **default** | Applied when no sort is selected |
| Product name A–Z | All | Alphabetical on product name from Struct |

Sorting is applied via the `Sorting` parameter on `GET /search`. Price sorting is not supported — prices are live and not held in the search index.

---

## 7. Search results page

- Results are displayed in the same product card grid as category listing pages (see [F-1 §4.3](catalog-browsing-spec.md)).
- Pagination is page-based, matching [F-1 §4.2](catalog-browsing-spec.md).
- The active search query is shown above the results.
- Result count is shown (e.g. "24 produkter").
- When a search returns no results, a "no results" message is shown with a suggestion to broaden the search.
- Filters and sort controls are shown in a panel alongside or above the results grid.

---

## 8. Autocomplete

No autocomplete or search-as-you-type suggestions. Search is triggered on explicit submit (Enter key or search button).

---

## 9. Indexing and freshness

The search index is fed from the Storefront Catalog populated by [I-2 Catalog publish](catalog-publish-spec.md). Index currency follows the Harmony Catalog Sync cadence — changes to products or attributes in Struct appear in search results within the sync window. Specific indexing frequency and error handling are covered in [C-1 Harmony sync configuration](harmony-sync-spec.md).

---

## 10. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Search engine configuration | Configure Mosaik search-catalog service | — |
| Searchable field mapping | Map product name, SKU, description to search index | Maintain data quality in Struct |
| Facet configuration | Configure attribute facets based on Struct fields | Define and maintain product attributes in Struct |
| Availability filter wiring | Wire `IsInStock` filter to inventory data | Provide inventory data via RamBase |
| Sort options | Implement sort UI and API params | Confirm sort options |
| Search UX | Build search results page and filter panel | Review and validate |

---

## 11. Open questions

| Question | Status |
|---|---|
| Specific product attribute fields to expose as facets | Confirm during Struct enrichment setup — depends on attribute schema agreed in [I-1](product-rambase-struct-harmony-spec.md) |

---

## 12. Related specs

- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 listing pages and product cards
- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 Struct → Storefront Catalog (search index source)
- [inventory-sync-spec.md](inventory-sync-spec.md) — I-3 inventory data powering the availability filter
- [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) — I-1 product attributes in Struct
- [harmony-sync-spec.md](harmony-sync-spec.md) — C-1 sync cadence and index freshness
