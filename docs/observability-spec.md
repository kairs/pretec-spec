# Observability & Monitoring Specification

**Date:** 2026-06-24
**Status:** Written
**Audience:** Pretec and Geta
**Scope:** Telemetry, monitoring, alerting, and operational ownership across the platform
**Index ref:** [spec-index.md](spec-index.md) → X-3
**Consolidates:** [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose & baseline

This spec promotes observability into a platform-wide concern rather than a Service-API-only one.

The baseline, established in [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md),
is **OpenTelemetry (OTEL)** for traces, metrics, and logs, visualized in **Grafana**. This document
keeps that baseline and adds: what is instrumented across the platform, which dashboards exist and who
sees them, what triggers an alert, who responds, and how logs are retained.

**Phase 1 posture:** instrument broadly, alert narrowly (hard failures only), and commit to no numeric
SLO yet. The goal is that failures reach the right owner quickly and that the data needed to set real
targets is being collected from day one.

---

## 2. What is instrumented

All three signal types (traces, metrics, logs) are emitted via OTEL and shipped to Grafana. Coverage:

| Component | Traces | Metrics | Logs |
|---|---|---|---|
| **Pretec Service API** (Price, Cart, Quote, Query) | Request spans incl. outbound RamBase calls and MongoDB ops | Request rate, error rate, latency (p50/p95/p99) per endpoint; RamBase dependency health (timeouts, breaker state); Mongo connection health | Structured request/error logs, PII-safe (§6) |
| **Harmony syncs** (I-1…I-4) | Per-run trace where Harmony exposes it | Per-flow: last-successful-run timestamp, run duration, records processed, records failed, run outcome (success/failure) | Sync run summaries and failures |
| **Storefront** (Mosaik Next.js) | Page/API route spans where the starterkit supports it | Error rate, route latency, client-side error count | Application errors (no PII) |

RamBase dependency health is called out explicitly because it is the platform's primary external
dependency and the most likely source of degradation (see [Service API §6 Resilience](superpowers/specs/2026-06-08-pretec-service-api-design.md)).

---

## 3. Dashboards

Two audiences, two dashboards, both in Grafana:

- **Geta ops dashboard** — full technical view: Service API request/error/latency, RamBase dependency
  health and breaker state, MongoDB health, infra/resource saturation, and sync internals. Used for
  first response to infra and Service API failures.
- **Pretec business dashboard (read-only)** — sync-focused, business-legible view: per-flow sync status
  (I-1 products, I-2 catalog publish, I-3 inventory, I-4 customers), **last-successful-sync timestamp**
  per flow, and **failed-record counts**. Pretec is granted read-only access so they can triage
  business-facing sync issues during business hours.

---

## 4. Alerting

**Channels:** Grafana alert rules post to a dedicated **Slack** channel (e.g. `#pretec-alerts`), with
**email** as the fallback for critical alerts. No paging / on-call rotation in Phase 1.

**Phase 1 alerts on hard failures only.** Degradation (elevated latency, elevated error rate, resource
saturation) is visible on dashboards but does **not** alert in Phase 1 — it is revisited when numeric
SLOs are set (§7).

| Alert | Condition | Routed to | Owner |
|---|---|---|---|
| **Sync job failed** | A Harmony sync run (I-1…I-4) ends in failure | Slack (+ email if persistent) | Pretec (business hours), escalate to Geta for code-level cause |
| **Service API down** | Service API health check failing / unavailable | Slack + email | Geta |
| **RamBase unreachable** | RamBase auth failing or all calls timing out / breaker open | Slack + email | Geta |

Sync alerting sits at the Harmony boundary and is detailed alongside engine configuration in
[C-1 Harmony sync configuration](harmony-sync-spec.md).

---

## 5. Operational ownership

Phase 1 uses a **shared split**: Geta owns the technical platform, Pretec owns business-facing sync
triage, with escalation back to Geta for anything requiring code or infra changes.

| Area | Geta | Pretec |
|---|---|---|
| Instrumentation (OTEL) & dashboards | Build and maintain | — |
| Service API / infra failures | First responder | — |
| RamBase dependency failures | First responder | — |
| Business-facing sync issues (missing customer, wrong price, stale catalog) | Resolve code/infra root cause on escalation | First responder, business hours |
| Availability / target expectations | Implement & measure | Confirm expectations (informs future SLOs) |

**Escalation:** Pretec → Geta when a sync issue is not a data/business problem but a code- or infra-level
fault. Geta → Pretec when a failure requires a business decision (e.g. data correction, approval).

---

## 6. Logging & retention

- **Retention:** application, trace, and sync logs retained **~30 days** — enough for incident
  investigation without unbounded storage.
- **PII-safe logging:** identity-linked PII — customer names, emails, and prices tied to an identified
  customer — is **not** written to logs by policy. Logs use identifiers (e.g. customer/cart IDs), not
  personal data.
- **Authoritative source:** full PII handling, data-residency, and access-control rules are owned by
  [X-5 Security & Data Privacy](security-privacy-spec.md). This section states only the
  observability-facing logging policy; X-5 governs.

---

## 7. Open decisions

- **Numeric SLOs deferred.** Phase 1 commits to **no** numeric availability/latency target. Monitoring
  and hard-failure alerting are in place; numeric targets (and the degradation alerts that depend on
  them) are revisited post-launch once real traffic data exists. Pretec's confirmed availability
  expectations (§5) feed that future decision. See also
  [overview §7 Non-functional](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md).
- **Maestro-surfaced sync status** — whether sync health is additionally surfaced in Maestro (vs.
  Grafana only) depends on what Maestro exposes; tracked under [C-2 Maestro usage](maestro-usage-spec.md).

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Observability | Instrument (OTEL), build dashboards, configure alerts, first-respond to technical failures | Triage business-facing sync issues (business hours), confirm availability expectations |

---

## 9. Success criteria

- Traces, metrics, and logs from the Service API, Harmony syncs, and Storefront flow to Grafana.
- Geta ops and Pretec business dashboards exist; Pretec has read-only access to the business dashboard.
- Hard failures (sync job failed, Service API down, RamBase unreachable) alert to Slack/email and reach
  the correct owner per §5.
- Logs are retained ~30 days and contain no identity-linked PII.
