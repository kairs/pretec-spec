# Pretec Commerce Platform — Specification Roadmap & Index

**Date:** 2026-06-21
**Status:** Living document
**Audience:** Pretec and Geta
**Maintained by:** Geta

---

## 1. Purpose

This is the **master index of every specification** for the Pretec commerce platform. It answers two
questions:

1. **What needs to be specified** — every integration, service, and functional capability that makes up
   the platform.
2. **Where is it specified** — a link to the document, or a placeholder for a spec that still needs to be
   written.

Use this document as the entry point. The two overview specs describe *what the platform is*; this
document tracks *which detailed specs exist and which are still owed*.

- For the **system-level** overview (systems, responsibilities, data flows) → [Commerce Platform Overview](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md)
- For the **customer-facing** overview (scope, UX, decisions) → [Customer Overview Specification](customer-overview-spec.md)

---

## 2. How to read the index

Each item below is something the customer or the team recognizes as a distinct integration, service, or
feature, and each should end up with its own detailed spec.

**Status legend:**

| Status | Meaning |
|---|---|
| ✅ **Written** | A dedicated spec exists and is current. |
| 🟡 **Partial** | Covered inside another document or only as flows/research — needs its own consolidated spec. |
| ⬜ **To write** | Identified as needed; no spec yet. |

**Type legend:** **INT** = integration (system-to-system) · **SVC** = Geta-built service · **FEAT** =
storefront/user-facing capability · **CFG** = platform configuration · **XC** = cross-cutting / non-functional.

---

## 3. Master index

### 3.1 Integrations (system-to-system data flows)

| # | Integration | Type | Status | Spec |
|---|---|---|---|---|
| I-1 | **Product & Category sync** — RamBase → Struct via Harmony | INT | ✅ Written | [product-rambase-struct-harmony-spec.md](product-rambase-struct-harmony-spec.md) |
| I-2 | **Catalog publish** — Struct → Storefront Catalog via Harmony (Catalog Sync) | INT | ⬜ To write (stub) | [catalog-publish-spec.md](catalog-publish-spec.md) |
| I-3 | **Inventory sync** — RamBase → Storefront Catalog via Harmony | INT | ⬜ To write (stub) | [inventory-sync-spec.md](inventory-sync-spec.md) |
| I-4 | **Customer sync** — RamBase → Mosaik (Harmony) + approval write-back Mosaik → RamBase | INT | ✅ Written | [customer-sync-spec.md](customer-sync-spec.md) |
| I-5 | **Content sync** — Sanity → Storefront (documents + content assets) | INT | ⬜ To write (stub) | [content-sanity-spec.md](content-sanity-spec.md) |
| I-6 | **RamBase API integration** — auth model, system credential, scoping, environments | INT | 🟡 Partial | [rambase-api-integration-spec.md](rambase-api-integration-spec.md) (consolidating [rambase-api-audit.md](superpowers/research/rambase-api-audit.md)) |

### 3.2 Services (Geta-built)

| # | Service | Type | Status | Spec |
|---|---|---|---|---|
| S-1 | **Pretec Service API** — umbrella (placement, routing, auth, storage, resilience, NFR) | SVC | ✅ Written | [2026-06-08-pretec-service-api-design.md](superpowers/specs/2026-06-08-pretec-service-api-design.md) |
| S-2 | └ **Price** — live batch per-user B2B price lookup | SVC | ✅ Written | Service API spec §4.1 |
| S-3 | └ **Cart** — service-owned cart state (MongoDB), mirrors Mosaik cart contract | SVC | ✅ Written | Service API spec §4.2 |
| S-4 | └ **Quote / checkout** — create RamBase sales quote from cart | SVC | ✅ Written | Service API spec §4.3 |
| S-5 | └ **Query** — read-only orders & invoices (Min side) | SVC | ✅ Written | Service API spec §4.4 |

### 3.3 Functional capabilities (storefront / user-facing)

| # | Capability | Type | Status | Spec |
|---|---|---|---|---|
| F-1 | **Catalog & product browsing** — listing, product detail, anonymous browsing | FEAT | ✅ Written | [catalog-browsing-spec.md](catalog-browsing-spec.md) |
| F-2 | **Search & filtering** — what powers search, facets, filters | FEAT | ✅ Written | [search-filtering-spec.md](search-filtering-spec.md) |
| F-3 | **Pricing display** — ex-VAT, "price on request" degradation, NOK only | FEAT | ✅ Written | [pricing-display-spec.md](pricing-display-spec.md) |
| F-4 | **Cart UX** — add/edit lines, 90-day sliding expiry, live price display | FEAT | ✅ Written | [cart-ux-spec.md](cart-ux-spec.md) |
| F-5 | **Checkout & quote UX** — PO/reference, delivery address, requested date, comment | FEAT | ✅ Written | [checkout-quote-spec.md](checkout-quote-spec.md) |
| F-6 | **My Page / Min side** — order & invoice history, scoping, PDF download | FEAT | ✅ Written | [min-side-spec.md](min-side-spec.md) |
| F-7 | **Customer registration & approval** — application → approval → invitation (new company in RamBase) | FEAT | ✅ Written | [registration-approval-spec.md](registration-approval-spec.md) |
| F-8 | **Content rendering** — editorial pages, category content, navigation, banners | FEAT | ⬜ To write (stub) | folds into I-5 / [content-sanity-spec.md](content-sanity-spec.md) |

### 3.4 Authentication & identity

| # | Area | Type | Status | Spec |
|---|---|---|---|---|
| A-1 | **Authentication & identity** — AWS Cognito (identity); RamBase customer resolved from the Mosaik mapping (no token claim) | INT/XC | ✅ Written | [authentication-spec.md](authentication-spec.md) |

### 3.5 Platform configuration

| # | Area | Type | Status | Spec |
|---|---|---|---|---|
| C-1 | **Harmony — sync configuration** — engine config, frequency, error handling, initial vs delta | CFG | ⬜ To write (stub) | [harmony-sync-spec.md](harmony-sync-spec.md) (cross-cuts I-1…I-4) |
| C-2 | **Maestro — backoffice usage** — redirects, translations, user/version views (as-provided) | CFG | ⬜ To write (stub) | [maestro-usage-spec.md](maestro-usage-spec.md) |
| C-3 | **Storefront customization** — which parts are config vs starterkit customization | CFG | ⬜ To write (stub) | [storefront-customization-spec.md](storefront-customization-spec.md) |

### 3.6 Cross-cutting & non-functional

| # | Area | Type | Status | Spec |
|---|---|---|---|---|
| X-1 | **Localization & markets** — languages (NO only Phase 1), currency (NOK), translations | XC | ✅ Written | [localization-spec.md](localization-spec.md) |
| X-2 | **Environments & deployment** — test / staging-UAT / production, upstream env mapping, release governance | XC | ✅ Written | [environments-spec.md](environments-spec.md) |
| X-3 | **Observability & monitoring** — OTEL, Grafana, alerting, operational ownership | XC | ✅ Written | [observability-spec.md](observability-spec.md) |
| X-4 | **Resilience & error handling** — RamBase dependency, timeouts/retries, graceful degradation | XC | ✅ Written | [resilience-spec.md](resilience-spec.md) (consolidating Service API §6) |
| X-5 | **Security & data privacy** — token handling, data residency, PII, roles, consent, retention/deletion | XC | ✅ Written | [security-privacy-spec.md](security-privacy-spec.md) |

---

## 4. Gaps at a glance

Specs that **still need to be written** (⬜), in suggested priority order:

1. **I-2 Catalog publish (Struct → Storefront)** — completes the product flow; I-1 only covers RamBase → Struct.
2. **I-3 Inventory sync** — needed for catalog availability display.
3. **A-1 Authentication & identity** — foundational for every logged-in capability; currently only sketched.
4. **C-1 Harmony sync configuration** — the cross-cutting engine config behind I-1…I-4.
5. **I-5 / F-8 Content (Sanity)** — content types unconfirmed; whole flow unspecified.
6. **F-2 Search & filtering** — open question with no home yet.
7. **C-2 Maestro usage**, **C-3 Storefront customization** — config-only but undocumented.

Items marked 🟡 **Partial** now have **consolidation stubs** (I-6, F-1, F-7, A-1) — each
points at where the partial content currently lives (overview / Service API / flows / research) and lists
what to pull together. They stay 🟡 until the consolidated spec is fully written and the source content is
either moved or cross-referenced.

---

## 5. Related documents (not in the index)

These support the specs but are not integration/service specs themselves:

| Document | Role |
|---|---|
| [Commerce Platform Overview](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) | System-level overview (parent of the sub-specs) |
| [Customer Overview Specification](customer-overview-spec.md) | Customer-facing scope & UX overview |
| [Definitions](definitions.md) | RamBase document types, IPA pricing model |
| [Service API — Build Plan](superpowers/plans/2026-06-09-pretec-service-api-build.md) | Task-by-task build plan |
| [Service API — Discovery Plan](superpowers/plans/2026-06-09-pretec-service-api-discovery.md) | API contract research plan |
| [Mosaik Platform Contracts](superpowers/research/mosaik-platform-contracts.md) | Contracts the Service API mirrors |
| [RamBase API Audit](superpowers/research/rambase-api-audit.md) | RamBase auth / endpoints / pagination findings |
| [Service API Decisions](superpowers/research/service-api-decisions.md) | Fixed technical decisions |
| [QA Spec](superpowers/specs/qa-spec.md) | Q&A log feeding the specs |
| [Open Questions for Pretec](open-questions-for-pretec.md) | Outstanding customer questions |
| [Customer Questions](customer-questions.md) | Additional questions from sessions |
| [Team Requirements — Phase 1](team-requirements-phase1.md) | Developer profiles for Phase 1 |

---

## 6. Maintaining this index

- When a new integration/service/feature is identified, **add a row** in the right section with status ⬜.
- When a spec is written, **flip the status to ✅** and replace the placeholder path with the real link.
- When a 🟡 item gets its own consolidated spec, move it to ✅ and point the link at the new document.
- Keep §4 (Gaps) in sync so the team always has a clear "what's left to spec" picture.
