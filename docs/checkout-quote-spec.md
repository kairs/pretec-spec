# Checkout & Quote UX Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Storefront checkout flow — quote submission, delivery details, confirmation, and error handling
**Index ref:** [spec-index.md](spec-index.md) → F-5
**Consolidates:** [overview §5.4](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) · [Service API §4.3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

This specification covers the checkout flow from cart to quote submission — what the user fills in, how the quote is created in RamBase, and how the storefront responds to success and failure.

---

## 2. Checkout model

Checkout on the Pretec storefront is **always a request-for-quote**. There is no firm online ordering and no payment. Every submission creates a **RamBase sales quote** that a Pretec sales representative reviews and converts.

| Property | Value |
|---|---|
| Submission type | RamBase sales quote (request-for-quote only) |
| Access | Logged-in, approved users only |
| Cart after submission | Cleared on successful quote creation |
| Quote in Min side | No — quotes are not visible in order/invoice history |
| Pretec follow-up | Sales rep handles the quote in RamBase |

---

## 3. Checkout form

The checkout page presents the following fields:

| Field | Required | Notes |
|---|---|---|
| Customer reference / PO number | Optional | The customer's own internal reference or purchase order number |
| Delivery address | Required | See §4 |
| Requested delivery date | Optional | Date picker — no date means no preference |
| Quote comment / message | Optional | Free-text field for the customer to add notes to Pretec Sales |

All fields are on a single checkout page — no multi-step wizard.

---

## 4. Delivery address

The user selects a delivery address for the quote. Two options are available:

- **Select from saved addresses** — addresses registered on the RamBase customer account.
- **Enter a custom address** — free-text delivery address not on the customer's RamBase record.

> **Decision deferred:** whether custom address entry is available in Phase 1 or limited to saved RamBase addresses only. Confirm before implementation.

---

## 5. Submission

### 5.1 Submit action

The user reviews the cart lines and filled-in fields, then clicks **"Send forespørsel"** (or equivalent). The storefront calls `POST /carts/{id}/create-order-request` on the Pretec Service API, which creates the sales quote in RamBase.

### 5.2 Successful submission

On success:

- The cart is **cleared**.
- The user is shown an **on-screen confirmation** with a summary of the submitted quote (reference, lines, delivery details).
- No confirmation email is sent by the storefront in Phase 1.
- Pretec Sales follows up with the customer from RamBase.

### 5.3 Failed submission

If RamBase returns an error or the request times out:

- An **error message** is shown on the checkout page.
- The **cart is preserved** — no lines are lost.
- The user can **retry** the submission without re-entering their details.
- The quote submission must never silently drop — if it cannot be confirmed as received by RamBase, the error is surfaced.

---

## 6. Quote visibility

Submitted quotes are **not** visible in Min side (My Page). Min side shows orders and invoices only — see [F-6 My Page / Min side](min-side-spec.md).

The customer receives follow-up from Pretec Sales directly.

---

## 7. Phase 2 considerations (out of scope for Phase 1)

- Confirmation email to the customer after successful submission.
- Quote status tracking in the storefront.

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Quote submission API | Build Pretec Service API → RamBase quote creation | Provide RamBase quote API access; confirm required fields |
| Checkout form UX | Build checkout page and form | Confirm field requirements and wording |
| Delivery address options | Implement saved address selection; custom address (if agreed for Phase 1) | Confirm which addresses are exposed via RamBase API |
| Success confirmation | Implement on-screen confirmation | Confirm confirmation copy and summary content |
| Error handling | Implement retryable error on checkout page | — |
| Cart clearing on success | Implement | — |

---

## 9. Open questions

| Question | Status |
|---|---|
| Custom delivery address in Phase 1 — or saved RamBase addresses only | **Decision deferred** — confirm before implementation |
| Exact wording for submit button and confirmation page | Confirm with Pretec |
| RamBase quote fields — which fields map to which RamBase quote document fields | Confirm during RamBase API integration (Service API build) |

---

## 10. Related specs

- [cart-ux-spec.md](cart-ux-spec.md) — F-4 cart management before checkout
- [min-side-spec.md](min-side-spec.md) — F-6 order/invoice history (quotes not shown here)
- [Service API §4.3](superpowers/specs/2026-06-08-pretec-service-api-design.md) — Quote service contract
- [resilience-spec.md](resilience-spec.md) — X-4 error handling and retry policy for quote submission
