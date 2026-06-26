# Inventory Sync Specification — RamBase to Storefront Catalog via Harmony

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Synchronizing inventory / availability from RamBase to the Storefront Catalog via Harmony
**Index ref:** [spec-index.md](spec-index.md) → I-3
**Related:** [I-2 Catalog publish](catalog-publish-spec.md) · [F-1 Catalog browsing](catalog-browsing-spec.md)

---

## 1. Purpose

This specification defines how inventory and availability data flows from **RamBase** to the **Mosaik Storefront Catalog** via Harmony Inventory Sync, and how that data is presented to users.

```
RamBase (stock / availability)
        │
        ▼
Mosaik Harmony — Inventory Sync (scheduled, every 10 min)
        │
        ▼
Mosaik Storefront Catalog
        │
        ▼
Storefront — availability display (logged-in users only)
```

Inventory sync is a **separate Harmony sync** from the Catalog Sync (I-2). Product data and inventory data travel independently; an inventory update does not require a full catalog re-sync.

---

## 2. Systems and roles

| System | Role |
|---|---|
| **RamBase** | Source of truth for stock and availability |
| **Mosaik Harmony — Inventory Sync** | Reads RamBase stock fields, maps to the Storefront catalog availability model, publishes on schedule |
| **Mosaik Storefront Catalog** | Stores per-product/per-variant availability state for fast storefront rendering |
| **Storefront** | Displays availability to logged-in users; hides it from anonymous users |

---

## 3. Display model

Availability is shown as a **binary in-stock / out-of-stock indicator** — no exact quantities, no low-stock band.

| State | Display label | Shown to |
|---|---|---|
| Available quantity > 0 | "På lager" (In stock) | Logged-in users only |
| Available quantity = 0 | "Ikke på lager" (Out of stock) | Logged-in users only |
| Anonymous user | *(nothing shown)* | — |

The exact Norwegian wording ("På lager" / "Ikke på lager") is subject to confirmation with Pretec. See [F-1 §5.4](catalog-browsing-spec.md).

Availability is per-variant when the product has variants — each variant has its own stock state.

---

## 4. RamBase stock field

The stock figure used to determine availability (on-hand, available-to-promise, or a composite field) is **configured during integration setup** based on what RamBase exposes as the canonical available-quantity field for Pretec's environment.

Similarly, **multi-warehouse handling** (whether to aggregate across locations or use a single primary location) is determined during integration setup to match Pretec's RamBase warehouse configuration.

Geta configures the Harmony Inventory Sync against the field(s) confirmed by Pretec at that point. The binary threshold (quantity > 0 = in stock) is fixed.

> **Action for Pretec:** Confirm the RamBase field name and warehouse scope that should drive availability during Harmony Inventory Sync configuration.

---

## 5. Sync frequency and staleness

| Property | Value |
|---|---|
| Sync cadence | Every 10 minutes (scheduled) |
| Initial full sync | On first deployment and on demand |
| Delta sync | Every 10 minutes — only changed products |
| Maximum staleness | ~10 minutes from a stock change in RamBase |

The 10-minute cadence matches the standard Harmony interval and aligns with the Catalog Sync (I-2) and Customer Sync (I-4). Stock changes in RamBase are reflected in the Storefront within approximately 10 minutes.

The 10-minute staleness window is acceptable for a B2B context where orders are fulfilled as quote-to-order requests, not instant e-commerce transactions. Availability is a purchasing signal, not a real-time reservation guarantee.

---

## 6. Out-of-stock behavior

Showing a product as "Ikke på lager" does **not** block the user from adding it to cart or submitting a quote. The out-of-stock state is informational — Pretec Sales handles stock and fulfilment decisions in RamBase.

See [F-4 Cart UX §3.3](cart-ux-spec.md) for cart behavior on out-of-stock items.

---

## 7. Sync failure behavior

If the Inventory Sync fails for a product, the last successfully synced availability state is retained in the Storefront Catalog. The product continues to show its previous in-stock/out-of-stock status until the next successful sync.

- A sync failure for one product must not block inventory updates for other products.
- Failures are logged with product ID, reason, and timestamp.
- Errors are visible in the Harmony/Maestro operations view.
- After the underlying issue is resolved, the next scheduled sync restores the correct state automatically.

If the entire Inventory Sync is unavailable for an extended period, stale availability data remains visible rather than hiding availability across the site.

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony Inventory Sync configuration | Configure sync, field mapping, schedule, error handling | Confirm RamBase availability field and warehouse scope |
| Stock field selection | Implement based on confirmed field | Confirm which RamBase field represents available quantity |
| Multi-warehouse scope | Implement based on confirmed scope | Confirm whether to aggregate all warehouses or use primary location |
| Display labels | Implement "På lager" / "Ikke på lager" display | Confirm Norwegian wording |
| Sync operations | Monitor technical failures; provide alerting | Triage data-quality issues and unexpected stock values |

---

## 9. Open questions

| Question | Status |
|---|---|
| RamBase available-quantity field name and warehouse scope | Confirm with Pretec during Harmony Inventory Sync setup |
| Exact Norwegian availability labels | "På lager" / "Ikke på lager" — confirm with Pretec |
| Acceptable staleness window | 10 minutes assumed — confirm with Pretec if a tighter window is required |

---

## 10. Related specs

- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 product and category catalog sync (separate from inventory)
- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 availability display on listing and detail pages
- [cart-ux-spec.md](cart-ux-spec.md) — F-4 out-of-stock cart behavior
- [harmony-sync-spec.md](harmony-sync-spec.md) — C-1 Harmony engine configuration (cross-cutting)
- [rambase-api-integration-spec.md](rambase-api-integration-spec.md) — I-6 RamBase auth and query model
