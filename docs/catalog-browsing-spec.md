# Catalog & Product Browsing Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of overview §5.1
**Audience:** Pretec and Geta
**Scope:** Storefront catalog browsing — listing pages, product detail, anonymous browsing
**Index ref:** [spec-index.md](spec-index.md) → F-1
**Consolidates:** [overview §5.1](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) + [customer-overview §4.1](customer-overview-spec.md)

---

## 1. Purpose

Promote the catalog/product capability into its own spec covering the storefront browsing experience that
sits on top of the synced catalog data.

Depends on: [I-2 Catalog publish](catalog-publish-spec.md), [I-3 Inventory](inventory-sync-spec.md),
[F-2 Search & filtering](search-filtering-spec.md), [F-3 Pricing display](spec-index.md).

---

## 2. To specify

- [ ] Listing / category page layout & pagination
- [ ] Product detail page content (Struct enrichment + Sanity editorial + live price + inventory)
- [ ] Anonymous browsing — catalog visible, **no prices, no inventory, no cart**
- [ ] Availability display rules (from [I-3](inventory-sync-spec.md))
- [ ] Price display & "price on request" degradation (from [F-3](spec-index.md))
- [ ] Variants / related products
- [ ] Breadcrumbs / navigation (ties to content/navigation in [I-5](content-sanity-spec.md))
- [ ] SEO (URLs, metadata)

## 3. Open decisions

- Search/filtering specifics — see [F-2](search-filtering-spec.md).
- Product display-name ownership (RamBase vs. Struct) — see [product spec §6](product-rambase-struct-harmony-spec.md).

## 4. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Browsing UX | Build & configure | Provide product/category data & enrichment |

## 5. Success criteria

- Anonymous and logged-in users can browse categories and product detail pages.
- Enrichment and editorial render for all users; availability and prices are only shown to logged-in users.
