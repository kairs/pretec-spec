# Localization & Markets Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Languages, currency, and market scope across the platform
**Index ref:** [spec-index.md](spec-index.md) → X-1

---

## 1. Purpose

Define the localization and market scope of the platform — a cross-cutting concern touching catalog,
content, pricing, and the Storefront.

---

## 2. Phase 1 baseline (from customer overview)

From [customer-overview-spec.md §2](customer-overview-spec.md):

- **Language:** Norwegian only (no additional languages in Phase 1)
- **Market / currency:** Norway / NOK only
- **Pricing:** shown ex-VAT

Out of scope Phase 1: additional languages, additional markets/currencies.

---

## 3. To specify

- [ ] Translation management — Maestro-managed translations ([C-2 Maestro](maestro-usage-spec.md)); what is translatable
- [ ] Content localization in Sanity ([I-5 Content](content-sanity-spec.md))
- [ ] Catalog/product field localization (display name, descriptions)
- [ ] URL / routing strategy (in case multi-language is added later)
- [ ] Currency & VAT display rules
- [ ] Future-proofing — what to keep flexible for later markets/languages

## 4. Open decisions

- Carried from overview specs: scope of languages/markets (Phase 1 confirmed NO/NOK).
- Whether the architecture should anticipate future locales/markets now.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Localization config | Configure | Provide translations & confirm scope |

## 6. Success criteria

- Storefront, content, and pricing render correctly in Norwegian / NOK ex-VAT, per agreed scope.
