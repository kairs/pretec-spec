# Storefront Customization Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** What is customized in the Mosaik Storefront starterkit vs. used as-provided
**Index ref:** [spec-index.md](spec-index.md) → C-3

---

## 1. Purpose

Define which parts of the Mosaik Storefront (Next.js/React starterkit) are **customized by Geta** for
Pretec vs. used **as-provided**, and how customization stays compatible with the platform (no fork).

A key design constraint: the [Pretec Service API](superpowers/specs/2026-06-08-pretec-service-api-design.md)
**mirrors standard Mosaik API contracts** specifically so the starterkit is reused **without forking**.

---

## 2. To specify

- [ ] Branding / theming (logo, colors, typography)
- [ ] Layout & navigation customization
- [ ] Which pages/components are customized vs. standard
- [ ] Integration points to the Service API (price, cart, quote, orders) and Sanity content
- [ ] Anonymous vs. logged-in rendering differences (no prices, no cart for anonymous)
- [ ] Where customization is config-only vs. requires starterkit code changes
- [ ] Upgrade / versioning strategy to stay compatible with Mosaik releases

## 3. Open decisions

- Carried from [overview §7](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md): which
  capabilities are config-only vs. require Storefront-starterkit customization; versioning/upgrade
  responsibility.

## 4. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Storefront customization | Build & configure | Provide brand, content, requirements |
| Upgrade compatibility | Maintain | — |

## 5. Success criteria

- The Storefront reflects Pretec branding & requirements while remaining upgradeable (no hard fork).
