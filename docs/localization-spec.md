# Localization & Markets Specification

**Date:** 2026-06-21
**Status:** Draft for customer review
**Audience:** Pretec and Geta
**Scope:** Languages, currency, and market scope across the platform
**Index ref:** [spec-index.md](spec-index.md) → X-1

---

## 1. Purpose

Define the localization and market scope of the platform — a cross-cutting concern touching catalog,
content, pricing, and the Storefront. It also fixes the **forward-compatibility posture**: Phase 1 ships a
single locale, but the **data layer is built locale-ready** so adding markets later does not require a data
re-model.

---

## 2. Phase 1 scope

From [customer-overview-spec.md §2](customer-overview-spec.md):

| Dimension | Phase 1 |
|---|---|
| **Language** | Norwegian only |
| **Market** | Norway only |
| **Currency** | NOK only |
| **Tax display** | Prices shown **ex-VAT (net)**, no VAT amount shown |

Out of scope for Phase 1: additional languages, additional markets, additional currencies, language
switching, and market routing in the UI.

---

## 3. Design principle — locale-ready data, single-locale UI

The agreed approach is **locale-ready data with a single-locale UI**:

- **Data layer is multi-locale capable.** Content (Sanity) and product data (Struct) are modelled so a
  second language/market can be added as additional locale values rather than a schema change.
- **UI is single-locale.** The Storefront ships Norwegian only. **No language switcher and no market
  selector** are built in Phase 1.
- Adding a locale later becomes a content + configuration exercise, not a re-platforming exercise.

### 3.1 URL strategy — no locale in the URL

Storefront URLs carry **no language or market prefix** in Phase 1 (e.g. `/produkter/...`, not
`/no/produkter/...`).

- Keeps URLs clean for the single Norwegian market.
- **Trade-off (accepted):** if a second locale is added later, introducing locale-prefixed URLs will
  require redirects from the current URLs. This is a known, accepted future cost — manageable via Maestro
  redirects ([C-2 Maestro](maestro-usage-spec.md)).

---

## 4. Where each kind of text lives

Localization responsibility is split by content type. Each system owns the localized text for its domain:

| Text type | Owned/managed in | Notes |
|---|---|---|
| **Storefront UI strings** (buttons, navigation labels, system & error messages) | **Maestro** translations | Static interface text managed via Mosaik's translation tooling ([C-2 Maestro](maestro-usage-spec.md)) |
| **Editorial content** (pages, banners, category/product editorial) | **Sanity** | Authored and localized by Pretec ([I-5 Content](content-sanity-spec.md)) |
| **Legal / footer text** (terms, privacy, footer copy) | **Sanity** | Managed as editorial content alongside the above |
| **Product data** (display name, descriptions, attributes) | **Struct** | Product enrichment; localized in the PIM ([I-1 Product spec](product-rambase-struct-harmony-spec.md)) |
| **ERP-owned text** (ERP product name, unit of measure, ERP-controlled fields) | **RamBase** (as-is) | **Not localized** — used in RamBase's own language; out of localization scope |

**Boundary note:** ERP-owned fields are intentionally excluded from localization. Where an ERP value would
otherwise surface to the customer in the wrong language (e.g. a display name), the **Struct-owned localized
value takes precedence** for storefront display — see the display-name ownership open item in
[product spec §6](product-rambase-struct-harmony-spec.md).

---

## 5. Currency & VAT

- **Currency:** NOK only. No currency conversion or multi-currency display in Phase 1.
- **VAT:** prices are shown **ex-VAT (net)**. No VAT amount, VAT rate, or incl-VAT figure is shown in the
  storefront. This matches the B2B pricing model in the
  [Service API spec §4.1](superpowers/specs/2026-06-08-pretec-service-api-design.md) and
  [customer-overview §4.2](customer-overview-spec.md).

---

## 6. Forward compatibility (later phases — informational)

To keep the door open without building it now, the following are kept locale-ready:

- Sanity content models support per-locale field values.
- Struct product fields support localized values.
- Maestro translation keys are not hardcoded into UI components.

Explicitly **deferred** to a future phase: language switcher, market/currency selector, locale-prefixed
URLs + redirects, multi-currency pricing, and incl-VAT display rules for any B2C-style market.

---

## 7. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Locale-ready data models (Sanity, Struct) | Configure | Confirm scope |
| UI string translations | Wire up Maestro translation keys | Provide/approve Norwegian strings |
| Editorial localization | Set up Sanity model | Author Norwegian content |
| Product localization | Set up Struct fields | Enrich product text in Norwegian |
| Currency/VAT display | Implement NOK ex-VAT | Confirm rule |

---

## 8. Open decisions

Phase 1 localization is largely settled. Remaining item to confirm with Pretec:

- Final source-of-truth for **product display name** when RamBase and Struct differ (cross-ref
  [product spec §6](product-rambase-struct-harmony-spec.md)).


---

## 9. Success criteria

- The Storefront renders fully in Norwegian (UI strings, editorial, product data) with **no untranslated
  fragments** and **no language/market selector**.
- Prices display in **NOK ex-VAT** consistently.
- Content and product **data models are locale-ready**, so adding a future locale needs new content/config
  only — not a schema migration.
