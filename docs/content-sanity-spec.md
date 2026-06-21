# Content / CMS Specification — Sanity to Storefront

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Editorial content & content assets authored in Sanity and rendered in the Storefront
**Index ref:** [spec-index.md](spec-index.md) → I-5 (integration) & F-8 (rendering)

---

## 1. Purpose

Define the Sanity content model, how content reaches the Storefront, and how it relates to catalog data.

```text
Sanity (documents + content assets) -> Storefront Content
```

---

## 2. Systems and roles

| System | Role |
|---|---|
| **Sanity** | Headless CMS — editorial content & content assets; authored by Pretec |
| **Mosaik Storefront** | Renders content; merges editorial with catalog data |

---

## 3. Content types to confirm

Candidate types (from [customer-overview-spec.md §4.6](customer-overview-spec.md)):

- [ ] Editorial landing pages
- [ ] Category content (banners, descriptions)
- [ ] Product editorial content (vs. Struct enrichment — clarify boundary)
- [ ] Navigation / mega menu
- [ ] Banners & campaign content

## 4. To specify

- [ ] Content model / schema per type
- [ ] Relationship between Sanity content and catalog (e.g. category page = catalog + Sanity block)
- [ ] Boundary between **Sanity** (editorial) and **Struct** (product enrichment) — avoid overlap
- [ ] Preview / draft / publish workflow
- [ ] Localization of content (ties to [X-1 Localization](localization-spec.md))
- [ ] Asset handling / CDN
- [ ] Delivery mechanism (Sanity API / webhook / build-time vs. runtime)

## 5. Open decisions

- Which content types are in Phase 1 scope.
- Who authors and approves content.

## 6. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Content model & integration | Model + integrate | Confirm types |
| Authoring | — | Author & maintain content |

## 6. Success criteria

- Pretec can author the agreed content types and see them render correctly in the Storefront.
- Editorial and catalog data combine cleanly on shared pages (e.g. category pages).
