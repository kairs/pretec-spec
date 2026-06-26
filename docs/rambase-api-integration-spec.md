# RamBase API Integration Specification

**Date:** 2026-06-25
**Status:** Complete (open items require RamBase credentials — see §7)
**Audience:** Pretec and Geta
**Scope:** How Geta's services authenticate to and call the RamBase API — the shared integration foundation under Price, Cart, Quote, and Query
**Index ref:** [spec-index.md](spec-index.md) → I-6
**Consolidates:** [RamBase API Audit](superpowers/research/rambase-api-audit.md) · [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

This specification describes the RamBase API integration model used by the Pretec Service API — how authentication works, how requests are scoped, how data is queried and paginated, and which RamBase resources are in use. It is the shared reference for all RamBase-facing operations.

---

## 2. Authentication — Service API → RamBase

### 2.1 Flow

The Pretec Service API uses **OAuth 2.0 Client Credentials** — a server-to-server flow where the application acts on behalf of itself, not a specific user.

| Property | Value |
|---|---|
| Grant type | `client_credentials` |
| Token endpoint | `POST https://api.rambase.net/oauth2/access_token` |
| Token format | Short-lived Bearer access token |
| Refresh token | None — Client Credentials does not issue a refresh token |
| Token reuse | Token is cached until expiry or a 401 response, then re-requested |
| Transmission | `Authorization: Bearer ACCESS_TOKEN` header (never query param) |

### 2.2 Credentials

RamBase issues a **client id / client secret** pair per integration, scoped to specific API resources. Separate credentials are required for each environment:

| Mosaik environment | RamBase environment | Credentials |
|---|---|---|
| Test | RamBase Test | Credential set A |
| Staging / UAT | RamBase Test | Credential set A (shared) |
| Production | RamBase Production | Credential set B |

Credentials are stored as secrets in the EKS cluster (not in source control). Rotation is managed per [X-5 Security & privacy](security-privacy-spec.md).

Pretec must provision credentials scoped to the following resources:
- Sales Orders (COA)
- Sales Customers (CUS)
- Product / Price (ART, IPA, PLI)
- Sales Quote (CRQ / CQU)
- Sales Invoice (CIN) — if and when invoice history is added

### 2.3 Company / database selection

Every RamBase API request includes the **`$db`** query parameter to select the target company database. The integration uses the correct `$db` value per environment.

### 2.4 Customer scoping

The integration uses a single system credential for all customers. Customer-specific data is accessed by passing the **RamBase customer ID as a filter parameter** on each call — the Service API resolves this from the Mosaik user↔customer mapping. The frontend never sends the customer ID.

Example (orders): `GET /sales/orders?$db=<co>&$filter=customer.customerId eq <id>&$top=50&$inlineCount=allpages`

---

## 3. Query parameters

All RamBase list endpoints support these standard query parameters:

| Parameter | Purpose |
|---|---|
| `$db` | Company database (required) |
| `$filter` | Filter expression (field-operator-value syntax) |
| `$orderBy` | Sort field and direction |
| `$top` | Page size (default 10, max per resource) |
| `$pageKey` | Cursor-based paging — values: `first` / `previous` / `next` / `last` |
| `$inlineCount=allpages` | Include total row count in the response |
| `$select` | Limit returned fields |
| `$expand` | Expand nested fields (e.g. `$expand=PriceConverted`) |
| `$showDomainValues=true` | Return text descriptions for numeric domain/status codes |
| `$showCustomFields` | Include custom fields |
| `$lang` | Response language (ISO-639-1) |

> Many RamBase fields are numeric domain codes (e.g. `status: integer`). Pass `$showDomainValues=true` to get readable labels. The Service API maps these to the Storefront's string values.

---

## 4. RamBase resources in use

### 4.1 Sales Orders (COA)

Used by: Min side order history (F-6)

- List: `GET /sales/orders`
- Detail: `GET /sales/orders/{salesOrderId}`
- Line items: `GET /sales/orders/{salesOrderId}/items`

Key fields: `salesOrderId`, `status`, `registrationDate`, `customersReferenceNumber` (PO), `customer.customerId`, `shippingAddress`, `totals`, `salesOrderItems[].price`.

Pagination: cursor-based (`$top` / `$pageKey` with `$inlineCount=allpages`).

### 4.2 Sales Customers (CUS)

Used by: customer resolution, delivery address lookup (checkout F-5), customer sync (I-4)

- Detail / list via `GET /sales/customers/{customerId}` and list endpoint.

### 4.3 Products & Price (ART / IPA / PLI)

Used by: price display (F-3)

Price in RamBase is resolved from **Item Price Agreements (IPA)** linked to the customer and product. An IPA defines a fixed price, discount, or margin — time-bounded with valid-from/valid-to dates.

See [definitions.md](definitions.md) for the IPA model detail (customer scope, product scope, discount basis, rounding).

> **UNRESOLVED:** The price-suggestion / price-lookup endpoint for `(product, customer)` is behind the credentialed portal — see §7.

### 4.4 Sales Quotes (CRQ / CQU)

Used by: quote submission (F-5)

Document chain: **CRQ (Sales Quote Request) → CQU (Sales Quote) → COA (Sales Order)**. The storefront's `create-order-request` maps to creating a CRQ or CQU in RamBase. Pretec Sales converts the quote to a Sales Order.

> **UNRESOLVED:** The create-quote endpoint and required field schema are behind the credentialed portal — see §7.

### 4.5 Documents / PDFs

PDF retrieval (order confirmations, invoices) is not in scope for Phase 1. RamBase uses a Document Messages mechanism and PEPPOL for output — no public REST endpoint for PDF retrieval was found. See §7.

---

## 5. Error handling and resilience

- **401 on a request:** re-request the access token and retry once.
- **Timeouts / 5xx:** follow the retry and circuit-breaker policy in [X-4 Resilience](resilience-spec.md).
- **Rate limits:** to be confirmed with RamBase during integration setup.

Quote submission must fail with a **clear, retryable error** — never silently drop a request. See [F-5 §5.3](checkout-quote-spec.md).

---

## 6. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Integration build | Build and operate Pretec Service API | Provide RamBase access; provision credentials per environment |
| Credential management | Store in EKS secrets; rotate as needed | Issue credentials scoped to required resources |
| `$db` value per environment | Configure per environment | Confirm RamBase company database value per environment |
| Customer-scoping model | Implement `$filter` per call | Confirm system account can read any customer's data by parameter |
| Domain code mapping | Map RamBase numeric codes to Storefront strings | Confirm Norwegian display labels for order status values |

---

## 7. Open items — require RamBase API credentials

These items cannot be resolved from the public API documentation and require a credentialed connection to the RamBase portal or direct contact with RamBase.

| # | Area | Question |
|---|---|---|
| 1 | **Price** | Is there a price-suggestion / price-lookup endpoint for `(product, customer)` without creating a quote? If not, what is the fallback approach? |
| 2 | **Price — system account scope** | Can one Client-Credentials integration account retrieve customer-specific prices for any customer by passing the customer ID as a parameter? |
| 3 | **Order filters** | Exact `$filter` field paths and operators for: date range on `registrationDate`, order `status` domain values, PO number filter field |
| 4 | **Quote create** | Create-quote endpoint (path + method), required vs optional fields: `customerId`, delivery address (existing `addressId` vs custom), `requestedDeliveryDate`, header/line comments, line items |
| 5 | **PDF retrieval** | Is the PDF of a sales-order confirmation or invoice retrievable via API? If yes: endpoint, format, authentication |
| 6 | **Rate limits** | Per-resource rate limits and throttling behaviour |

**Recommended action:** Pretec provisions RamBase API Client-Credentials scoped to Sales Order, Sales Customer, Product/Price, Sales Quote, and Sales Invoice. With credentials, all items above can be resolved from the credentialed portal.

---

## 8. Related specs

- [superpowers/research/rambase-api-audit.md](superpowers/research/rambase-api-audit.md) — raw API research (source for this spec)
- [authentication-spec.md](authentication-spec.md) — A-1 Service API auth model (Storefront→Service API hop)
- [environments-spec.md](environments-spec.md) — X-2 environment mapping (Mosaik ↔ RamBase)
- [resilience-spec.md](resilience-spec.md) — X-4 timeout, retry, and circuit-breaker policy
- [security-privacy-spec.md](security-privacy-spec.md) — X-5 credential storage and rotation
- [definitions.md](definitions.md) — RamBase document types and IPA price model
