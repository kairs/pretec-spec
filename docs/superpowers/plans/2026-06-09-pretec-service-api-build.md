# Pretec Service API — Build Phase Plan (high-level)

> **Altitude note:** This is an intentionally **high-level** plan — tasks, intent, dependencies, and acceptance criteria, **not** per-step TDD code. Concrete code/test bodies are deferred on purpose: the service **repository** is not yet available (so real .NET conventions are unknown) and RamBase's **Price/Quote** contracts are not publicly documented. Lock those down (resolve the Assumptions Register) before dropping to a per-step, code-complete plan. When you do, each task below expands into the standard TDD slices (write failing test → run → implement → run → checkpoint).
>
> **For agentic workers:** when this is promoted to a code-level plan, REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Tasks use checkbox (`- [ ]`) syntax for tracking.
>
> **Git note:** The user controls all git check-ins. This plan contains **no commit commands**; each task ends with a hand-off checkpoint.

**Goal:** Build the Geta-owned .NET Pretec Service API that wraps RamBase and mirrors the standard Mosaik platform contracts for Price, Cart, Quote, and Query (orders), behind Istio path routing, with Cognito ID-token auth, MongoDB-owned cart state, Polly resilience, and OpenTelemetry.

**Architecture:** ASP.NET Core service on AWS EKS. Validates a Cognito **ID token** and reads `custom:rambaseCustomerId`; owns **cart** documents in MongoDB; calls RamBase (OAuth2 client-credentials) for live prices, quote creation, and order queries. Catalog/search stay on the standard Mosaik services — the Storefront renders catalog first, then batch-fetches prices from this service. The RamBase boundary is isolated behind interfaces so the undocumented Price/Quote contracts are confined to one client class each.

**Tech Stack (assumed — see Register):** .NET 8, ASP.NET Core minimal APIs, MongoDB.Driver, `Microsoft.AspNetCore.Authentication.JwtBearer`, Polly (`Microsoft.Extensions.Http.Resilience`), OpenTelemetry .NET (OTLP→Grafana), xUnit + FluentAssertions + NSubstitute + Testcontainers.MongoDb + WireMock.Net. Istio `VirtualService` for routing.

---

## ⚠️ Assumptions Register (resolve before going code-level)

Written during a docs-only discovery phase. Each item is a **known unknown**, not a verified fact; most are localized to one task.

**Grounded in discovery (high confidence):** Mosaik contracts & paths ([`mosaik-platform-contracts.md`](../research/mosaik-platform-contracts.md) + [`mosaik-platform-swagger.json`](../research/mosaik-platform-swagger.json)); RamBase auth, query/pagination, Sales-Order fields ([`rambase-api-audit.md`](../research/rambase-api-audit.md) + [`rambase-openapi-sample.json`](../research/rambase-openapi-sample.json)); cart schema, Cognito model, Istio routes, resilience values ([`service-api-decisions.md`](../research/service-api-decisions.md)).

| # | Assumption | Resolve by |
|---|---|---|
| A1 | Solution layout/naming: `src/Pretec.ServiceApi` (web), `src/Pretec.ServiceApi.Core`, `tests/Pretec.ServiceApi.Tests`; .NET 8 minimal APIs. | Inspect a real Mozaik service repo; match its layout/framework. |
| A2 | Test stack: xUnit + FluentAssertions + NSubstitute + Testcontainers.MongoDb + WireMock.Net. | Match existing services' test framework. |
| A3 | Mongo access: `MongoDB.Driver` + thin repository. | Match existing repository/driver pattern. |
| A4 | Cognito JWT: validate the **ID token** (authority = pool issuer, audience = app client id); claim `custom:rambaseCustomerId`. | Confirm issuer/audience config + that the Storefront sends the Cognito ID token to these paths (decisions §2). |
| A5 | **RamBase price lookup endpoint shape is INVENTED** — no public price-lookup endpoint exists; one row per `(product, customer, qty)`. | RamBase credentials → portal. Isolated to `RamBasePriceClient` (Task 5). |
| A6 | **RamBase quote-create endpoint/fields INVENTED** (customer/lead, address, date, comment, lines). | RamBase credentials. Isolated to `RamBaseQuoteClient` (Task 7). |
| A7 | RamBase order `$filter` field paths/operators (customer, date range, status, PO). | Confirm on RamBase "Filtering and sorting" page (audit §Orders). |
| A8 | RamBase numeric `status`/`type` → Storefront strings via `$showDomainValues` + a code map. | Pull real domain values with credentials (Task 8). |
| A9 | Quote create is **not** idempotent → no auto-retry. | Confirm; enable one retry if idempotent (decisions §4). |
| A10 | Config/secrets: `appsettings.json` + env overrides; RamBase + Cognito + OTLP from env/secret store; Istio gateway/host/namespace per env. RamBase environments: **test** (used by Mosaik test + staging) and **production** — two credential sets. | Match existing services' config + the real cluster. |
| A11 | **Sales Invoice + document/PDF endpoints unknown → out of scope.** Query covers **orders only**. | RamBase credentials → add an Invoice slice later (audit §Orders/§Documents). |

> **Buildability:** Tasks 0–4, 6, 8, 9 do **not** depend on A5/A6 and are fully buildable once the repo conventions (A1–A4, A10) are confirmed. Tasks 5 (Price) and 7 (Quote) are blocked on A5/A6 for production-correctness — build them against the assumed contract behind their interface, but treat them as provisional until RamBase access lands.

---

## File Structure (target)

```
src/Pretec.ServiceApi/                 # ASP.NET Core host (A1)
  Program.cs                            # DI, auth, OTEL, endpoint maps
  appsettings.json                      # config + env overrides (A10)
  Endpoints/  PriceEndpoints, CartEndpoints, QuoteEndpoints, OrderEndpoints
  Auth/       CognitoClaims
src/Pretec.ServiceApi.Core/
  RamBase/    RamBaseTokenClient + IRamBase{Price,Quote,Order}Client (+ impls), RamBaseOptions
  Carts/      CartDocument, ICartRepository, MongoCartRepository
  Contracts/  Mosaik-mirroring DTOs (PriceResponse, CartResponse, OrderResponse, ...)
  Resilience/ RamBaseResiliencePipeline (read + write)
tests/Pretec.ServiceApi.Tests/          # (A2) ApiFactory, MongoFixture, RamBaseMockFixture + per-task tests
deploy/istio/virtualservice.yaml        # path routing (decisions §3)
```

Boundary principle: all RamBase HTTP lives behind `IRamBase*Client` interfaces in Core; endpoints depend on the interfaces. Tests fake RamBase via WireMock.Net and run Mongo via Testcontainers, so the assumed RamBase contracts (A5/A6) are swappable in one place.

---

## Tasks

Each task lists **intent · grounding · key decisions · dependencies · done-when**. Promote to per-step TDD code once the relevant Assumptions are resolved.

### Task 0 — Solution scaffold + test harness
- **Intent:** Create the solution, projects, package references, a `/health` endpoint, and the test harness (`ApiFactory : WebApplicationFactory<Program>`).
- **Grounding:** A1/A2. **Decisions:** minimal-API host; `InternalsVisibleTo` tests; `public partial class Program`.
- **Depends on:** A1, A2 confirmed (or proceed provisionally).
- **Done when:** `dotnet test` runs and a health test passes.

### Task 1 — RamBase token client (OAuth2 client-credentials + cache)
- **Intent:** `RamBaseTokenClient` posts `grant_type=client_credentials` to `/oauth2/access_token`, caches the short-lived token, refreshes ~60s before expiry, exposes `IRamBaseTokenProvider`.
- **Grounding:** audit §Auth (confirmed). **Decisions:** Bearer header; thread-safe single-flight refresh; `$db` carried in `RamBaseOptions`.
- **Depends on:** Task 0.
- **Done when:** test (WireMock) shows token fetched once and reused.

### Task 2 — Cognito ID-token auth + claim reading
- **Intent:** Wire `JwtBearer` to validate the ID token; `CognitoClaims.RamBaseCustomerIdOrNull(principal)`; a protected probe endpoint.
- **Grounding:** decisions §2, contracts §Auth. **Decisions (A4):** validate ID token (issuer/audience); **missing claim = "not yet linked/approved"**, surfaced as a clear pending state, never a 500.
- **Depends on:** Task 0; A4.
- **Done when:** no-token → 401; valid test token → claim is read.

### Task 3 — RamBase resilience pipelines (Polly)
- **Intent:** Named `rambase-read` and `rambase-write` HttpClients with resilience handlers.
- **Grounding:** decisions §4. **Decisions:** read = 5s total / 2s attempt / 2 retries (200→400ms+jitter) on 5xx/408/429 + breaker; write = 15s, **no retry** (A9).
- **Depends on:** Task 1 (token handler composes with these clients).
- **Done when:** read pipeline retries a transient 500 then succeeds; write pipeline does not retry.

### Task 4 — Storefront-facing contract DTOs (mirrors)
- **Intent:** DTOs mirroring Mosaik shapes (`PriceResponse`/`MoneyResponse`, `CartResponse`/`CartOrderLineItemResponse`, `OrderResponse`/`OrderSearchResponse`) so the Storefront is unchanged.
- **Grounding:** contracts doc (exact field names). **Decisions:** `System.Text.Json` web defaults (camelCase).
- **Depends on:** Task 0.
- **Done when:** serialization tests confirm property names match Mosaik exactly.

### Task 5 — Price: `POST /prices` (batch) ⚠️ A5
- **Intent:** New batch endpoint (logged-in only) → per-SKU customer prices from RamBase, projected into Mosaik `PriceResponse`.
- **Grounding:** Gaps #1/#2 (no standard batch price), §4.1. **Decisions:** no caching initially; missing claim → "pending-approval"; per-SKU failure/timeout → "price on request" (never fail the page).
- **Depends on:** Tasks 1–4; **A5 (blocks production-correctness)**.
- **Done when:** logged-in batch returns prices; anonymous/no-token → 401; degraded paths covered. *(RamBase mapping provisional until A5.)*

### Task 6 — Cart: MongoDB repository + `/carts` endpoints
- **Intent:** `CartDocument` + `MongoCartRepository` (TTL + owner indexes); mirrored cart paths (`POST /carts`, `GET/PATCH/DELETE /carts/{id}`, order-line add/update/remove, `users-last-active-cart`). Read-time live-price projection for logged-in carts (reuses Task 5); anonymous carts return no prices.
- **Grounding:** decisions §1, §4.2, contracts §Cart. **Decisions:** prices never persisted; logged-in key = `rambaseCustomerId`(+`userSub`); anonymous key = `sessionToken`; anonymous→customer **merge on sign-in**; TTL 7d anon / 30d logged-in.
- **Depends on:** Tasks 2, 4; Task 5 for projection; A3.
- **Done when:** create/get round-trips without stored prices; logged-in GET projects prices; anonymous GET priceless; line lifecycle works.

### Task 7 — Quote: `POST /carts/{id}/create-order-request` → RamBase quote ⚠️ A6
- **Intent:** Translate the cart into a RamBase sales quote; **clear/mark the cart only on success**; return `{ orderId }`.
- **Grounding:** contracts §Quote, §4.3. **Decisions (A6/A9):** customer id from claim or anonymous contact (name/email/company/phone required); delivery address = selected RamBase address or custom; no auto-retry; RamBase failure → clear retryable error, **cart left intact**.
- **Depends on:** Tasks 3 (write pipeline), 6; **A6 (blocks production-correctness)**.
- **Done when:** success clears cart + returns id; failure keeps cart + retryable error; anonymous missing-contact → 400. *(RamBase mapping provisional until A6.)*

### Task 8 — Query: `GET /orders`, `GET /orders/{id}` ⚠️ A7/A8
- **Intent:** Read-only order list + detail from RamBase Sales Orders, scoped to the authenticated customer, mapped to Mosaik `OrderSearchResponse`/`OrderResponse`.
- **Grounding:** contracts §Orders, audit §Orders, §4.4. **Decisions:** build RamBase query (`$db`, `$filter`, `$top`, `$pageKey`, `$inlineCount=allpages`, `$showDomainValues=true`); filters for date range / status / PO (A7); numeric status→string map (A8). **Invoices deferred (A11).**
- **Depends on:** Tasks 2, 3, 4.
- **Done when:** list scoped to customer maps correctly; filters sent; detail maps; no-token → 401.

### Task 9 — Observability (OTEL→Grafana) + Istio routing
- **Intent:** Wire OpenTelemetry (ASP.NET Core + HttpClient instrumentation, OTLP exporter, service name `pretec-service-api`); author the Istio `VirtualService` routing `/prices`, `/carts*`, `/orders`, `/v2/orders` to this service.
- **Grounding:** §7, §2, decisions §3. **Decisions (A10):** OTLP endpoint + gateway/host/namespace from env per the real cluster; everything else falls through to standard Mosaik services.
- **Depends on:** Task 0; A10; ideally Task 3 (real cluster wiring from Task 3 repo inspection).
- **Done when:** app starts with OTEL configured; manifest validates (`istioctl validate` / `kubectl --dry-run`).

### Task 10 — Full-suite verification + assumptions reconcile + handoff
- **Intent:** Run the whole suite; re-walk the Assumptions Register and mark each resolved/outstanding; hand off the branch and open-assumptions list. **Do not claim Price (Task 5) or Quote (Task 7) production-correct until A5/A6 are verified.** Do not commit (user controls git).

---

## Sequencing

```
0 ─▶ 1 ─▶ 3 ─┐
0 ─▶ 2 ──────┼─▶ 6 ─▶ 7        (6 also needs 5 for price projection)
0 ─▶ 4 ──────┘
1,2,3,4 ─▶ 5 (⚠️A5)
2,3,4 ─▶ 8 (⚠️A7/A8)
0 ─▶ 9 ;  all ─▶ 10
```
**Unblocked-now track:** 0 → 1 → 2 → 3 → 4 → 6 → 8 → 9 (Cart + Orders + infra). **Blocked track:** 5, 7 (need RamBase access).

---

## Self-Review

**1. Spec coverage** — §2 routing → Task 9 + decisions §3. §3 auth → Tasks 1–2. §4.1 Price → Task 5. §4.2 Cart → Task 6 (+ decisions §1). §4.3 Quote → Task 7. §4.4 Query → Task 8 (orders; **invoices deferred, A11**). §5 storage → Task 6. §6 resilience → Task 3 + degradation in 5/6/7. §7 NFR → Task 9. Every spec §8 item is either grounded in a research doc or carried as a flagged assumption.

**2. Altitude / placeholder note** — Per the user's choice, this is a deliberately high-level plan: code and test bodies are omitted because they would be premature against an unknown repo (A1–A4, A10) and undocumented RamBase contracts (A5–A9). The unknowns are concentrated in the Assumptions Register and tagged per task — known unknowns, not lazy TODOs. Promote to per-step TDD only after resolving the Register.

**3. Type/boundary consistency** — `IRamBaseTokenProvider`, `IRamBasePriceClient`, `IRamBaseQuoteClient`, `IRamBaseOrderClient`, `CognitoClaims`, `ICartRepository`/`CartDocument`, and the `rambase-read`/`rambase-write` clients are referenced consistently. The RamBase boundary is isolated so A5/A6 changes touch one class each. Contract DTO names match the captured Mosaik shapes.

**Remaining blockers (from discovery):** A1–A4/A10 (real .NET conventions — needs the repo); A5–A9/A11 (RamBase Price/Quote/Invoice/document contracts — needs API credentials).
