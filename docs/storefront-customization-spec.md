# Storefront Customization Specification

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** What is customized in the Mosaik Storefront starterkit vs. used as-provided, and the upgrade strategy
**Index ref:** [spec-index.md](spec-index.md) → C-3
**Related:** [Service API](superpowers/specs/2026-06-08-pretec-service-api-design.md) · [I-2 Catalog publish](catalog-publish-spec.md) · [I-5 Content](content-sanity-spec.md)

---

## 1. Purpose

This specification defines which parts of the Mosaik Storefront (Next.js / React starterkit) are customized by Geta for Pretec, which are used as-provided, and how the customization model stays compatible with future Mosaik platform releases.

---

## 2. The no-fork principle

The central design constraint for the Pretec storefront is **no hard fork of the Mosaik starterkit**.

The Pretec Service API is built to **mirror standard Mosaik API contracts** (price, cart, quote, orders) — this is the mechanism that enables the no-fork approach. Because the Service API speaks Mosaik's own language, the starterkit's built-in components for price display, cart, checkout, and order history integrate with the Pretec backend without requiring changes to the component code.

Customization happens in two ways:
- **Configuration** — values, feature flags, theme tokens, environment variables set without touching component code.
- **Starterkit extension** — new components or pages added on top of the standard starterkit, or specific components overridden at the extension layer (not edited in-place).

Code in the core Mosaik starterkit is never edited directly. This keeps the Pretec storefront on the Mosaik upgrade path.

---

## 3. What is customized

### 3.1 Branding and theming (configuration)

| Element | Customization |
|---|---|
| Logo | Pretec logo applied via theme config |
| Color palette | Pretec brand colors applied via design token config |
| Typography | Pretec typefaces and scale applied via theme config |
| Favicon and social/OG images | Pretec assets |

Branding is applied through the Mosaik theme configuration layer — no starterkit component code is modified.

### 3.2 Anonymous vs. logged-in rendering (starterkit extension)

The Mosaik starterkit is configured and extended for Pretec's B2B anonymous-browsing model:

| Behavior | Implementation |
|---|---|
| Price hidden for anonymous users | Conditional render — price component not shown without auth |
| Availability hidden for anonymous users | Conditional render — stock badge not shown without auth |
| Add-to-cart hidden for anonymous users | Cart component gated on auth state |
| "Henter pris…" loading state | Extended price component state |
| "Pris på forespørsel" fallback | Extended price component fallback |

### 3.3 Catalog browsing (configuration + minor extension)

| Behavior | Implementation |
|---|---|
| Navigation driven from catalog category tree | Platform configuration — no code change |
| Up to 4-level category hierarchy | Platform configuration |
| Default sort: creation date, newest first | Configuration |
| "Ikke lenger tilgjengelig" on deactivated products | Extended product page state |
| Variant selector | Standard Mosaik component, configured for Pretec's variant model |

### 3.4 Checkout as quote request (Service API contract)

The checkout flow uses the standard Mosaik checkout component wired to the Pretec Service API's quote endpoint, which mirrors the Mosaik cart/checkout contract. No checkout component code is modified. The following are configuration or content:

- PO/reference field (optional)
- Delivery date field (optional)
- Comment field
- On-screen confirmation only (no email)

### 3.5 My Page / Min side (Service API contract)

Order history uses the standard Mosaik My Page component wired to the Pretec Service API's query endpoint, which mirrors the Mosaik order history contract. Filters (date range, status, reference number search) are configured within the standard component.

### 3.6 Registration and onboarding (starterkit extension)

The invitation-based onboarding flow (company application → approval → invitation → acceptance) is a **new page set** added as a starterkit extension — it does not exist in the standard starterkit and is built by Geta on top of it.

### 3.7 Editorial content pages (configuration)

Sanity-sourced editorial pages (About, Contact, etc.) are rendered using the standard Mosaik Sanity content integration. Page routing and content rendering are platform-provided; the Sanity schema is configured by Geta.

---

## 4. What is used as-provided

| Capability | Mosaik platform feature |
|---|---|
| Product listing and detail pages | Standard catalog components |
| Search and filtering | Standard search-catalog-public API and components |
| Cart state and management | Standard cart components (via Service API contract) |
| Cognito authentication | Standard Mosaik identity integration |
| Maestro backoffice | As-provided (see [C-2](maestro-usage-spec.md)) |
| Harmony sync engine | As-provided (configured, not modified) |
| Sanity Studio | As-provided (schema configured by Geta) |
| CDN and asset delivery | Platform-provided |

---

## 5. Upgrade strategy

Mosaik releases storefront and platform updates continuously. The Pretec storefront stays on the upgrade path because the no-fork principle keeps the core starterkit unmodified.

| Update type | Responsibility | Process |
|---|---|---|
| Security patches and critical fixes | **Geta applies** — proactively, without a Pretec request | Applied to test environment first; promoted to production after smoke test |
| Minor releases (features, bug fixes) | **Pretec-initiated** — Pretec requests when ready | Geta assesses impact, applies to test, Pretec validates, promotes to production |
| Major Mosaik releases | **Pretec-initiated** — planned upgrade | Geta assesses breaking changes against Pretec extensions; scoped as a change request |

Extensions (new pages, overridden components) are reviewed for compatibility before each upgrade. Because extensions sit outside the core starterkit, the surface area of breakage is predictable and contained.

---

## 6. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Starterkit extensions | Build and maintain all Pretec-specific extensions | Review and validate behavior |
| Theme / branding configuration | Apply brand config | Provide brand guidelines, assets, and color palette |
| Service API contract | Build and maintain Pretec Service API (mirrors Mosaik contracts) | — |
| Security and critical patch upgrades | Apply proactively | — |
| Minor and major release upgrades | Assess and apply on request | Initiate upgrade request; validate on test environment |
| Upgrade compatibility of extensions | Review and fix extensions per upgrade | — |

---

## 7. Open questions

| Question | Status |
|---|---|
| Pretec brand guidelines and design assets | Provide to Geta before design/build begins |
| Exact typefaces and color tokens for Pretec theme | Confirm with Pretec |

---

## 8. Related specs

- [Service API](superpowers/specs/2026-06-08-pretec-service-api-design.md) — the no-fork enabler: standard Mosaik contracts implemented by Geta
- [maestro-usage-spec.md](maestro-usage-spec.md) — C-2 Maestro as-provided usage
- [catalog-publish-spec.md](catalog-publish-spec.md) — I-2 catalog data feeding the standard catalog components
- [content-sanity-spec.md](content-sanity-spec.md) — I-5 Sanity content integration
- [authentication-spec.md](authentication-spec.md) — A-1 Cognito identity (standard Mosaik integration)
- [environments-spec.md](environments-spec.md) — X-2 environment model (each environment runs its own storefront instance)
