# Pricing Display Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** How prices are fetched, displayed, and degraded across the Pretec storefront
**Index ref:** [spec-index.md](spec-index.md) → F-3
**Consolidates:** [overview §5.3](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) · [Service API §4.1](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

This specification defines the rules for price display across the storefront — who sees prices, what is shown, how prices are fetched, and how the UI behaves when prices are loading or unavailable.

---

## 2. Price data source

Prices are **live** — fetched from RamBase through the Pretec Service API on demand. They are not stored in the Storefront Catalog and are not available as synced data.

| Property | Value |
|---|---|
| Source | RamBase via Pretec Service API |
| Scope | Per-customer (resolved from the logged-in user's RamBase customer mapping) |
| Currency | NOK only |
| VAT | Ex-VAT (net) — no VAT amounts shown anywhere in the storefront |
| Tiered / quantity-break pricing | Not in Phase 1 — one price per (product, customer) |
| Recommended retail price display | Not in Phase 1 — only agreed customer price is shown |
| Fallback logic | Handled in RamBase — if no customer-specific price exists, RamBase returns the standard list price. The storefront always receives a price from the API or nothing. |

---

## 3. Access — who sees prices

| User type | Price shown |
|---|---|
| Anonymous visitor | No — price area is absent from the page |
| Applicant (pending invitation) | No — treated as anonymous |
| Logged-in, approved user | Yes — customer-specific price from Service API |

Anonymous users see no indication that a price exists. No "log in to see price" prompt is shown.

---

## 4. Fetch pattern — catalog-price decoupling

To avoid RamBase latency affecting catalog page load times, prices are fetched **client-side after the page has rendered**:

1. Page loads with catalog data (product names, images, descriptions) from the synced Storefront Catalog — fast, no RamBase dependency.
2. After render, the storefront makes a **batch price request** to the Pretec Service API for all products on the page.
3. Prices are filled in progressively as the response arrives.

This means the catalog remains usable even if pricing is slow or unavailable.

---

## 5. Loading state

While a logged-in user's price is being fetched:

- The price area shows **"Henter pris…"** as a text placeholder.
- Once the price arrives, it replaces the loading text.
- If the fetch fails or times out, the degraded state (§6) is shown instead.

---

## 6. Degraded state — "Pris på forespørsel"

If the Pretec Service API returns an error or no price for a product:

- The price area shows **"Pris på forespørsel"**.
- The product remains browsable and the add-to-cart button remains visible.
- Quote submission with "Pris på forespørsel" items is supported — Pretec Sales handles pricing follow-up.

This degradation applies to:
- Service API timeouts or errors
- Any case where no price value is returned by the API

The storefront does not distinguish between "no customer price" and "API failure" — both result in "Pris på forespørsel". RamBase is responsible for ensuring a price (customer-specific or list price) is returned wherever one exists.

---

## 7. Price display contexts

### 7.1 Product listing page (category / search results)

| State | Display |
|---|---|
| Anonymous | Price area absent |
| Logged-in, loading | "Henter pris…" |
| Logged-in, price returned | Price amount, NOK |
| Logged-in, no price / error | "Pris på forespørsel" |

### 7.2 Product detail page

Same rules as listing page. Price is shown per selected variant when the product has variants — switching variants triggers a new price fetch for that variant's SKU.

### 7.3 Cart

- Each cart line shows the price at the time it was last fetched.
- Cart total reflects the sum of current fetched prices.
- Prices are **not stored as final truth** on cart lines — they are fetched live for display.
- If a line's price cannot be fetched, it shows "Pris på forespørsel" for that line.
- See [F-4 Cart UX](cart-ux-spec.md) for full cart pricing rules.

### 7.4 Search results

Same rules as listing page. See [F-2 Search & filtering](search-filtering-spec.md).

---

## 8. Phase 2 considerations (out of scope for Phase 1)

The following are identified as later-phase requirements (from customer requirement 2.6.2):

- Showing **recommended retail price** alongside the agreed customer price to display savings.
- This requires RamBase to return a recommended retail price alongside the customer price in the Service API response.

---

## 9. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Price fetch and Service API | Build and operate Pretec Service API | Provide RamBase price access; confirm price fields and fallback logic |
| Fallback price logic | Show "Pris på forespørsel" when no price returned | Ensure RamBase returns list price as fallback when no customer price exists |
| Loading state UX | Implement "Henter pris…" placeholder | Confirm wording |
| Degraded state UX | Implement "Pris på forespørsel" | Confirm wording |
| Catalog-price decoupling | Implement batch client-side price fetch after render | — |
| VAT handling | Display ex-VAT only | Confirm ex-VAT as the agreed display format |

---

## 10. Open questions

| Question | Status |
|---|---|
| Exact Norwegian wording for "Pris på forespørsel" | Confirm with Pretec |
| Exact Norwegian wording for "Henter pris…" | Confirm with Pretec |
| Timeout threshold for price fetch before showing degraded state | Confirm during Service API design |

---

## 11. Related specs

- [Service API §4.1](superpowers/specs/2026-06-08-pretec-service-api-design.md) — Price endpoint contract and batch fetch
- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 catalog and product detail pages
- [search-filtering-spec.md](search-filtering-spec.md) — F-2 search results price display
- [cart-ux-spec.md](cart-ux-spec.md) — F-4 cart line pricing
- [resilience-spec.md](resilience-spec.md) — X-4 Service API degradation and timeout policy
