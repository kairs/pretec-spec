# Product Integration Specification — RamBase to Struct via Harmony

**Date:** 2026-06-19  
**Status:** Draft for customer review  
**Audience:** Pretec and Geta  
**Scope:** Product and category data flow between RamBase and Struct using Mosaik Harmony

---

## 1. Purpose

This specification describes how product data moves from **RamBase** to **Struct** using **Mosaik Harmony** as the integration service.

The goal is to define the responsibility split between RamBase, Struct, and Harmony before detailed field mapping and implementation begin.

This document focuses on the product enrichment flow:

```text
RamBase Product / Category
        |
        v
Mosaik Harmony Product + Category Sync
        |
        v
Struct PIM
```

Publishing enriched product data from Struct onward to the storefront catalog is related, but covered as a downstream catalog sync concern.

---

## 2. Systems And Roles

| System | Role |
|---|---|
| **RamBase** | Source of truth for product master data, product IDs/SKUs, categories, and commercial/ERP-controlled product attributes |
| **Mosaik Harmony** | Integration service that reads product/category data from RamBase, transforms it, and sends it to Struct |
| **Struct** | PIM where Pretec enriches product information, product assets, and commerce/catalog presentation fields |
| **Mosaik Storefront / Catalog** | Downstream consumer of enriched catalog data from Struct |

---

## 3. Ownership Principles

### RamBase Owns Master Data

RamBase remains the authoritative source for ERP-controlled product data:

- Product ID / SKU
- Product name where maintained in ERP
- Product status / active flag
- Product type
- Units of measure
- Product classification or category source data
- Inventory-relevant identifiers
- Any fields required for pricing, cart, quote, order, or fulfilment integration

These fields should not be manually overwritten in Struct unless explicitly agreed.

### Struct Owns Enrichment

Struct owns the product information that is needed for a high-quality storefront experience:

- Rich product descriptions
- Product images and documents
- Product attributes used for browsing and filtering
- SEO metadata
- Display names where separate from ERP product names
- Product relationships and merchandising data
- Editorial/commercial enrichment fields

### Harmony Owns Integration Logic

Harmony is responsible for:

- Reading products and categories from RamBase
- Mapping RamBase fields to the agreed Struct model
- Creating or updating products in Struct
- Preserving Struct-owned enrichment fields
- Reporting sync failures and data-quality issues

---

## 4. Product Lifecycle

### 4.1 New Product

1. Product is created in RamBase.
2. Harmony detects the product during scheduled or triggered sync.
3. Harmony creates the corresponding product in Struct.
4. Pretec enriches the product in Struct.
5. The enriched product becomes available for downstream catalog publishing.

### 4.2 Product Update

1. ERP-controlled fields are updated in RamBase.
2. Harmony syncs the changed fields to Struct.
3. Struct-owned enrichment fields are preserved.
4. Downstream catalog sync picks up the changed product when applicable.

### 4.3 Product Deactivation

1. Product is deactivated or made unavailable in RamBase.
2. Harmony syncs the status change to Struct.
3. Struct and downstream catalog decide whether the product is hidden, unpublished, or shown as unavailable according to agreed business rules.

The exact deactivation behavior is an open decision for Pretec.

---

## 5. Category Lifecycle

Categories originate in RamBase and are synced to Struct through Harmony.

Struct may enrich categories with:

- Display names
- Category descriptions
- Images or banners
- SEO metadata
- Navigation-specific settings

Open decision: confirm whether RamBase is the full source of the category tree, or whether Struct may create storefront-only categories for merchandising.

---

## 6. Field Ownership Model

The detailed field mapping must be completed before implementation. The starting ownership model is:

| Field Type | Source of Truth | Notes |
|---|---|---|
| Product ID / SKU | RamBase | Stable key used across Struct, catalog, pricing, cart, quote, and orders |
| Product name | RamBase or Struct | Needs confirmation: ERP name as display name, or Struct display override |
| Product status | RamBase | Controls whether product is available for catalog publishing |
| Product type / classification | RamBase | May drive category or filtering rules |
| Unit of measure | RamBase | Needed for cart and quote line items |
| Category assignment | RamBase | Struct may enrich category presentation |
| Short/long description | Struct | Storefront-facing enrichment |
| Images and media | Struct | Product assets managed in PIM |
| Technical attributes | Struct, seeded from RamBase where available | Needs field-by-field mapping |
| SEO title/description | Struct | Storefront-facing metadata |
| Price | RamBase | Not synced through this product flow; fetched live for logged-in users |
| Inventory | RamBase | Synced separately to the storefront/catalog flow |

---

## 7. Sync Direction

The Phase 1 product integration is one-way:

```text
RamBase -> Harmony -> Struct
```

Struct enrichment does not write product master data back to RamBase.

Downstream publishing from Struct to the Storefront catalog is a separate sync:

```text
Struct -> Harmony / Catalog Sync -> Storefront Catalog
```

---

## 8. Sync Frequency

The sync frequency is still open.

Options to confirm with Pretec:

- Scheduled sync, for example hourly or nightly
- More frequent scheduled sync for product status and category changes
- Event-driven or near-real-time sync if RamBase and Harmony support it

Recommendation for Phase 1: start with scheduled sync unless Pretec has a business requirement for near-real-time product updates.

---

## 9. Error Handling

Harmony should report product sync failures clearly enough for Geta and Pretec to identify the affected product and reason.

Typical failure categories:

- Missing required product key
- Invalid category reference
- Invalid or unsupported field value
- Product cannot be created or updated in Struct
- RamBase API unavailable
- Struct API unavailable

Expected behavior:

- A failed product should not block all other products from syncing.
- Failures should be logged with enough context to retry or correct data.
- Re-running the sync after data correction should update the product without manual cleanup where possible.

Alerting and ownership of operational follow-up still need confirmation.

---

## 10. Data Quality Rules

Before product data can be reliably synced, Pretec and Geta should agree minimum product requirements.

Suggested minimum requirements:

- Product has a stable SKU / product ID
- Product has an active/inactive status
- Product has a name
- Product has a valid category or classification if category browsing depends on it
- Product has a unit of measure if it can be added to cart
- Product is marked as web/catalog eligible if not every RamBase product should appear online

Open decision: confirm the RamBase field that determines whether a product should be published to the storefront.

---

## 11. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony configuration | Configure sync, mapping, transformations, and error handling | Review and approve mapping |
| RamBase product data | Consume through integration | Own product master data and data quality |
| Struct product model | Configure target model and mapping with Pretec | Confirm enrichment fields and editorial ownership |
| Product enrichment | Support model/workflow | Enrich products in Struct |
| Data validation | Report sync/data issues | Correct source data where needed |
| Sync operations | Monitor technical failures | Confirm business impact and data corrections |

---

## 12. Open Decisions

The following items must be confirmed before detailed implementation:

- Which RamBase product endpoint(s) and fields are used for product export
- Which RamBase category/classification structure should become the storefront category tree
- Whether Struct may create storefront-only categories
- Which RamBase field marks a product as web/catalog eligible
- Whether RamBase product name is the storefront display name or whether Struct owns display name
- Required Struct product attributes for listing, filtering, and product detail pages
- Sync frequency and whether near-real-time sync is required
- Product deactivation behavior in Struct and the storefront
- Operational owner for sync failure follow-up
- Initial product volume and expected daily change volume

---

## 13. Success Criteria

This integration is successful when:

- Products created or updated in RamBase are created or updated in Struct by Harmony.
- RamBase-owned fields stay controlled by RamBase.
- Struct-owned enrichment fields are preserved during RamBase updates.
- Category assignments are available in Struct for catalog organization.
- Product sync failures are visible, actionable, and retryable.
- The enriched Struct product data can be used by the downstream storefront catalog sync.

