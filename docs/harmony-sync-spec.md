# Harmony Sync Configuration Specification

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Cross-cutting configuration of the Mosaik Harmony sync engine across all Pretec sync flows
**Index ref:** [spec-index.md](spec-index.md) → C-1
**Cross-cuts:** [I-1](product-rambase-struct-harmony-spec.md) · [I-2](catalog-publish-spec.md) · [I-3](inventory-sync-spec.md) · [I-4](customer-sync-spec.md)

---

## 1. Purpose

This specification defines how the Mosaik Harmony engine is configured for Pretec — the shared mechanics (frequency, load strategy, conflict handling, error handling, and monitoring) that apply across all sync flows.

Mosaik **provides** the Harmony engine. Geta **configures** it for Pretec. The individual integration specs (I-1 through I-4) define what is synced; this document defines how.

---

## 2. Sync flows at a glance

| Flow | Direction | Mechanism | Cadence | Spec |
|---|---|---|---|---|
| **I-1** Product & Category | RamBase → Struct | Scheduled delta | Every 10 min | [I-1](product-rambase-struct-harmony-spec.md) |
| **I-2** Catalog publish | Struct → Storefront Catalog | Scheduled delta | Every 10 min | [I-2](catalog-publish-spec.md) |
| **I-3** Inventory | RamBase → Storefront Catalog | Scheduled delta | Every 10 min | [I-3](inventory-sync-spec.md) |
| **I-4** Customer sync | RamBase → Mosaik | Scheduled delta | Every 10 min | [I-4](customer-sync-spec.md) |
| **I-5** Content (Sanity) | Sanity → Storefront | Webhook (not Harmony) | Near-real-time | [I-5](content-sanity-spec.md) |

All Harmony-managed flows run on the same 10-minute scheduled cadence. Content (I-5) uses Sanity's own webhook mechanism and is not a Harmony sync.

---

## 3. Scheduled cadence

Every Harmony sync runs on a **10-minute schedule**:

1. Harmony polls or reads changes from the source system since the last successful sync.
2. Changed and new records are mapped and written to the target system.
3. The sync completes and the schedule resets.

The 10-minute window is the maximum expected lag between a change at source and its reflection in the Storefront. In practice, many changes land within the first few minutes of the cycle.

---

## 4. Initial full load vs. delta sync

### 4.1 Initial full load

On first deployment (and on demand for a full resync), Harmony performs a **full load** of each flow:

| Flow | Initial load scope |
|---|---|
| I-1 Product & Category | All active products and categories from RamBase |
| I-2 Catalog publish | All "Published for web" products and categories from Struct |
| I-3 Inventory | All product availability records from RamBase |
| I-4 Customer sync | All active customers and users from RamBase |

Full loads run once at go-live and are retriggered on demand (e.g. after a data correction or environment reset). They may take longer than a delta sync depending on product volume.

### 4.2 Delta sync

After the initial load, every subsequent run is a **delta sync** — only records created, updated, or deleted since the previous successful sync are processed. This keeps the 10-minute cycle lightweight.

---

## 5. Conflict handling

Each sync flow has a defined **system of record** that wins on conflict:

| Flow | System of record | Rule |
|---|---|---|
| I-1 Product & Category | RamBase | RamBase-owned fields (SKU, status, UoM, category) overwrite Struct on sync. Struct-owned enrichment fields (descriptions, images, display name) are preserved. |
| I-2 Catalog publish | Struct | Struct is authoritative for catalog-ready data. Storefront catalog is overwritten on sync. |
| I-3 Inventory | RamBase | RamBase stock data overwrites Storefront availability on every sync. |
| I-4 Customer sync | RamBase | RamBase customer data is authoritative. Mosaik platform data is updated to match. |

No sync flow writes back to RamBase (all flows are one-directional in Phase 1).

---

## 6. Error handling

### 6.1 Partial failure isolation

A failure on one record (product, customer, inventory item) **must not block** the sync of other records in the same run. Each record is processed independently; a bad record is skipped and logged while the rest of the batch completes.

### 6.2 Retry on next cycle

Failed records are **automatically retried** on the next scheduled cycle. No manual intervention is required to retry — correcting the source data (in RamBase or Struct) is sufficient for the next sync to succeed.

### 6.3 Failure logging

Every sync failure is logged with:
- Record identifier (product ID, customer ID, etc.)
- Failure reason
- Timestamp
- Source and target system

Logs are accessible in the Harmony / Maestro operations view.

### 6.4 Common failure causes

| Cause | Likely flow |
|---|---|
| Missing required field (SKU, name) | I-1, I-2 |
| Invalid category reference not yet synced | I-1, I-2 |
| Invalid or missing asset reference | I-2 |
| RamBase API unavailable | I-1, I-3, I-4 |
| Struct API unavailable | I-1, I-2 |
| Storefront Catalog API unavailable | I-2, I-3 |
| Mosaik platform API unavailable | I-4 |

---

## 7. Monitoring and alerting

Harmony sync health is monitored as part of the platform observability setup (see [X-3 Observability](observability-spec.md)).

| Concern | Coverage |
|---|---|
| Sync run success / failure | Logged in Harmony; visible in Maestro operations view |
| Persistent failures (same record failing across multiple cycles) | Alerted via observability pipeline |
| Sync lag (delta older than expected) | Monitored; alerted if a flow falls significantly behind |

### Operational ownership

| Type of failure | Owner |
|---|---|
| Technical failure (API down, network, configuration) | Geta — investigate and resolve |
| Data-quality failure (invalid field, missing value in source) | Pretec — correct source data in RamBase or Struct |

---

## 8. Volume expectations

Harmony is configured for Pretec's expected data volume. Volume estimates to confirm with Pretec before go-live:

| Data type | Expected volume (to confirm) |
|---|---|
| Products (RamBase) | Confirm total active product count |
| Products "Published for web" (Struct) | Confirm launch subset |
| Daily product changes (RamBase) | Confirm typical daily change rate |
| Customers | Confirm total active customer count |
| Inventory records | Confirm number of stocked SKUs |

High-volume initial loads are planned and scheduled outside of production peak hours.

---

## 9. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony engine | Provided by Mosaik platform | — |
| Sync configuration | Configure all flows, field mappings, schedules | Review and approve configurations |
| Initial full load planning | Schedule and execute | Confirm data readiness in RamBase and Struct before go-live |
| Monitoring and alerting setup | Configure in observability pipeline | Nominate operational contact for data-quality alerts |
| Technical failure response | Investigate and resolve | — |
| Data-quality failure response | Report failing records with reason | Correct source data and confirm correction |

---

## 10. Open questions

| Question | Status |
|---|---|
| Total product volume (active products in RamBase) | Confirm with Pretec before go-live |
| Expected daily product change rate | Confirm with Pretec before go-live |
| Operational contact at Pretec for sync failure alerts | Confirm with Pretec |
| Go-live timing for initial full load | Confirm during project planning |

---

## 11. Related specs

- [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) — I-1 product and category sync
- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 catalog publish sync
- [inventory-sync-spec.md](inventory-sync-spec.md) — I-3 inventory sync
- [customer-sync-spec.md](customer-sync-spec.md) — I-4 customer sync
- [content-sanity-spec.md](content-sanity-spec.md) — I-5 content sync (Sanity webhook, not Harmony)
- [observability-spec.md](observability-spec.md) — X-3 monitoring and alerting setup
- [environments-spec.md](environments-spec.md) — X-2 environment mapping (Harmony configured per environment)
