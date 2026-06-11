# RamBase API Audit — for the Pretec Service API

> **Sources (captured 2026-06-09):**
> - Public OpenAPI sample: `https://api.rambase.net/openapi/v3/json` → saved verbatim as [`rambase-openapi-sample.json`](./rambase-openapi-sample.json) (OpenAPI 3.0.4, server `https://api.rambase.net`). **This public spec covers only Sales Orders + Sales Customers** (6 paths); it is a *sample*, not the full catalog.
> - Getting-started: [`/gettingstarted/gettingaccess`](https://api.rambase.net/gettingstarted/gettingaccess), [`/gettingstarted/queryparameters`](https://api.rambase.net/gettingstarted/queryparameters), [`/gettingstarted/openapi`](https://api.rambase.net/gettingstarted/openapi).
> - Doc portal (`api.rambase.net/documentation`) and help center (`help.rambase.net`).
>
> **Key limitation found:** the full RamBase resource catalog (Product **price**, Sales **Quote** CQU/CRQ, Sales **Invoice** CIN, document/print) is served by a **JavaScript SPA documentation portal that requires API client credentials** to enumerate operation-level fields. The public, anonymously-readable surface is the Sales Order + Customer OpenAPI sample only. Items the public surface cannot answer are flagged **`UNRESOLVED — needs RamBase contact`** with the exact question to ask, per the discovery plan.

---

## Auth & company

**Flow (server-to-server):** OAuth 2.0 **Client Credentials** — *"used when the application is acting on behalf of the application itself, and not on a specific user."* This is the integration credential the Pretec service uses.

- **Token endpoint:** `POST https://api.rambase.net/oauth2/access_token` with `grant_type=client_credentials` (+ client id/secret). Returns a **short-lived access token, no refresh token** → the service re-requests a token on expiry (cache token, refresh on 401/expiry).
- **Server-side web app flow** (not used here) additionally issues a refresh token, exchanged via `grant_type=refresh_token`.
- **Token transmission:** `Authorization: Bearer ACCESS_TOKEN` (recommended) or `$access_token=` query param (discouraged — logging/URL-length). **Use the header.**
- **Credential provisioning:** client id/secret are issued by RamBase on request, scoped to specific API resources and a chosen auth flow. The integration must declare which resources (orders, customers, prices, quotes, invoices) it needs.
- **System selection:** a `target` parameter selects which RamBase system; optional `customerid` / `supplierid` can be bound at Client-Credentials auth time.
- **Company / database:** the global **`$db`** query param designates the company database for each request.

**Customer-scoped data with a system account:** the Sales Order and Customer resources expose customer scoping via **`$filter`** (e.g. filter orders by `customer.customerId`) and the `customerId` path on `/sales/customers/{customerId}`. So a system integration can read a specific customer's orders by filtering. **However**, whether a single system credential may read *prices for an arbitrary customer* by passing the customer as a parameter is **not stated** in the public auth docs.
> **UNRESOLVED — needs RamBase contact:** Can one Client-Credentials integration account retrieve **customer-specific sales prices** for any customer by passing the customer id as a parameter/filter (vs. needing per-customer authorization or the `customerid` auth-time binding)? Confirm the resource + permission required.

---

## Global query, filtering & pagination

Confirmed from the OpenAPI sample (present on every list endpoint) and the query-parameters page:

| Param | Meaning |
|---|---|
| `$db` | Company database to target (required to pick the company). |
| `$filter` | Filter the result set. Syntax/operators on the "Filtering and sorting" doc page. |
| `$orderBy` | Sort the result. |
| `$top` | Page size; **default 10**, max is per-resource. |
| `$pageKey` | **Cursor-based** paging: `first` / `previous` / `next` / `last` — *not* numeric offsets/`$pageno`. |
| `$inlineCount=allpages` | Include total row count in the response. |
| `$select` | Comma-separated fields to limit the response. |
| `$expand` | Comma-separated expandable nested fields (e.g. `$expand=PriceConverted`). |
| `$showDomainValues` (a.k.a. `$showDomainDescriptions`) | Add human descriptions for coded/domain fields (e.g. numeric `status`). Default false. |
| `$showCustomFields` | Include custom fields. Default false. |
| `$format` | `json` (default), `jsonstream`, `xml`, `html`. |
| `$lang` | Response language (ISO-639-1). |

> Note: many RamBase fields are **numeric domain codes** (e.g. `status: integer`, item `type: integer`). Pass `$showDomainValues=true` to get their text. The Pretec service must map these codes to the Storefront's string `status`/`orderType`.

---

## Orders & Invoices (query)

### Sales Orders — **fully specified in the public spec**

- **List:** `GET /sales/orders` → `{ salesOrders: [...], paging: Paging }`. Supports all global params above.
- **Detail:** `GET /sales/orders/{salesOrderId}` → `{ salesOrder: {...} }`.
- **Items:** `GET /sales/orders/{salesOrderId}/items` → `{ salesOrderItems: [...], paging }`; `GET /sales/orders/{salesOrderId}/items/{itemId}` → `{ salesOrderItem: {...} }`.

**`salesOrder` detail fields (selected):**
```
salesOrderId:int, status:int(domain), type:string, createdAt:date-time, registrationDate:date
sellersReferenceNumber, customersReference, customersReferenceNumber: string   ← PO number lives here
currency:string, note:string, grossMargin:double, netWeight:double
customer { customerId:int, name, firstname, phone, email, customerLegalEntity, customerLink }
shippingAddress { addressId, name, addressLine1/2, postalCode, city, region, countryCode, country, externalReference }
invoiceAddress  { addressId, name, addressLine1/2, postalCode, city, region, countryCode, country }
totals { currency, freightAmount, feeAmount, subTotalAmount, vATAmount, totalAmount, grossMarginAmount }
totalsConverted { currency, exchangeRate, ...same amounts }
payment { paymentTerms, paymentMethod, dueDate }
shipment { deliveryTerms, deliveryTermPlace, shippingService, ... }
vATDetails { vATType, vATHandling, defaultVATPercent }
location, assignee, management, highlightedNotification, salesDeliveryProject, service
```
**`salesOrderItem` detail fields (selected — these are the line + price fields):**
```
salesOrderItemId:int, lineNumber:int, status:int, type:int
quantity:double, remainingQuantity, shippedQuantity, allocatedStockQuantity
requestedDeliveryDate:date, confirmedDeliveryDate:date, scheduledShippingDate:date
productDescription, customersProductName, note: string
vATPercent:double, discountPercent:double, grossMargin:double
price { currency, grossPrice, discount, netPrice, expectedPrice }      ← line price contract
priceConverted { currency, grossPrice, netPrice }
totals { currency, grossAmount, discountAmount, netAmount, remainingAmount, grossMarginAmount }
measurementUnit { measurementUnitId, unit, precision }
product { productId, name, type, countryOfOriginCode, manufacturer, stock, latestProductRevision, productLink }
```

**Customer scoping:** filter the list by the customer, e.g. `GET /sales/orders?$db=<co>&$filter=customer.customerId eq <id>&$top=50&$inlineCount=allpages`. *(Exact `$filter` field path to confirm against the live resource — the spec models `customer.customerId`; RamBase `$filter` typically uses the dotted field path.)*

> **Date-range / status / PO-number filtering:** these map to `$filter` over `registrationDate`/`createdAt` (date range), `status` (domain code), and `customersReferenceNumber` (PO). The public spec confirms the **fields exist**; the exact `$filter` operator names per field are on the (SPA) "Filtering and sorting" page.
> **UNRESOLVED — needs RamBase contact / credentialed portal:** confirm the exact `$filter` field paths + operators for (a) date range on `registrationDate`, (b) `status` domain values for "open/confirmed/shipped/invoiced", (c) PO number filter field.

### Sales Invoices (CIN) — **not in the public spec**

The public OpenAPI sample does **not** include the Sales Invoice resource. RamBase has a Sales Invoice (CIN) application (Finance ▸ Receivables ▸ Sales invoicing) and supports PEPPOL 3.0 e-invoices, but the REST resource/fields are behind the credentialed portal.
> **UNRESOLVED — needs RamBase contact / credentialed portal:** the Sales Invoice resource path (likely `/finance/...` or `/sales/...`), its list/detail fields (invoice number, dates, status, lines, totals, due date), customer `$filter` field, and whether **credit notes** are the same resource with a type/sign or a separate resource.

---

## Price

**Finding:** RamBase has **no public, dedicated "get the price for product X, customer Y, quantity Q" lookup endpoint.** In RamBase, price is **calculated within a document item context** (quote/order item) from the customer's **price agreements / price lists / price templates** (Product module). The only price contract visible in the public spec is the **sales-order-item price** (above):
```
price { currency, grossPrice, discount, netPrice, expectedPrice }   + vATPercent, discountPercent, measurementUnit.unit
```
This tells us RamBase's price field vocabulary (gross/net/discount/discountPercent/VAT/currency/unit) but it is the *resulting* line price, not a pre-order catalog lookup.

RamBase concepts relevant to the Pretec customer-price requirement (from help center):
- **Price templates / price lists** linked to a customer (Product ▸ price management; `PriceList { priceListId, name }` appears as a customer/order association in the spec).
- **Suggested price** in the Sales Quote app — i.e. price is resolved when an item is added to a quote/order.
- `$expand=PriceConverted` expands converted-currency price fields.

> **UNRESOLVED — needs RamBase contact / credentialed portal (BLOCKS the Price operation design):**
> 1. Is there a **price-calculation / price-suggestion endpoint** that returns the net price for `(product, customer)` *without* creating a quote/order? (Pretec needs this for catalog price display.) If not, the fallback is "create a draft quote item to read the price," which has cost/cleanup implications.
> 2. ~~Quantity-break / tiered pricing~~ — **not in use at Pretec.** A single price per (product, customer) is sufficient; no tier table required.
> 3. The exact price fields for that endpoint: net, gross, currency, **price unit / unit-of-measure**, discount, **VAT handling**, and validity dates.

---

## Quote (create)

**Finding:** the Sales Quote document chain is confirmed conceptually — **CRQ (Sales Quote Request) → CQU (Sales Quote) → COA (Sales Order)** — and the Sales Quote app supports customer selection, line items (product + quantity), delivery details, and price suggestion. But the **create endpoint and required-field schema are not in the public spec** (behind the credentialed portal).

What maps from the Mosaik side (see [`mosaik-platform-contracts.md` §Quote](./mosaik-platform-contracts.md#quote)): the Storefront's `POST /carts/{id}/create-order-request` ("order request") is the trigger; Pretec translates it into a RamBase quote.

> **UNRESOLVED — needs RamBase contact / credentialed portal:**
> 1. The **create-quote** endpoint (likely `POST /sales/quotes` for CQU, or the CRQ resource) — path + method.
> 2. **Required vs optional** fields to create a quote: customer reference (`customerId`), delivery address (select existing `addressId` vs. supply a custom address), `requestedDeliveryDate`, header/line `note`/comment, and line items (`product`, `quantity`, `unit`, `customersReferenceNumber`).
> 3. How an **anonymous / lead** quote (no existing RamBase customer) is represented — a generic/"walk-in" customer id, a lead/prospect entity, or a customer created on submit. *(This is the "ask for offer" flow in the Pretec design; the standard Mosaik platform has no native anonymous-quote concept either — see Gaps in the contracts doc.)*

---

## Documents / PDFs

**Finding:** RamBase produces output via a **Document Messages** mechanism and supports **PEPPOL 3.0** electronic invoices. No **public** REST endpoint for retrieving an **order-confirmation or invoice PDF** was found.

> **UNRESOLVED — needs RamBase contact / credentialed portal:** Is the PDF/printed form of a sales-order confirmation or sales invoice retrievable via the API (endpoint + returned format/`$format`, or a document-message/attachment resource)? If not API-retrievable, the Pretec design must drop "download confirmation/invoice PDF" or source it elsewhere.

---

## Summary: answered vs. needs-a-human

| Area | Status |
|---|---|
| Auth flow, token endpoint, header, `$db`, system account | **Answered** |
| Whether one system account reads any customer's **prices** | UNRESOLVED |
| Global query params, `$filter`/`$orderBy`/`$top`/`$pageKey`/`$inlineCount` semantics, pagination | **Answered** |
| Sales **Order** list+detail+items endpoints & fields | **Answered** (public spec) |
| Order `$filter` field paths/operators for date/status/PO | UNRESOLVED (fields exist; exact operators behind portal) |
| Sales **Invoice** resource & fields, credit notes | UNRESOLVED |
| **Price** lookup endpoint (customer+qty, tiers) | UNRESOLVED (blocks Price operation design) |
| **Quote** create endpoint, required fields, anonymous/lead | UNRESOLVED |
| **Document/PDF** retrieval | UNRESOLVED |

**Recommended next action (for the user):** request RamBase API client credentials (Client-Credentials flow) scoped to: Sales Order, Sales Customer, **Product/Price**, **Sales Quote (CQU/CRQ)**, **Sales Invoice (CIN)**, and document/output resources. With credentials, the full operation-level field specs become enumerable from the portal and every UNRESOLVED item above can be closed. Until then, the **Price** and **Quote** build slices cannot be made concrete.
