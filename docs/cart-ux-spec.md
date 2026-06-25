# Cart UX Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Storefront cart — adding products, editing lines, price display, expiry, and edge cases
**Index ref:** [spec-index.md](spec-index.md) → F-4
**Consolidates:** [overview §5.4](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) · [Service API §4.2](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

This specification covers the storefront cart experience — how products are added, how the cart is managed, how prices are displayed, and how the cart behaves at its boundaries (expiry, unavailable products).

---

## 2. Cart fundamentals

| Property | Value |
|---|---|
| Access | Logged-in, approved users only |
| Scope | Per individual user — each user has their own cart |
| Storage | Service-owned in MongoDB (Pretec Service API, EKS) |
| Key | RamBase customer ID resolved from the logged-in user's Mosaik mapping |
| Contract | Mirrors the standard Mosaik `cart-public` API |
| TTL | 90 days, sliding — reset to 90 days on every cart read or write |
| Expiry | Silent deletion — cart is gone on next visit with no notification |
| Cleared | Automatically on successful quote submission |

Anonymous users and applicants (pending invitation) have no cart.

---

## 3. Adding products to the cart

### 3.1 From a listing page

Each product card on a category or search results page includes a **quantity input field** and an **"Add to cart"** button. The user sets the desired quantity before adding — the default is 1.

Clicking "Add to cart" adds the product at the specified quantity directly. No navigation to the cart occurs automatically.

### 3.2 From a product detail page

The product detail page includes a quantity input and an "Add to cart" button. For products with variants, the user must select a variant before adding. The quantity input is pre-filled with 1.

### 3.3 Updating quantities in the cart

Line quantities can be edited directly in the cart. The user changes the quantity in an input field; the line is updated on confirm (Enter or blur).

### 3.4 Removing lines

Each cart line has a remove button. Removing a line deletes it from the cart immediately.

---

## 4. Price display in the cart

- Each cart line shows the **live ex-VAT price** per unit and the **extended price** (unit price × quantity), fetched from the Pretec Service API.
- The cart **total** is the sum of all line extended prices, ex-VAT.
- Prices are **not stored as truth** on cart lines — they are fetched live for display.
- While prices are loading: **"Henter pris…"** is shown per line and on the total.
- If a line price cannot be fetched: **"Pris på forespørsel"** is shown for that line. The line is still included in the cart and can be submitted as a quote.
- Cart total shows **"Pris på forespørsel"** if any line cannot be priced, or excludes unpriced lines with a note — confirm preferred approach during implementation.

See [F-3 Pricing display](pricing-display-spec.md) for full price fetch and degradation rules.

---

## 5. Availability in the cart

- Each cart line shows the product's current **availability** (In stock / Out of stock) from the synced inventory.
- If a product becomes **out of stock or discontinued** while in the cart:
  - A **warning** is shown on the affected line.
  - The user can still proceed to checkout — the warning is informational, not a blocker.
  - Pretec Sales handles any fulfilment questions after the quote is submitted.
- Products are **not automatically removed** from the cart when availability changes.

---

## 6. Cart UI behaviour

- A **cart icon** in the storefront header shows the current line count. It updates immediately when a product is added or removed.
- The cart page lists all lines with product name, SKU, variant (if applicable), quantity, unit price, and extended price.
- Lines are ordered by the time they were added (oldest first).
- There is no maximum line count enforced in Phase 1.
- From the cart, the user proceeds to checkout (quote submission) — see [F-5 Checkout & quote UX](checkout-quote-spec.md).

---

## 7. Cart expiry

- The cart TTL is **90 days, sliding** — reset to 90 days on every read or write.
- On expiry, the cart is **silently deleted**. The user arrives to an empty cart on their next visit.
- No expiry warning is shown in the storefront and no email notification is sent.

---

## 8. Phase 2 considerations (out of scope for Phase 1)

The following are identified in the customer requirements as later-phase:

- **Saving a cart for later** (temporary order / draft) — requirement 2.6.5
- **Re-ordering from order history** — copy a previous order into the cart — requirement 2.6.4

---

## 9. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Cart storage and API | Build and operate (MongoDB, Pretec Service API) | — |
| Add to cart UX (listing + PDP) | Implement quantity input and add button | Confirm UX |
| Line quantity editing | Implement | — |
| Price display in cart | Implement live fetch + "Henter pris…" + "Pris på forespørsel" | Confirm wording |
| Availability warning on lines | Implement | Confirm warning copy |
| Cart expiry | Implement 90-day sliding TTL | Confirm expiry behaviour |
| Cart icon / line count | Implement | — |

---

## 10. Open questions

| Question | Status |
|---|---|
| Cart total when one or more lines show "Pris på forespørsel" — exclude from sum or show total as "Pris på forespørsel" | Confirm during implementation |
| Minimum order quantity per product — enforced in cart or not | Confirm with Pretec (likely RamBase-side) |

---

## 11. Related specs

- [pricing-display-spec.md](pricing-display-spec.md) — F-3 price fetch, loading state, degradation
- [checkout-quote-spec.md](checkout-quote-spec.md) — F-5 checkout and quote submission
- [catalog-browsing-spec.md](catalog-browsing-spec.md) — F-1 listing and product detail pages
- [Service API §4.2](superpowers/specs/2026-06-08-pretec-service-api-design.md) — Cart service contract and storage
