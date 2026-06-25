# My Page / Min Side Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Storefront Min side — order history, filtering, and order detail
**Index ref:** [spec-index.md](spec-index.md) → F-6
**Consolidates:** [overview §5.5](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) · [Service API §4.4](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

This specification defines the My Page / Min side experience — what logged-in users can see about their order history and how they navigate it.

---

## 2. Access and scope

| Property | Value |
|---|---|
| Access | Logged-in, approved users only |
| Data source | RamBase via Pretec Service API (read-only) |
| Scoping | Per **company** — all users belonging to the same RamBase customer see the same order history |
| Quotes | Not shown — quotes are handled by Pretec Sales in RamBase |

---

## 3. What is shown

| Content | Phase 1 |
|---|---|
| Sales orders | ✅ |
| Invoices | ❌ — orders only |
| Credit notes | ❌ |
| PDF downloads | ❌ — on-screen data only |

PDF download support depends on the RamBase document API and is deferred to a later phase.

---

## 4. Order list

The Min side landing page shows a **paginated list of orders** for the company.

### 4.1 Filters

| Filter | Type |
|---|---|
| Date range | Date picker (from / to) |
| Order status | Dropdown or multi-select — status values from RamBase |
| Order / reference number | Free-text search on order number or customer PO reference |

Filters can be combined. The list updates when filters are applied.

### 4.2 List columns

Each row in the order list shows:

- Order number
- Order date
- Order status
- Total amount (ex-VAT, NOK)
- Customer reference / PO number (if present)

### 4.3 Pagination

Page-based pagination using RamBase's cursor-based API (`$top` / `$pageKey`). Page size to be confirmed during implementation.

### 4.4 Default sort

Orders sorted by date, newest first.

---

## 5. Order detail

Clicking an order opens the order detail view showing:

- Order number and date
- Order status
- Customer reference / PO number
- Delivery address
- Requested delivery date (if present)
- Order lines: product name, SKU, quantity, unit, unit price, line total
- Order total (ex-VAT, NOK)
- Any comment submitted with the order

No PDF download link is shown in Phase 1.

---

## 6. Phase 2 considerations (out of scope for Phase 1)

- Invoice history
- Credit notes
- PDF download of order confirmations and invoices (subject to RamBase document API support)

---

## 7. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Order query API | Build Pretec Service API → RamBase orders | Provide RamBase order API access; confirm filterable fields |
| Order list and detail UX | Build Min side pages | Review and validate |
| Status values | Map RamBase order statuses to display labels | Confirm Norwegian status label wording |
| Scoping (company-level) | Implement company-scoped query via RamBase customer ID | Confirm shared view is correct for all company users |

---

## 8. Open questions

| Question | Status |
|---|---|
| RamBase order status field names and values | Confirm during Service API build |
| Page size for order list | Confirm during implementation |
| Order status display labels in Norwegian | Confirm with Pretec |

---

## 9. Related specs

- [checkout-quote-spec.md](checkout-quote-spec.md) — F-5 quote submission (quotes not visible here)
- [Service API §4.4](superpowers/specs/2026-06-08-pretec-service-api-design.md) — Query service contract and RamBase pagination
- [security-privacy-spec.md](security-privacy-spec.md) — X-5 data access scoping and user roles
