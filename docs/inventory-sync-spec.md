# Inventory Sync Specification — RamBase to Storefront Catalog via Harmony

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Synchronizing inventory / availability from RamBase to the Storefront Catalog
**Index ref:** [spec-index.md](spec-index.md) → I-3

---

## 1. Purpose

Define how inventory / availability data flows from **RamBase** to the **Storefront Catalog** via Harmony,
and how availability is presented to anonymous and logged-in users.

```text
RamBase (stock) -> Harmony / Inventory Sync -> Storefront Catalog
```

---

## 2. Systems and roles

| System | Role |
|---|---|
| **RamBase** | Source of truth for stock / availability |
| **Mosaik Harmony** | Inventory Sync — reads RamBase stock, maps, publishes |
| **Storefront Catalog** | Displays availability |

---

## 3. To specify

- [ ] Which RamBase stock figure(s) are used (on-hand, available-to-promise, per warehouse?)
- [ ] Display model — exact quantity vs. in-stock/low/out-of-stock bands
- [x] Whether availability shows for anonymous users — **inventory is hidden for anonymous users; login required to see stock availability**
- [ ] Multi-warehouse / location handling (if any in Phase 1)
- [ ] Sync frequency — inventory changes faster than product data; near-real-time vs. scheduled
- [ ] Staleness tolerance and how stale stock is communicated
- [ ] Behavior on sync failure

## 4. Open decisions

- Is synced (cached) inventory acceptable, or must availability be live like price? (Phase 1 assumption:
  synced via Harmony, not live.)
- Acceptable inventory staleness window.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Inventory Sync config | Configure | Confirm source field & display rules |

## 6. Success criteria

- Stock changes in RamBase reflect in the catalog within the agreed window.
- Availability display matches agreed bands. Failures are visible and do not break browsing.
