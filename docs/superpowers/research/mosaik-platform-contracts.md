# Mosaik Platform Contracts (standard) — reference for the Pretec Service API

> **Source:** captured 2026-06-09 from the Northwind test tenant Swagger UI
> `https://api-northwind-no.test.geta.mozaikcommerce.ai/platform/swagger/index.html`
> Raw artifact (verbatim OpenAPI): [`mosaik-platform-swagger.json`](./mosaik-platform-swagger.json)
>
> **Platform shape (important):** the platform is **not one API** — it exposes **one OpenAPI 3.0.4 spec per microservice** (23 specs total: `admin`, `cart`, `catalog`, `cms`, `customer`, `localization`, `notification`, `search-catalog`, `state`, `store`, `url-rewriter`, `wishlist`, each in `-public` / `-private` variants). The four relevant to this service are bundled in the raw artifact: **cart-public** (48 paths), **catalog-public** (19), **customer-public** (41), **search-catalog-public** (3).
>
> **The Pretec Service API must mirror these public contracts** so the standard Next.js/React Storefront can call it unchanged, while sourcing data from RamBase instead of the standard PIM/order engine.

All public endpoints authorize with a **bearer JWT** (`securityScheme: bearer, scheme: http, bearerFormat: JWT`). See [`## Auth`](#auth).

Money is represented two ways across services (a mirror must match the *service* it imitates):
- **cart-public:** `MoneyResponse { amount: decimal, currency: string }`; `PriceResponse { gross: MoneyResponse, net: MoneyResponse }`; `GrossPriceResponse { gross: MoneyResponse }`.
- **catalog-public:** `Money { currency: string, amount: decimal, formatted: string }`.

---

## Cart

Owned by **cart-public**. The cart is the central mirrored contract. 48 paths; the core lifecycle subset the Storefront uses:

| Method | Path | Purpose |
|---|---|---|
| POST | `/carts` | Create cart (`CreateCartRequest`) → `CartResponse` |
| GET | `/carts/{id}` | Get cart → `CartResponse` |
| PATCH | `/carts/{id}` | Patch cart (`CartPatchRequest`) |
| DELETE | `/carts/{id}` | Delete cart |
| GET | `/carts/users-last-active-cart` | Resume the signed-in user's active cart |
| POST | `/carts/{cartId}/order-lines` | Add lines (`AddOrderLineToCartRequest`) |
| POST | `/carts/{cartId}/order-lines/{orderLineId}/update` | Update line qty (`UpdateOrderLineQuantityRequest`) |
| DELETE | `/carts/{cartId}/order-lines/{orderLineId}` | Remove line |
| POST | `/carts/{cartId}/add-signed-in-customer` / `add-customer` / `add-customer-by-id` | Attach customer to cart |
| PUT | `/carts/{id}/billing-address` | Set billing address |
| POST | `/carts/{id}/validate` | Validate cart |
| POST | `/carts/{id}/change-store` | Change store context |
| POST | `/carts/{id}/create-shopping-list` | Persist cart as shopping list |
| POST | `/carts/{id}/create-order-request` | **Submit as "order request"** — see [`## Quote`](#quote) |

> The remaining ~30 paths are payment/checkout integrations (Klarna, Adyen, Nets, Walley), coupons, gift cards, shipping options, tags. The Pretec flow uses RamBase quote/order creation instead of these PSP checkouts (see Gaps), so most are **not** mirrored.

### `CartResponse`
```
id: string
price: PriceResponse                 (gross+net)
originalPrice: GrossPriceResponse
status: string
lineItems?: CartOrderLineItemResponse[]
sumLineItemQuantities: decimal
shippingMethods: CartShippingMethodResponse[]
payments: CartPaymentResponse[]
remainingPayment: MoneyResponse
reference, internalComment, customerComment: string
requestedDeliveryDate?: date-time
discounts: DiscountResponse[]
isReadOnly: boolean
name: string
tags: string[]
type: string                         (e.g. cart vs order-request)
storeId, companyId, customerId: string
created, updated: date-time
properties: object                   (free-form extension bag)
```

### `CartOrderLineItemResponse`
```
id, productId, sku: string
quantity: decimal
unit, brand, name, displayName, color, size: string
image: ImageDetails
discounts: DiscountResponse[]
originalPrice, originalUnitPrice: PriceResponse
discountedPrice, discountedUnitPrice: PriceResponse
extendedPrice, extendedUnitPrice: PriceResponse
taxRate?: decimal
```

### Requests
```
CreateCartRequest      { storeId?, companyId?, marketId?, name?, tags?[], type?, lineItems?: OrderLineRequest[], properties? }
OrderLineRequest       { sku: string, quantity: decimal, unit?: string }
AddOrderLineToCartRequest  { orderLines: OrderLineRequest[] }
UpdateOrderLineQuantityRequest { quantity: decimal, unit?: string }
DiscountResponse       { discountAmount: MoneyResponse, discountPercent?: decimal, couponCode?: string }
```

**Cart keying for the mirror:** `companyId` (B2B account) + `customerId` are first-class fields on both the create request and the response. Anonymous carts carry neither and are addressed only by `id`. This drives the Mongo cart schema decision (Task 4).

---

## Price

There is **no standalone or batch price endpoint**. Price is **embedded** in the catalog/search read models and computed per context:

- **catalog-public `GET /products/{id}`** — query params `marketId`, `storeId`, `companyId` (all optional). Returns `ProductResponse.price: PriceResponse` and per-variant `ProductVariant.price: PriceResponse`.
- **catalog-public `GET /products/{id}/variants`**, `/related`, `/recommendations`, `/product-groups/{groupId}/products` — same embedded `PriceResponse`.
- **search-catalog-public `GET /search`** — query params include `MarketId`, `StoreId`, `CompanyId`, returns hits with `ItemPrice` / `ItemPriceSet`.

### catalog `PriceResponse` (the price contract to mirror)
```
unitPrice: Money                     { currency, amount, formatted }
minimumQuantity: decimal             ← tier/quantity-break threshold (one row per response)
discountAmount: decimal
discountPercent: decimal
originalUnitPrice: Money
recommendedRetailPrice: Money
promotionId, promotionName: string
marketId, storeId: string
taxRate?: decimal
properties: object
```

**Customer scoping:** the only customer dimension the standard contract exposes is **`companyId`** (B2B company), passed as a query param; price is otherwise market/store driven from the PIM. `minimumQuantity` exists but a single response carries **one** price row, not a full tier table.

> This is the central thing the Pretec service **changes**: it must return RamBase **customer-contract** prices (per RamBase customer, with real quantity breaks) inside this same `PriceResponse` shape, scoped by the authenticated customer rather than by `companyId` query param. See Gaps.

---

## Orders

Owned by **cart-public** (read contract the Storefront's order-history uses):

| Method | Path | Returns |
|---|---|---|
| GET | `/orders` | `SearchOrdersPagedOrderResponse` (v1 list) |
| GET | `/orders/{id}` | `OrderResponse` |
| GET | `/v2/orders` | v2 list |
| POST | `/v2/orders/{orderId}/cancel` | cancel |

### `OrderResponse`
```
id, orderNumber: string
marketId, storeId, currency: string
customer: OrderCustomerResponse
salesPersonId, salesPersonName, salesChannel: string
status, orderType, orderOrigin: string
isReadOnly: boolean
created: date-time;  createdBy: string;  lastModified?: date-time
orderForms: OrderFormResponse[]      (lines live here)
orderNotes: OrderNoteResponse[]
requestedDeliveryDate?, updateStatusDate?: date-time
internalComment, reference: string
tags: string[]
references: object;  properties: object
```

### list models
```
SearchOrdersPagedOrderResponse { items: OrderResponse[], totalCount: int }
OrderSearchResponse            { items: OrderSearchHit[], totalCount: int }
OrderSearchHit                 { id, orderNumber, status, reference, internalComment,
                                 created, createdBy, orderType,
                                 price: OrderSearchHit_PriceDto, tags[], properties, references }
```

**No `$filter`-style query params on `/orders`** in the public spec (filtering is server-side by the authenticated principal). The Pretec service mirrors this read shape but sources orders from RamBase Sales Orders / invoices (Task 2) and must map RamBase order fields → `OrderResponse`/`OrderSearchHit`.

---

## Quote

The standard platform has **no `quote` service**. The closest native mechanism is:

- **cart-public `POST /carts/{id}/create-order-request`** — *"Create order with type 'order request'"* (`operationId: Carts_CreateOrderRequest`). Optional header `X-Session-Id`. Secured `bearer`. Returns `CreateOrderFromCartResponse { orderId: string }`.

This is the platform's "submit cart for processing without going through a PSP checkout" path — effectively the **request-for-offer / quote-submission** primitive. A cart's `type` field (`CartResponse.type`) distinguishes a normal cart from an order-request.

For the Pretec flow this maps to **RamBase sales-quote creation** (Task 2 §Quote): the service receives `create-order-request` (or an equivalent quote submit), creates a RamBase quote, and returns an id in the `CreateOrderFromCartResponse` shape. The richer quote fields (delivery address selection, requested date, line comments, anonymous/lead handling) are **not** in the standard contract and must be added by Pretec — see Gaps.

---

## Auth

- **Scheme (all four services):** `securitySchemes.bearer = { type: http, scheme: bearer, bearerFormat: JWT }`. Endpoints declare `security: [{ bearer: [] }]`. Token passed as `Authorization: Bearer {token}`.
- **The bearer token is the `idToken`** — issued by **customer-public**:
  - `POST /auth/sign-in` — `SignInRequest { userName, password }` → `TokenResponse { refreshToken, idToken, tokenType, expiresOn(int) }`.
  - `POST /auth/refresh` — `RefreshTokenExchangeRequest { token }` → `ExchangeRefreshTokenResponse { idToken, tokenType, expiresOn }`.
  - `POST /external-identity/exchange-token` → `TokenResponse` — exchange an external IdP token for a platform token.
  - `POST /external-identity/sync-customer` — sync external identity to a platform customer.
- **Customer context** for B2B: customer-public exposes `/companies/*`, `/customers/*`, `GET /customers/current`. A signed-in principal resolves to a customer/company; that identity (not a query param) is what scopes orders.

> **Alignment with the Pretec design:** the platform already treats the **`idToken` as the bearer**, and supports **external-identity exchange**. The Pretec design's AWS Cognito ID token with an injected `custom:rambaseCustomerId` claim fits this model directly — the service reads the customer id from the validated JWT, exactly as the standard customer-context endpoints do. (Decision detail → Task 4 `## Cognito claim injection`.)

---

## Gaps — what the standard platform does NOT define (Pretec must extend, not mirror)

1. **Customer-contract pricing.** The standard `PriceResponse` is scoped only by `marketId/storeId/companyId` query params and returns a **single** price row. It has no concept of per-RamBase-customer contract prices or a full **quantity-break tier table**. Pretec must return RamBase customer prices within the same `PriceResponse` shape, scoped by the **authenticated** customer. *(Confirm RamBase tier-price fields in Task 2 §Price.)*
2. **No price batch endpoint.** Price rides on product/search reads. A catalog page renders products first, then needs customer prices — the standard contract offers no bulk "prices for these N SKUs" call. Pretec likely needs a **batch price endpoint** the Storefront calls after render (resilience handshake → Task 4 `## Resilience policy`).
3. **No quote service.** Only `create-order-request` (returns just `{orderId}`). Missing: quote line comments, delivery-address selection vs custom address, requested delivery date at submission, **anonymous/lead** quote (no existing customer). Pretec adds these, mapping to RamBase quote creation (Task 2 §Quote).
4. **No order/invoice query filters.** Public `/orders` has no date-range/status/PO-number `$filter`. If the Storefront needs filtered history, Pretec must add query params (mapping to RamBase `$filter` — Task 2 §Orders & Invoices).
5. **No document/PDF retrieval.** Nothing in the four specs returns order-confirmation or invoice PDFs. If required, Pretec adds it from RamBase documents (Task 2 §Documents).
6. **Anonymous cart → offer linkage.** `CartResponse` carries `companyId/customerId` for signed-in carts and `type` to mark an order-request, but there is no native "anonymous cart becomes a lead/offer on sign-up" flow. Pretec's Mongo cart schema must model the anonymous→customer transition (Task 4 `## Cart document schema`).
