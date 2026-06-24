# Resilience & Error Handling Specification

**Date:** 2026-06-24
**Status:** Written
**Audience:** Pretec and Geta
**Scope:** Dependency resilience, timeout/retry behaviour, graceful degradation, and error handling across the platform
**Index ref:** [spec-index.md](spec-index.md) → X-4
**Consolidates:** [Service API §6](superpowers/specs/2026-06-08-pretec-service-api-design.md) + [customer-overview §5.3](customer-overview-spec.md)

---

## 1. Purpose & dependency model

Define how the platform behaves when its dependencies are slow or unavailable, so failures degrade
gracefully and are never silently dropped.

**RamBase is a hard runtime dependency** for the *live* operations — per-user **price**, **quote
submission**, and **order/invoice query** (My Page) all call RamBase (via the Pretec Service API) in real
time. This is the platform's primary resilience risk.

By contrast, **synced data is resilient by design.** Catalog, categories, **inventory**, and customer data
are copied into the Storefront via Harmony (see [I-1](product-rambase-struct-harmony-spec.md),
[I-3](inventory-sync-spec.md), [I-4](customer-sync-spec.md)). They are served from the Storefront's own
copy, so a live RamBase outage does **not** take down browsing or inventory display — it only affects the
live calls above.

---

## 2. Timeout & retry policy

| Call type | Examples | Timeout | Retry |
|---|---|---|---|
| **Idempotent reads** | Price lookup, orders/invoices query | **~3s** | **1 retry** |
| **Writes** | Quote submission | **~3s** | **No automatic retry** (see §6) |

- Reads are safe to retry once on a transient failure; writes are not retried automatically to avoid
  duplicate side effects in RamBase.
- After the timeout (and the single read retry) is exhausted, the call fails and the capability degrades
  per §4 — it does **not** hang the page.

---

## 3. Circuit breaker — not in Phase 1

No circuit breaker is used in Phase 1; resilience relies on the **timeout + single-retry** policy above
plus the degradation in §4.

- **Rationale:** keeps the runtime simple; worst-case a failing live call resolves in a few seconds and
  then degrades (e.g. price → "price on request") while the synced catalog stays fully usable.
- **Revisit trigger:** if a sustained RamBase outage causes request pile-up or latency problems in
  practice, add a breaker that fast-fails to degraded mode with an auto half-open probe. Tracked as an
  accepted risk in §8.

---

## 4. Graceful degradation by capability

| Capability | Live dependency | If RamBase slow/unavailable | User-facing behaviour |
|---|---|---|---|
| **Catalog browse (PLP/PDP)** | none (synced) | Unaffected | Catalog fully usable |
| **Inventory status** | none (synced via Harmony) | Served from last sync (may be slightly stale) | Availability still shown |
| **Price (live)** | RamBase via Service API | Times out → fails after 1 retry | Degrade to **"price on request"**; catalog still usable |
| **Cart (add/edit)** | Service-owned MongoDB | Cart ops unaffected (prices not stored as truth, fetched for display) | Cart usable; price display degrades to "price on request" |
| **Quote submission** | RamBase write | Fails | **Clear, retryable error — never silently dropped** (§6) |
| **My Page (orders/invoices)** | RamBase read (Query) | Fails after 1 retry | Clear error with a retry action; read-only, no stale cache in Phase 1 |
| **Login / customer resolution** | identity provider + Mosaik mapping | Lookup fails | Clear "try again"; an authenticated user with **no mapping** gets a clear "not onboarded" state, **never a 500** (see [A-1](authentication-spec.md)) |

---

## 5. Catalog / price decoupling (preferred pattern)

The storefront renders the **catalog without prices first** (from synced catalog data — fast, no RamBase
dependency), then **fetches prices afterward from the frontend** (client-side batch price calls once the
page has rendered).

- The catalog stays usable even when pricing is slow or unavailable.
- Prices fill in progressively and **degrade to "price on request"** when a price cannot be resolved.
- This pattern is what makes the §4 price degradation non-blocking.

---

## 6. Quote submission safety

Quote submission is the one write path and must never silently drop a customer's request.

- On failure it returns a **clear, retryable error**; the user retries manually.
- **Phase 1 has no idempotency key** and no automatic write retry.
- **Accepted risk:** a manual retry after an ambiguous failure could create a **duplicate quote** in
  RamBase. This is tolerated in Phase 1 because submissions are **request-for-quotes** (not confirmed
  orders): a Pretec sales rep reviews each quote before converting it and will spot a duplicate.
- **Mitigation / revisit:** the checkout UI should present a single, clearly-stated submit action and
  disable it while a submission is in flight. If duplicates occur in practice, introduce a per-submission
  **idempotency key** so a resubmit cannot create a second RamBase quote (tracked in §8).

---

## 7. Error-handling principles

- **Never fail silently** — every failed live call surfaces a clear, user-appropriate message.
- **Distinguish known states from faults** — expected conditions (no price → "price on request"; no
  customer mapping → "not onboarded"; anonymous → login required) are first-class states, **not** errors,
  and never return a 500.
- **Degrade, don't block** — a failing live dependency must never make the catalog or cart unusable.
- **Make retryable failures obviously retryable** — give the user (or, for reads, the system) a clear path
  to try again.
- Operational visibility of failures (RamBase unreachable, sync failures) is covered by
  [X-3 Observability](observability-spec.md); note X-3 alerts on **hard failures**, while transient
  degradation is dashboard-only.

---

## 8. Open items & accepted risks

- **Accepted (Phase 1):** no circuit breaker (§3); no quote idempotency key, with duplicate-quote risk
  mitigated by sales review (§6). Both have explicit revisit triggers.
- **Open:** none blocking — timeout/retry values (§2) are set for Phase 1 and can be tuned with real
  latency data (ties to future SLOs in [X-3 §7](observability-spec.md)).

---

## 9. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Resilience implementation | Build timeout/retry, degradation, decoupled price fetch, error handling | Confirm acceptable degraded UX ("price on request") |
| Operational response | Monitor & first-respond to RamBase/infra failures (per X-3) | Triage business-facing degradation |

---

## 10. Success criteria

- A RamBase slowdown/outage leaves the catalog and cart usable; prices degrade to "price on request"
  rather than blocking the page.
- Inventory remains visible from the last sync during a live RamBase outage.
- Quote submission never silently drops; failures are clearly retryable.
- No live-call failure produces a hung page or an unexpected 500 for a known state.
