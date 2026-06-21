# Harmony Sync Configuration Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Cross-cutting configuration of the Mosaik Harmony sync engine
**Index ref:** [spec-index.md](spec-index.md) → C-1
**Cross-cuts:** [I-1 Product/Category](product-rambase-struct-harmony-spec.md), [I-2 Catalog publish](catalog-publish-spec.md), [I-3 Inventory](inventory-sync-spec.md), [I-4 Customer sync](flows-customer-sync.md)

---

## 1. Purpose

Define how the Mosaik Harmony engine is configured for Pretec across all sync flows — the foundational
config behind the individual integration specs. Mosaik **provides** the engine; **Geta configures** it.

---

## 2. To specify (applies to all syncs)

- [ ] Sync mechanism — event-driven vs. scheduled per flow
- [ ] Frequency per flow (product, category, catalog, inventory, customer)
- [ ] Initial / full load vs. delta load strategy
- [ ] Direction & conflict handling (which system wins)
- [ ] Error handling, retry, and partial-failure isolation
- [ ] Monitoring, alerting, and operational ownership of failures
- [ ] Throughput / volume expectations (initial + daily change volume)

## 3. Per-flow summary (to fill in)

| Flow | Direction | Mechanism | Frequency | Spec |
|---|---|---|---|---|
| Product & Category | RamBase → Struct | ? | ? | [I-1](product-rambase-struct-harmony-spec.md) |
| Catalog publish | Struct → Storefront | ? | ? | [I-2](catalog-publish-spec.md) |
| Inventory | RamBase → Storefront | ? | ? | [I-3](inventory-sync-spec.md) |
| Customer | RamBase → Mosaik | scheduled | ? | [I-4](flows-customer-sync.md) |

## 4. Open decisions

- Carried from [overview §7](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md): sync
  mechanism, frequency, direction, conflict/error handling, initial vs. delta loads.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony configuration | Configure all flows | Provide system access & mapping rules |
| Operational follow-up | Monitor technical failures | Correct source data |

## 6. Success criteria

- All sync flows run on agreed schedules/triggers with isolated, visible, retryable failures.
- Volume and freshness expectations are met.
