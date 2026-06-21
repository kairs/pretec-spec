# Maestro Backoffice Usage Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Using Mosaik Maestro (as-provided) — configuration/usage only, no custom build
**Index ref:** [spec-index.md](spec-index.md) → C-2

---

## 1. Purpose

Define how Mosaik Maestro is used to operate the Storefront. Maestro is **provided as-is by Mosaik**; there
is **no custom Maestro development** in Phase 1 — this spec covers configuration and operating process only.

---

## 2. Capabilities (to confirm full list)

Known uses (from [overview §5.8](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md)):

- [ ] Redirects
- [ ] Translations (ties to [X-1 Localization](localization-spec.md))
- [ ] View users
- [ ] Service versions
- [ ] **Customer approval / linking** — review registration, link to RamBase customer (see [flows-customer-sync.md](flows-customer-sync.md))

## 3. To specify

- [ ] Full feature list available in Maestro
- [ ] Who operates each function — Geta ops vs. Pretec admins
- [ ] Approval workflow operating procedure
- [ ] Access control / roles in Maestro

## 4. Open decisions

- Carried from [overview §7](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md): full feature
  list; who operates it (Geta ops vs. Pretec admins).

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Maestro configuration | Configure | Define operational policies |
| Day-to-day operation | Support | Operate approvals / content ops |

## 6. Success criteria

- Pretec/Geta can perform the agreed backoffice tasks (incl. customer approval) without custom development.
