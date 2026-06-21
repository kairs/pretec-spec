# Search & Filtering Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Product search, faceted filtering, and sorting on the Storefront
**Index ref:** [spec-index.md](spec-index.md) → F-2

---

## 1. Purpose

Define what powers search and filtering on the Storefront, which fields are searchable/filterable, and the
expected behavior — an open question carried from both overview specs.

---

## 2. To specify

- [ ] Search engine / mechanism (Mosaik built-in search service vs. other) — see
      `search-catalog-public` in [Mosaik contracts](superpowers/research/mosaik-platform-contracts.md)
- [ ] Searchable fields (name, SKU, description, attributes)
- [ ] Facets / filters (category, attributes, availability) and which catalog fields drive them
- [ ] Sorting options
- [ ] Whether prices are searchable/sortable (note: price is live, not synced — likely not sortable)
- [ ] Autocomplete / suggestions
- [ ] Search for anonymous vs. logged-in users
- [ ] Indexing — what feeds the index and how it stays current (ties to [I-2 Catalog publish](catalog-publish-spec.md))

## 3. Open decisions

- Confirm with Pretec the required search/filter behavior and priority fields.
- Faceting source fields depend on Struct enrichment ([product spec §12](product-rambase-struct-harmony-spec.md)).

## 4. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Search config & UX | Configure & build | Confirm requirements & fields |

## 5. Success criteria

- Users can find products by the agreed search terms and narrow results with the agreed facets.
- Index reflects catalog changes within the agreed window.
