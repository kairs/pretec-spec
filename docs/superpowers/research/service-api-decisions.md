# Pretec Service API — Design Decisions (post-discovery)

> Turns the discovery findings into the concrete decisions the build plan assumes.
> **Inputs:** [`mosaik-platform-contracts.md`](./mosaik-platform-contracts.md), [`rambase-api-audit.md`](./rambase-api-audit.md), sub-spec [`2026-06-08-pretec-service-api-design.md`](../specs/2026-06-08-pretec-service-api-design.md).

---

## 0. Blocker — Task 3 (.NET service conventions) not done

**Status: BLOCKED — needs the service repository.** This `docs`-only workspace (`.claude/`, `.git/`, `docs/`) contains **no .NET service code** — no `*.sln`, `*.csproj`, `Program.cs`, or `appsettings*.json`. Task 3 of the discovery plan (document the existing Mozaik .NET service conventions: solution layout, target framework, DI, config, Mongo driver/repository pattern, Cognito JWT handler wiring, OTEL setup, k8s/Istio chart locations) **cannot be completed** here.

**Consequence:** the decisions below are specified at the **design level** (shapes, keys, policies, route list) but **cannot yet be pinned to concrete file paths, namespaces, or the team's exact DI/config/Mongo/auth idioms.** Per the discovery plan this blocks **Task 5** (the code-level build plan) from being made fully concrete.

**To unblock:** point me at an existing Mosaik .NET service repo (a representative one in the same EKS cluster), or the new service's scaffold. Then Task 3 + Task 5 can be finished.

---

## 1. Cart document schema (MongoDB)

The contract the API returns mirrors Mosaik `CartResponse` / `CartOrderLineItemResponse` ([contracts §Cart](./mosaik-platform-contracts.md#cart)). The **stored** document is leaner: **prices are never persisted as truth** (sub-spec §4.2/§6 — fetched live for display), so price fields are projected in at read time, not stored.

**Collection:** `carts`

```jsonc
{
  "_id": "ObjectId | string",            // cart id (the {cartId} in the mirrored API)
  "schemaVersion": 1,

  // ---- ownership / keying ----
  "owner": {
    "kind": "customer | anonymous",
    "rambaseCustomerId": "string|null",   // logged-in key, from custom:rambaseCustomerId claim
    "companyId": "string|null",           // B2B company (mirrors CartResponse.companyId)
    "userSub": "string|null",             // Cognito sub of the user who owns/created it
    "sessionToken": "string|null"         // anonymous key (opaque, set when kind=anonymous)
  },

  // ---- mirror of CartResponse scalars we own ----
  "status": "active | submitted | abandoned",
  "type":   "cart | order-request",       // CartResponse.type; flips to order-request on submit
  "storeId": "string|null",
  "marketId": "string|null",
  "name": "string|null",
  "reference": "string|null",             // customer PO / own reference
  "customerComment": "string|null",
  "internalComment": "string|null",
  "requestedDeliveryDate": "ISODate|null",
  "tags": ["string"],

  // ---- line items (NO stored prices) ----
  "lineItems": [
    {
      "id": "string",
      "sku": "string",                     // RamBase/product key used for live price + quote
      "productId": "string|null",
      "quantity": "decimal",
      "unit": "string|null",
      "name": "string|null",               // display snapshot (catalog), safe to store
      "comment": "string|null",
      "addedAt": "ISODate"
      // priceless by design — originalPrice/discountedPrice/extendedPrice are computed at read time
    }
  ],

  // ---- anonymous "ask for offer" capture (sub-spec §4.3) ----
  "offerContact": {                        // null until an anonymous offer is submitted
    "name": "string", "email": "string", "company": "string", "phone": "string"
  },

  // ---- delivery address chosen at checkout (sub-spec §4.3) ----
  "deliveryAddress": {
    "mode": "rambaseAddressId | custom",
    "rambaseAddressId": "string|null",
    "custom": { "name": "...", "addressLine1": "...", "addressLine2": "...",
                "postalCode": "...", "city": "...", "region": "...", "countryCode": "..." }
  },

  // ---- lifecycle ----
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "submittedAt": "ISODate|null",
  "rambaseQuoteId": "string|null",         // set after successful quote creation
  "expiresAt": "ISODate"                   // TTL anchor — see below
}
```

**Decisions:**
- **Logged-in key:** `owner.rambaseCustomerId` (+ `companyId`). A signed-in user resolves their active cart via this key — mirrors the platform's `GET /carts/users-last-active-cart`. Because **multiple users share a company** (sub-spec §4.4), decide whether the active cart is **per-user** (`userSub`) or **per-company**; default **per-user** (`userSub` + `rambaseCustomerId`), since carts are personal even when order history is shared.
- **Anonymous key:** `owner.sessionToken` (opaque, issued to the browser; never a price-bearing cart).
- **Anonymous → offer / login transition:** an anonymous cart is a first-class document. On **sign-in**, merge the anonymous cart into the user's cart (port `lineItems`, then delete the anonymous doc) — mirrors the platform's `add-signed-in-customer` + wishlist `merge` pattern. On **anonymous offer submit**, fill `offerContact`, set `type=order-request`, `status=submitted`.
- **TTL / abandoned carts:** MongoDB **TTL index on `expiresAt`**. Suggested: anonymous carts expire **7 days** after `updatedAt`; logged-in carts **30 days**. Refresh `expiresAt` on every mutation. (Confirm retention with Pretec.)
- **Indexes:** `{ "owner.rambaseCustomerId": 1, "owner.userSub": 1, "status": 1 }`, `{ "owner.sessionToken": 1 }`, TTL `{ "expiresAt": 1 }`.

**Read-time price projection:** on `GET /carts/{id}` for a logged-in cart, batch-fetch live prices for the line SKUs (§Resilience) and project `PriceResponse`/`extendedPrice` into the mirrored response. Anonymous carts return lines with **no price** (sub-spec §4.2).

---

## 2. Cognito claim injection

Confirmed alignment from discovery: the Mosaik platform already uses a **bearer JWT `idToken`** as the credential on every public endpoint, and even exposes **external-identity token exchange** ([contracts §Auth](./mosaik-platform-contracts.md#auth)). The Pretec design (Cognito ID token + injected `custom:rambaseCustomerId`) fits this model directly — the service reads the customer id from the **validated ID token**, exactly as standard customer-context endpoints resolve the principal.

**Decision (design-level; concrete wiring pending Task 3):**
- **Pre-Token-Generation Lambda** (Cognito, **V1** trigger — keeps off the Pre-Token-Gen v2/v3 + Cognito Plus tier per sub-spec §3) injects `custom:rambaseCustomerId` (and optionally `custom:rambaseCompanyId`) into the **ID token** at login and refresh, sourced from the user↔customer link store.
- **Service validation:** validate the **ID token** (issuer = the Cognito user-pool, audience = the app client id), read `custom:rambaseCustomerId`. No customer id from the frontend; no per-request lookup.
- **Refresh-on-approval:** a user linked/approved *after* login gets the claim only on token refresh. Handle by **forcing a token refresh on approval** (preferred) and/or **short ID-token lifetime** (e.g. 15 min). The service must treat a **missing claim** as "not yet linked" → return prices/orders disabled with a clear "account pending approval" state, not a 500.
- **Open reconciliation (non-blocking):** confirm whether the standard Storefront authenticates via **Cognito directly** or via the platform's `customer-public /auth/sign-in` (which also issues an `idToken`). If the platform fronts customer auth with Cognito, the platform `idToken` *is* the Cognito ID token and the claim flows through unchanged; if not, confirm the Storefront sends the Cognito ID token to Pretec paths. → reconcile during Task 3.

> **Blocked detail (needs Task 3):** Lambda repo/deploy location, the user↔RamBase-customer link store (DynamoDB? the Mongo of an existing service?), and the JWT auth-handler wiring (authority/audience config keys, claims-reading idiom) in the existing services.

---

## 3. Istio routing paths

Matched to the **real** captured paths ([contracts](./mosaik-platform-contracts.md)). The `VirtualService` routes these prefixes to the **Pretec Service API**; everything else stays on the standard Mosaik services (single base URL — sub-spec §2).

| Route to Pretec | Real path(s) | Mirrors / Notes |
|---|---|---|
| **Cart** | `/carts`, `/carts/*` | cart-public. Pretec owns cart state in Mongo, so it owns the whole `/carts*` prefix. Implements the CRUD + create-order-request subset; the PSP/checkout sub-paths (Klarna/Adyen/Nets/Walley) are **not used** (always request-for-quote, sub-spec §4.3). |
| **Quote** | `POST /carts/{id}/create-order-request` | Under `/carts*` (already routed). This is the quote-submission trigger → RamBase quote. |
| **Orders (Query)** | `/orders`, `/orders/{id}`, `/v2/orders`, `/v2/orders/{orderId}/cancel` | cart-public order-read contract; Pretec sources from RamBase Sales Orders/invoices. |
| **Price (batch)** | **`/prices`** (POST batch) — **new, non-standard** | Standard platform has **no batch price endpoint** ([Gaps #1/#2](./mosaik-platform-contracts.md#gaps--what-the-standard-platform-does-not-define-pretec-must-extend-not-mirror)). Pretec **adds** it. The Storefront renders catalog without prices, then POSTs SKUs here for live RamBase prices (§4 resilience). |

**Stays on standard services (NOT routed to Pretec):** `/products*`, `/search`, `/aggregate-search`, `/facets`, `/categories*`, `/promotions*`, `/inventory*` (catalog + search — synced catalog data via Harmony, anonymous-safe, no live price); `/auth*`, `/customers*`, `/companies*`, `/profile*` (customer-public); `/wishlists*`; cms/localization/notification/store/etc.

> **Decision to confirm:** the exact public path the Storefront uses for batch prices. Since it's a Pretec extension, pick `/prices` (POST `{ items: [{ sku, quantity }], ... }` → `[{ sku, PriceResponse }]`) and reuse the catalog `PriceResponse` shape so the UI is unchanged. Reconcile with the Storefront/frontend owner.

---

## 4. Resilience policy

RamBase is a hard runtime dependency ([sub-spec §6](../specs/2026-06-08-pretec-service-api-design.md)). Concrete starting values (tune against real RamBase latency in staging):

| Call | Timeout | Retry | Notes |
|---|---|---|---|
| **Batch price** (`/prices` → RamBase) | **5 s** total (per-attempt 2 s) | **2 retries**, exponential backoff 200 ms → 400 ms + jitter; retry only on timeout/transient 5xx/429 | Idempotent (GET-like). On exhaustion → per-SKU **"price on request"** degraded state, HTTP 200 with nulls, never a hard fail of the page. |
| **Cart read price projection** | shares the batch-price budget | as above | A price miss degrades the line to "price on request"; the cart still renders. |
| **Quote submit** (`create-order-request` → RamBase create quote) | **15 s** | **No automatic retry** (a POST that may create a duplicate quote) — unless RamBase create is **idempotent** via a client key | Must fail with a **clear, retryable-by-user error** (sub-spec §4.3) — never silently drop. Use an **idempotency key** (cart id + submit nonce) if RamBase supports it, else surface the error and let the user retry. |
| **Order/invoice query** (`/orders` → RamBase) | **5 s** | **2 retries**, same backoff | Read-only; idempotent. |
| **RamBase auth token** (`oauth2/access_token`) | **5 s** | **1 retry** | Cache the short-lived token; refresh proactively before expiry and reactively on 401. |

- **Circuit breaker** around the RamBase client: open after **N consecutive failures** (e.g. 5) for a **short cooldown** (e.g. 10 s) so a RamBase outage fast-fails to the degraded state instead of piling up timeouts.
- **Catalog-without-prices handshake (preferred pattern, sub-spec §6):** (1) Storefront renders catalog/search from synced data (no RamBase). (2) After render, Storefront POSTs visible SKUs to `/prices`. (3) Prices fill in progressively; timeouts → "price on request." **Confirm with the Storefront/frontend owner** that the front end performs this post-render batch call and renders the degraded state.
- **Observability:** OTEL spans on every RamBase call (operation, customer id hashed, latency, outcome), metrics for timeout/retry/breaker events, surfaced in Grafana (sub-spec §7).

---

## 5. Decision status summary

| Decision | Status |
|---|---|
| Cart Mongo schema, keys, TTL, anonymous→offer transition | **Decided** (design-level) |
| Cognito claim injection approach + refresh-on-approval + missing-claim handling | **Decided** (design); wiring/link-store **blocked on Task 3** |
| Istio route list (cart/quote/orders to Pretec; new `/prices`; rest to standard) | **Decided**; `/prices` path to confirm with frontend |
| Resilience timeouts/retries/breaker + catalog-price handshake | **Decided** (starting values); confirm frontend does post-render batch; tune in staging |
| **.NET conventions / concrete file paths** | **BLOCKED — needs repo (§0)** |
| RamBase **Price** + **Quote** endpoints/fields | **UNRESOLVED — needs RamBase credentials** ([audit](./rambase-api-audit.md)) |
