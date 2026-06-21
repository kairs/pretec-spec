# Catalog Publish Specification — Struct to Storefront Catalog via Harmony

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Publishing enriched product & category data from Struct to the Mosaik Storefront Catalog
**Index ref:** [spec-index.md](spec-index.md) → I-2
**Related:** [Product Integration (RamBase → Struct)](product-rambase-struct-harmony-spec.md) — the upstream half of this flow

---

## 1. Purpose

Define how enriched product and category data flows **from Struct to the Storefront Catalog** via Mosaik
Harmony's Catalog Sync. The [product integration spec](product-rambase-struct-harmony-spec.md) stops at
`RamBase → Struct`; this document covers the downstream half:

```text
Struct (enriched PIM) -> Harmony / Catalog Sync -> Storefront Catalog
```

---

## 2. Systems and roles

| System | Role |
|---|---|
| **Struct** | Source of enriched, catalog-ready product & category data + assets |
| **Mosaik Harmony** | Catalog Sync — reads Struct, maps to the Storefront catalog model, publishes |
| **Mosaik Storefront / Catalog** | Consumer; renders listing, detail, navigation |

---

## 3. To specify

- [ ] Which Struct fields map to which Storefront catalog fields (field-by-field mapping)
- [ ] Publish trigger: what makes a product/category eligible and "published"
- [ ] Asset handling — images/documents from Struct to the catalog/CDN
- [ ] Category tree shape in the catalog and how it derives from Struct/RamBase
- [ ] Variant / product relationship handling
- [ ] Unpublish / deactivation behavior (hide vs. unpublish vs. show unavailable)
- [ ] Sync frequency and initial vs. delta loads
- [ ] Error handling and data-quality gates

## 4. Open decisions

- Carried from [product spec §12](product-rambase-struct-harmony-spec.md): web/catalog-eligible flag,
  display-name ownership, required attributes for listing/filtering.
- Relationship to **Search & filtering** ([F-2](search-filtering-spec.md)) — what catalog fields feed search.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Catalog Sync config & mapping | Configure | Approve mapping |
| Enrichment quality in Struct | Support model | Own enrichment |

## 6. Success criteria

- Enriched products/categories in Struct appear correctly in the Storefront catalog.
- Assets render. Publish/unpublish rules behave as agreed. Failures are visible and retryable.
