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
- **Logged-in only.** Cart is not available to anonymous users — login is required to access the cart or check out.
- **Logged-in cart:** keyed by the RamBase customer (from the token claim); live prices shown.
- Prices are **not stored on the cart line as truth**; they are fetched live for display (see §6 resilience).

### 4.3 Quote (checkout)
- Checkout creates **one quote per submission** in RamBase (RamBase "sales quote" document), then **clears
  the cart**.
- **Always request-for-quote — there is no firm online ordering, ever.** Every submission becomes a RamBase
  quote that a Pretec sales rep converts.
- **Login required** — only authenticated, linked users may submit a quote.
- **Checkout payload:**
  - Customer reference number (the customer's own PO/reference).
  - Delivery address — **select from the RamBase customer's addresses** *or* **enter a custom address**.
  - Requested delivery date.
  - Quote comment / message.
- **After submission:** on-screen confirmation **+ email**; a Pretec sales rep follows up in RamBase.
- Quotes do **not** appear in Min side (Min side is orders/invoices only).

### 4.4 Query (Min side — orders & invoices)
- **Read-only.** Surfaces **orders and invoices** (RamBase document chain: quote → order → shipping advice →
  invoice). **List + detail** for each.
- **Filtering:** date range, status, order number; **pagination** — using RamBase's `$filter` / `$top` /
  `$pageKey` (cursor-based; `$inlineCount=allpages` for total count — *not* `$pageno`, see research). Exact
  `$filter` field names to confirm during build.
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

> **Discovery status (2026-06-09).** Items below are resolved against the research docs under
> `docs/superpowers/research/`: [`mosaik-platform-contracts.md`](../research/mosaik-platform-contracts.md),
> [`rambase-api-audit.md`](../research/rambase-api-audit.md),
> [`service-api-decisions.md`](../research/service-api-decisions.md). ✅ = answered, ⚠️ = needs a human.

1. ✅ **Standard Mosaik contracts** — **RESOLVED.** Captured as a machine-readable bundle
   ([`mosaik-platform-swagger.json`](../research/mosaik-platform-swagger.json), 4 specs / 111 paths) and
   summarized in [`mosaik-platform-contracts.md`](../research/mosaik-platform-contracts.md). Key finding: the
   platform is **per-service** (cart-public, catalog-public, customer-public, search-catalog-public). Cart **and
   orders** (`/orders`, `/v2/orders`) live in cart-public; the quote trigger is
   `POST /carts/{id}/create-order-request`; price is **embedded** in catalog/search reads (no batch endpoint —
   Pretec must add `/prices`). See the doc's **Gaps** section for what must be extended, not mirrored.
2. ⚠️ **RamBase price** — **UNRESOLVED (needs RamBase API credentials).** No public customer-price lookup
   endpoint; price is calculated within a quote/order item context. Whether RamBase exposes a price-suggestion
   endpoint for `(product, customer, qty)` and returns **quantity-break tiers** must be confirmed with a
   credentialed integration. Known price field vocabulary captured in
   [`rambase-api-audit.md` §Price](../research/rambase-api-audit.md). **Blocks the Price build slice.**
3. ✅/⚠️ **RamBase query** — **MOSTLY RESOLVED.** Sales **Order** list/detail/items endpoints and fields are
   fully specified from the public OpenAPI sample; pagination is cursor-based **`$top`/`$pageKey`** with
   `$inlineCount=allpages`. ⚠️ Exact `$filter` field paths/operators for date/status/PO, and the **Sales
   Invoice (CIN)** resource + **credit notes**, are behind the credentialed portal — see audit §Orders & Invoices.
4. ⚠️ **RamBase documents** — **UNRESOLVED (needs RamBase contact).** No public REST endpoint for order-confirmation
   / invoice **PDFs** found; RamBase uses a Document-Messages mechanism + PEPPOL. Confirm API retrievability or
   drop PDF download. See audit §Documents.
5. ✅/⚠️ **RamBase auth** — **RESOLVED for the integration model:** OAuth2 **Client-Credentials**
   (`POST /oauth2/access_token`), Bearer header, short-lived token, `$db` selects the company; customer-scoped
   **orders** are reachable via `$filter`. ⚠️ One open point: confirm a single system account may read **prices**
   for any customer by parameter. See audit §Auth.
6. ⚠️ **Quote submission** — **UNRESOLVED (needs RamBase API credentials).** The CRQ→CQU→COA flow is confirmed,
   but the create-quote endpoint, required fields, and **anonymous/lead** representation are behind the
   credentialed portal. See audit §Quote. **Blocks the Quote build slice.**

**Design decisions now fixed** (see [`service-api-decisions.md`](../research/service-api-decisions.md)): MongoDB
cart schema + keys + TTL + anonymous→offer transition (§1); Cognito ID-token claim injection + refresh-on-approval
+ missing-claim handling (§2); the Istio route list (§3); resilience timeouts/retries/breaker + catalog-price
handshake (§4).

**Still blocked:** documenting the existing **.NET service conventions** (solution layout, DI, config, Mongo,
Cognito handler wiring, OTEL, k8s/Istio chart locations) requires access to a service **repository**, which is
not in this docs-only workspace — see decisions doc §0. This blocks a fully concrete code-level build plan.

---

## Appendix — relationship to the overview spec

This sub-spec details **§5.9** of the overview. It powers the overview's **Pricing (§5.3)**, **Cart, Checkout
& Quote (§5.4)**, and **My Page / Min side (§5.5)** capabilities. Harmony (§5.7) handles the *synced* data
this service does **not** touch (catalog, customer, inventory, content).
