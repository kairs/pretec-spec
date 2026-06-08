# Pretec Service API — Sub-spec (#9)

**Date:** 2026-06-08
**Status:** Draft for customer review
**Parent spec:** `2026-06-08-pretec-commerce-overview-design.md` (§5.9)
**Audience:** Pretec (customer) and Geta (delivery team)
**Q&A log:** `qa-spec.md` → "Sub-spec #9 — Pretec Service API"

---

## 1. Purpose & role

The **Pretec Service API** is a **Geta-built .NET service** that wraps the [RamBase API](https://api.rambase.net/)
and exposes **live commerce operations** to the Mosaik Storefront: **Price, Cart, Quote, and Query**
(orders/invoices). It is the **live-data counterpart** to Harmony's synced data.

It deliberately **mirrors the standard Mosaik platform API contracts** so the Next.js/React **starterkit
is reused without forking**. Geta may extend/customize a contract only where a requirement genuinely
diverges from the standard.

**Consumer:** the Mosaik Storefront only.

---

## 2. Placement & routing

- Runs in the **existing AWS EKS cluster**, alongside the other Mosaik services.
- An **Istio `VirtualService`** does **path-based routing**: the price / cart / quote / orders paths are
  routed to the Pretec Service API; all other paths go to the standard Mosaik platform services.
- The Storefront sees **one base URL** and cannot tell which service answers — no frontend fork.
- Separate-URL / frontend customization is a **fallback only** for an endpoint whose contract must diverge
  from the standard.

```
 Storefront (Next.js/React)
        │  one base URL
        ▼
   Istio VirtualService ── /price,/cart,/quote,/orders ──▶ Pretec Service API (.NET) ──▶ RamBase API
        │
        └── everything else ───────────────────────────▶ standard Mosaik platform services
```

---

## 3. Authentication

Two hops:

### Hop 1 — Storefront → Pretec Service API
- The service validates the user's **Cognito ID token** on each request.
- A **Cognito Pre-Token-Generation Lambda** injects the user's linked RamBase customer ID as a custom
  claim (`custom:rambaseCustomerId`) at login and token refresh. The service reads this claim — no
  customer ID is passed from the frontend, no extra lookup is needed.
- **Caveat:** the claim reflects the link state at token issuance. A user linked/approved *after* login
  picks up the claim only on token refresh (force a refresh on approval, or use short token lifetimes).
- The **ID token** (not the access token) is validated — avoids the Pre-Token-Generation v2/v3 trigger and
  the Cognito Plus tier.

### Hop 2 — Pretec Service API → RamBase
- The service authenticates to RamBase with a **single system/integration credential** for the whole
  integration.
- The **customer is passed as a parameter** (e.g. "price for product P, customer X"; "orders for customer X").
- *Working assumption to verify during build:* RamBase returns **customer-specific B2B prices** and supports
  customer-scoped queries via a system account.

---

## 4. Operations

### 4.1 Price
- **Batch** operation: "prices for these N products, for customer X." Listing pages need many prices at once.
- **Live** from RamBase. **Logged-in only**; anonymous users see **no prices**.
- **No caching initially** — calls RamBase directly. *Note:* a **Redis** cache (per customer+product, short
  TTL) may be added later to spare RamBase on listing pages.
- *To confirm against RamBase:* quantity-break / tiered pricing (per 100/1000/…) and whether the UI shows
  tiers / recalculates on quantity change; exact response fields (currency, unit of measure / price unit,
  discount, VAT handling).

### 4.2 Cart
- The service **owns cart state in MongoDB** (in EKS). Contract **mirrors the standard cart**.
- **Logged-in cart:** keyed by the RamBase customer (from the token claim); live prices shown.
- **Anonymous cart:** keyed by an anonymous cart/session token; **no prices shown**. Built so a future
  **anonymous "ask for offer"** can submit it as an offer request.
  - The anonymous offer **submission flow may land in a later phase**, but the cart + quote model must
    **accommodate it now** — cart is *not* architected as login-only.
- Prices are **not stored on the cart line as truth**; they are fetched live for display (see §6 resilience).

### 4.3 Quote (checkout)
- Checkout creates **one quote per submission** in RamBase (RamBase "sales quote" document), then **clears
  the cart**.
- **Always request-for-quote — there is no firm online ordering, ever.** Every submission becomes a RamBase
  quote that a Pretec sales rep converts.
- **Checkout payload:**
  - Customer reference number (the customer's own PO/reference).
  - Delivery address — **select from the RamBase customer's addresses** *or* **enter a custom address**.
  - Requested delivery date.
  - Quote comment / message.
  - **Anonymous "ask for offer"** additionally captures **name, email, company, phone**.
- **After submission:** on-screen confirmation **+ email**; a Pretec sales rep follows up in RamBase.
- Quotes do **not** appear in Min side (Min side is orders/invoices only).

### 4.4 Query (Min side — orders & invoices)
- **Read-only.** Surfaces **orders and invoices** (RamBase document chain: quote → order → shipping advice →
  invoice). **List + detail** for each.
- **Filtering:** date range, status, order number; **pagination** — using RamBase's `$filter` / `$top` /
  `$pageno`. Exact filter field names to confirm during build.
- **Scoping:** always scoped to the **customer / company** (via `$filter` on the customer from the token
  claim). **Multiple users may belong to the same company and share the same orders/invoices view.**
  Logged-in only.
- *To confirm against RamBase:* retrieval of **document PDFs** (order confirmation / invoice). Data-only on
  screen if PDFs are not exposed.

---

## 5. Data & storage

- **MongoDB** (in EKS) holds service-owned state — primarily **cart** documents (logged-in keyed by RamBase
  customer; anonymous keyed by session token).
- RamBase remains the **source of truth** for price, orders, invoices, and quotes. The service holds no
  durable copy of those beyond the in-progress cart.

---

## 6. Resilience

RamBase is a **hard runtime dependency** for price, cart pricing, and quote submission — a recognized risk.

- **Catalog/price decoupling (preferred pattern):** render the **catalog without prices first** (from synced
  catalog data — fast, no RamBase dependency), then **fetch prices afterward from the frontend** (client-side
  batch price calls once the page has rendered). Catalog stays usable even when pricing is slow/unavailable;
  prices fill in progressively and can **degrade to "price on request."**
- **Quote submission** must fail with a **clear, retryable error** — never silently drop a request.
- Timeout/retry policy for RamBase calls to be defined during design.

---

## 7. Non-functional & infrastructure

- **Runtime:** .NET service on **AWS EKS**, in the Istio service mesh with the other Mosaik services.
- **Storage:** MongoDB.
- **Environments:** **test, staging, production.**
- **Observability:** **OpenTelemetry (OTEL)** for traces/metrics/logs, visualized in **Grafana**.
- **Caching:** none initially; **Redis** an option later for price.

---

## 8. Open items to verify during build

1. **Standard Mosaik contracts** — capture the exact request/response shapes for Cart, Price, Orders, and
   Quote from the platform Swagger (`.../platform/swagger/`), which was not machine-readable during
   brainstorming. These define the contracts this service must match.
2. **RamBase price** — quantity-break/tiered pricing and the exact price response fields.
3. **RamBase query** — exact `$filter` field names for date/status/order-number; confirmation of invoice &
   credit-note resources.
4. **RamBase documents** — whether order-confirmation / invoice **PDFs** are retrievable.
5. **RamBase auth** — confirm single-system-credential + customer-by-parameter, and customer-specific pricing.
6. **Quote submission** — exact RamBase sales-quote creation endpoint and required fields; failure handling.

---

## Appendix — relationship to the overview spec

This sub-spec details **§5.9** of the overview. It powers the overview's **Pricing (§5.3)**, **Cart, Checkout
& Quote (§5.4)**, and **My Page / Min side (§5.5)** capabilities. Harmony (§5.7) handles the *synced* data
this service does **not** touch (catalog, customer, inventory, content).
