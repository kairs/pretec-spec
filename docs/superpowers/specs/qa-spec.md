# QA Spec — System Specification (from service-overview.png)

> Working document. Captures questions asked during brainstorming and the user's answers.
> Source: `docs/service-overview v2.png` (v2 supersedes the original `service-overview.png`)

## Diagram interpretation (to be confirmed)

Systems, top (data owner) to bottom (consumer):

- **RamBase** (ERP, "owner of data"): Customer, Price, Product, Category, Inventory, Order/Invoice
- **Mosaic Harmony** (sync layer #1): Customer Sync, Product Sync, Category Sync
- **Struct** (PIM): Product, Category, Assets (product)
- **RamBase Service API**: Query, Cart
- **Sanity** (CMS): Documents, Assets (content)
- **Mosaic Maestro** (standalone, left)
- **Mosaic Harmony** (sync layer #2): Catalog Sync, Inventory Sync
- **Mosaic Storefront** (the app): Customer User, Catalog, Min side, Cart, Content, Frontend
- **End user** → Frontend

Legend: red box = owner of data; arrow = request direction.

---

## Questions & Answers

### Q1 — Purpose & audience of the spec
**Q:** Is this spec documenting an existing system, specifying a system to be built, a migration, or something else? Who is the audience?
**A:** (B) Specify a system **to be built** — this diagram is the target design.
The audience is **the customer (Pretec)**. Purpose: establish a **shared understanding of what needs to be built and who is responsible** for each part.

**Implications:** Spec is customer-facing; responsibility/ownership per component is first-class (RACI-style). Must be readable by a non-deep-technical client stakeholder while precise enough to align on scope.

### Q2 — What is Mosaic, and who owns/builds each system
**Q:** Is Mosaic a platform Geta builds on or the custom solution itself? What are Harmony and Maestro? What responsibility labels should the spec use?
**A:**
- **Mosaic** = Geta's own commerce platform suite. **Geta owns and builds all of it.** Components:
  - **Harmony** = Geta's **sync / integration engine** (moves data between systems).
  - **Maestro** = Geta's **backoffice application** to look into Mosaic Storefront — manage redirects, translations, view users, see versions of services, etc.
  - **Storefront** = the customer-facing web application (+ its backend).
- **Geta is building everything**, on top of / using **Sanity** (CMS), **Struct** (PIM), and **RamBase** (ERP) as underlying platforms.

**Responsibility model:** Geta = builder/integrator of all custom work. RamBase / Struct / Sanity = third-party platforms Geta builds on. Pretec = owns source data (in RamBase) and the platform subscriptions/configuration. (Exact per-component RACI to be detailed in spec.)

> **⚠️ Superseded by Q8.** "Mosaik" (correct spelling) is the **name of the whole SaaS platform** and is **not entirely custom-built for this project**. See Q8 for the corrected per-component responsibility split.

### Q3 — Data flows (synced vs live)
**Q:** Confirm the flows; clarify Price and Min side.
**A:** Flow reading confirmed. Two architectural patterns:

**Synced (batch/event via Harmony):**
- Product: RamBase → Harmony (Product Sync) → Struct (PIM, enrich) → Harmony (Catalog Sync) → Storefront *Catalog*
- Category: RamBase → Harmony (Category Sync) → Struct → Catalog
- Product assets: Struct (owner) → Catalog
- Customer: RamBase → Harmony (Customer Sync) → Storefront *Customer User*
- Inventory: RamBase → Harmony (Inventory Sync) → Storefront *Catalog*
- Content: Sanity (Documents + content Assets) → Storefront *Content*

**Live (real-time via RamBase Service API):**
- **Price**: live query using the **logged-in user** to fetch that user's specific **B2B price**.
- **Cart**: Storefront *Cart* ↔ RamBase Service API *Cart* (Service API owns the cart).
- **Min side** (My Page): **read-only**, shows **status of existing/ongoing orders and old orders** (via Service API Query).

### Q4 — Checkout / order placement
**Q:** How does a logged-in B2B customer check out?
**A:** (B) The **Storefront has its own checkout flow** that creates a **quote (request)** and sends it to the **RamBase Service API**, which **creates the quote in RamBase**.
Note: the output is a **quote/request**, not a directly-confirmed sales order (B2B request-for-quote model). *(User will update the drawing to reflect this.)*

### Q5 — Authentication & user access
**Q:** Where do identities live? How are accounts provisioned? Is there anonymous access?
**A (part 1 — identity):** (C) Mosaic Storefront uses **its own database + AWS Cognito** for authentication. (Seeded by the synced Customer User data from RamBase.)
**A (part 2 — provisioning):** (A) **Self-registration** on the storefront, then **linked/approved against a RamBase customer**.
**A (part 3 — anonymous access):** **Yes — anonymous browsing of the catalog is allowed, but no prices** are shown to anonymous users (prices require a logged-in, linked B2B user).

### Q6 — How to break up the spec
**Q:** Decompose by capability (A), by system (B), or by layer (C)?
**A:** (A) **By capability / vertical slice**, with a top-level overview spec above the sub-specs. Agreed sub-specs:
1. Catalog & Product
2. Customer & Authentication
3. Pricing
4. Cart, Checkout & Quote
5. My Page / Min side
6. Content / CMS
7. Harmony — sync & integration engine
8. Maestro — backoffice

---

### Q7 — RamBase Service API ownership
**Q:** Who provides the RamBase Service API?
**A:** It is an **API that Geta will create** based on this spec. It is **not** a RamBase-vendor product. It is Geta's live/real-time API layer that talks to RamBase and exposes Query + Cart (pricing, cart, order/quote queries) to the Storefront.

**Implication:** The Service API is a **Geta-built foundational component**, parallel to Harmony (the sync engine). Harmony = the *synced-data* engine; the Service API = the *live-data* engine. → Added as **sub-spec #9**. Powers Pricing (#3), Cart/Checkout/Quote (#4), and Min side (#5).

> **Renamed in Q8:** "RamBase Service API" → **"Pretec Service API"** (custom code built for this project).

### Q8 — Mosaik = SaaS platform; per-component responsibility (corrects Q2)
**Q:** Mosaik is the platform (SaaS) containing Harmony, Storefront, Maestro. For this Pretec project, which components does Geta build/customize vs configure & use as-provided?
**A:**
- **Mosaik** = the **SaaS platform** (Geta's product), the umbrella containing Harmony, Storefront, and Maestro. Consumed as a platform dependency for this project.
- **Maestro** = **used as-provided by the Mosaik SaaS** — configuration only (redirects, translations, view users, service versions). **Not built for this project.**
- **Harmony** = platform **sync engine**; Geta **configures** the syncs/mappings for Pretec (not built from scratch).
- **Storefront** = a Mosaik **starterkit**, **customized for Pretec** by Geta.
- **Pretec Service API** (renamed from "RamBase Service API") = **custom code built for this project** by Geta; talks to RamBase and exposes live Query / Cart / Quote to the Storefront.

**v2 diagram also adds:** Service API has three operations — **Query** (ongoing/historic orders), **Cart**, **Quote** (create quote). Storefront shows a live **Price** lookup. Quote is now distinct from Cart in the checkout flow.

---

## Sub-spec #9 — Pretec Service API — Q&A

Goal: detailed spec for the Geta-built API that wraps the RamBase API and exposes live Price / Query / Cart / Quote to the Storefront.
RamBase API modules available: Product, Sales, Finance, Procurement, Logistics, CRM.

### S9-Q1 — Foundations & constraints
**Q:** Existing standard vs greenfield? Stack/runtime? Consumers? How should the Storefront reach the custom service?
**A:**
- **Standard platform API** (contracts to mirror): `https://api-northwind-no.test.geta.mozaikcommerce.ai/platform/swagger/index.html` (Mozaik platform Swagger).
- **Greenfield service, but contracts are NOT greenfield.** The custom service should **mirror the standard platform API contracts** so the **starterkit can be reused** as much as possible (e.g. custom Cart should resemble the standard Cart). Not a hard requirement — Geta can extend/customize where needed.
- **Stack:** **.NET** service, deployed to **AWS EKS (Kubernetes)** — the same cluster where all other Mozaik services already run. **Frontend/starterkit = Next.js + React.**
- **Consumer:** **only the Storefront.**
- **Routing intent:** the Storefront should "think" it's calling the standard APIs; custom routes sit on top of the standard APIs. Open: route transparently vs point the frontend at a separate URL — **Geta to decide (suggestion requested).**

### S9-Q2 — Routing approach
**Q:** How should the Storefront reach the custom service (path routing vs separate URL vs full proxy)?
**A:** **Option A — path-based routing**, implemented with **Istio** in K8S. An Istio `VirtualService` routes specific paths (price/cart/quote/orders) to the custom .NET service; everything else goes to the standard Mozaik platform services. One base URL — the Storefront can't tell the difference, no frontend fork. Custom service mirrors the standard contracts; separate-URL/frontend customization is fallback only where a contract must diverge.

### S9-Q3 — Authentication (two hops) & user→customer mapping
**Q:** How does the Storefront authenticate to the Service API, how does the service know the caller's RamBase customer, and how does the service authenticate to RamBase?
**A (mapping):** **Option A — custom claim in the Cognito token.** A **Pre Token Generation Lambda trigger** injects the user's linked RamBase customer ID (e.g. `custom:rambaseCustomerId`) at login/refresh. The Service API validates the JWT and reads the claim — no frontend-passed ID, no extra lookup.
- **Caveat 1:** claim reflects link state at token issuance; a post-login link requires a token refresh (force refresh on approval or use short token lifetime).
- **Caveat 2 (decision):** which token does the Service API validate? → **ID token** (simple, any Cognito tier; avoids the v2/v3 trigger + Plus tier).
**A (Hop 1):** Service API validates the Cognito **ID token** per request and reads `custom:rambaseCustomerId`.
**A (Hop 2 — Service API → RamBase):** **Single system/integration credential** for the whole integration; the **customer is passed as a parameter** (service asks RamBase "price for product P, customer X"). Assumed RamBase returns **customer-specific B2B prices** when called this way. _Working assumption — verify exact RamBase auth + customer-scoped pricing endpoints against the RamBase API during implementation._

### S9-Q4 — Cart persistence & lifecycle
**Q:** Where does cart state live? Logged-in only? One quote per checkout?
**A:** **Option A — the Service API owns cart storage** (its own datastore in EKS). Live per-user prices fetched from RamBase for display; RamBase written only at checkout (create quote).
- **Cart and quote are login-only.** Anonymous users can browse the catalog but have no access to the cart or checkout.
  - **Logged-in cart:** keyed by the RamBase customer (from `custom:rambaseCustomerId`); prices shown.
  - ~~Anonymous cart~~ — **out of scope.**
  - ~~Anonymous "ask for offer"~~ — **out of scope.** Quote submission requires an authenticated, linked user.
- **Checkout:** one **single quote per submission**; the **cart is cleared** after a successful submission. (Confirmed.)

### S9-Q5 — Checkout → Quote
**Q:** What does the user provide at checkout? What happens after? Is firm online ordering ever in scope?
**A (5a — checkout payload):**
- **Customer reference number** (the customer's own PO/reference).
- **Delivery address** — **select from the RamBase customer's addresses, OR enter a custom address**.
- **Requested delivery date.**
- **Quote comment / message.**
- Checkout is only available to authenticated, linked users; anonymous "ask for offer" is out of scope.
**A (5b — after submission):** **On-screen confirmation + email.** A **Pretec sales rep follows up in RamBase**. Quotes do **not** need to appear in Min side (Min side stays orders/invoices only).
**A (5c — scope):** The storefront is **always request-for-quote**. **No firm online ordering, ever.** The customer never places a priced, confirmed order directly — every submission becomes a RamBase quote that a rep converts.

### S9-Q6 — Price operation
**Q:** Batch vs single? Quantity-break pricing? Response fields? Caching?
**A (6a):** **Batch** — listing pages request prices for many products at once for the logged-in customer.
**A (6b — quantity pricing):** **Not in use at Pretec.** Single price per (product, customer) — no tier table, no quantity-based recalculation.
**A (6c — response fields):** Prices are **ex-VAT (net) only** — no VAT amounts shown in the storefront. Remaining fields (currency, unit of measure / price unit, discount) to be confirmed against the RamBase API.
**A (6d — caching):** **For now, call RamBase directly** (live, no cache). **Note:** a **Redis cache** (per customer+product, short TTL) **may be introduced later** to spare RamBase on listing pages.

### S9-Q7 — Query operation (orders & invoices on Min side)
**Q:** Scope (orders/invoices/credit notes)? list+detail? document PDFs? filters? scoping?
**A (7a — scope):** Driven by **what RamBase provides** — to be confirmed against the RamBase API (orders; likely invoices / credit notes; list + detail).
**A (7b — documents/PDF):** Depends on **whether RamBase exposes documents** (order confirmation / invoice PDFs) — to be confirmed against the RamBase API.
**A (7c — filters):** Desired: **date range, status, order number** — but constrained by **what RamBase supports**; to be confirmed.
**A (7d — scoping):** **Always scoped to the customer / company.** **Multiple users may be connected to the same company**, and they all see the **same company orders/invoices** (shared company view). Logged-in only.

> **Action:** audit the RamBase API for Sales order + Finance invoice/credit-note query (list + detail), document/PDF retrieval, and supported filter/query parameters. Records 7a–7c. (See investigation below / to continue during build.)

**RamBase API investigation (findings):**
- RamBase stores business data as **documents in a chain**: sales **quote → order → shipping advice → invoice**. So both **orders and invoices are first-class resources** (orders under Sales, invoices under Finance/Sales invoicing).
- **List + detail both supported:** `GET /sales/orders` (collection) and `GET /sales/orders/{id}` (single). Same pattern for invoices.
- **Standard query params:** `$filter` (field filtering + sorting), `$top`/`$pageno` (**pagination**), `$select`, `$expand`, `$format=json`, `$db` (company), `$lang`, `$access_token`. → **7c date/status/order-number filtering + pagination are feasible** via `$filter`; exact field names to confirm during build.
- **Order fields available:** status, type, dates, customer (nested, with ID — basis for **company scoping** in 7d), invoice/shipping addresses, totals (subtotal, VAT, freight, fees), shipment/delivery terms, payment terms. → rich enough for Min side list + detail.
- **7b documents/PDF:** **not confirmed** on the Sales Order resource page — RamBase likely has separate document/print endpoints but this is **still to verify**.
- **Source:** https://api.rambase.net/documentation , https://api.rambase.net/gettingstarted/operations

**Resolved:** 7a = orders + invoices, list + detail ✔ · 7c = filtering/pagination supported ✔ · 7b PDF = still to verify · scoping via `$filter` on the customer from the token claim ✔

### S9-Q8 — Resilience & infrastructure
**Q:** Behavior when RamBase is slow/down? Cart datastore standard? Environments/observability?
**A (8a — resilience):** RamBase being slow/down is a recognized risk (price, cart pricing, quote submission depend on it).
- **Mitigation pattern (preferred):** **load the catalog WITHOUT prices first** (from synced catalog data — fast, no RamBase dependency), then **fetch prices afterward from the UI/frontend layer** (client-side batch price calls to the Service API once the page has rendered). Catalog stays usable even if pricing is slow/unavailable; prices fill in progressively (and can degrade to "price on request").
- _Note flagged: confirm/expand quote-submission failure handling (clear retryable error) during design._
**A (8b — datastore):** **MongoDB** — the Service API persists cart state (and any service-owned state) in MongoDB in EKS.
**A (8c — observability & environments):** **OpenTelemetry (OTEL) + Grafana** for tracing/metrics/logs. **Environments: test, staging, production.**

## References
- **RamBase API:** https://api.rambase.net/ — the upstream API the **Pretec Service API** (#9) wraps for live Price / Query / Cart / Quote. To be reviewed in detail when speccing the Pretec Service API and the live flows.

## Open questions (to resolve per sub-spec)
- **Harmony:** sync mechanism — event-driven vs scheduled, frequency, direction (one-way RamBase→ down?), conflict/error handling, initial vs delta loads.
- **Content/CMS:** what content is authored in Sanity (editorial pages, product editorial content, navigation, etc.) and how it relates to catalog data.
- **Catalog:** is there search/filtering, and what powers it? Localization / multiple languages (Maestro mentions translations). Markets/currencies.
- **Pricing:** caching of live prices, behavior on Service API failure.
- **Cart/Quote:** what the customer provides at checkout (PO/reference, delivery address, requested date, comments); what happens after a quote is created in RamBase.
- **Maestro:** full feature list, who uses it (Geta ops vs Pretec admins).
- **Non-functional:** performance, availability, environments, hosting (AWS implied by Cognito).
- **Pretec Service API:** API surface, auth/token handling, caching, error/timeout behavior.
- **Mosaik platform:** which capabilities are config-only vs need Storefront-starterkit customization; versioning/upgrade responsibility.
