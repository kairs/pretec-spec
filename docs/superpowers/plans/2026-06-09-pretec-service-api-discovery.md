# Pretec Service API — Discovery Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git note:** The user controls all git check-ins. This plan contains **no commit commands**. Each task ends with a hand-off step; the user stages and commits.

**Goal:** Resolve the unknowns that block a concrete code-level build plan for the Pretec Service API — capture the standard Mosaik platform contracts, audit the RamBase API surface, and document the existing .NET service conventions — producing reference docs that the build plan will be written against.

**Architecture:** This is a **discovery/spike phase**, not production code. Each task produces a **reference document** under `docs/superpowers/research/` (and, where applicable, a saved contract file). The final task uses those outputs to commission the build-phase plan. No application code is written here.

**Tech Stack (of the system being built, for context):** .NET service on AWS EKS, Istio mesh, MongoDB, OpenTelemetry + Grafana, AWS Cognito; wraps the RamBase REST API; consumed by a Next.js/React Mosaik Storefront.

---

## Scope Check

This is one phase of the Pretec Service API sub-spec (overview §5.9). It is intentionally scoped to **discovery only**. The build (Price, Cart, Quote, Query, auth, resilience, observability, Istio routing) becomes a **separate plan** written once these outputs exist — see Task 5.

## File Structure

Documents created by this phase:

- `docs/superpowers/research/mosaik-platform-contracts.md` — the standard Mosaik contracts this service must mirror (Cart, Price, Orders, Quote), plus the raw spec.
- `docs/superpowers/research/mosaik-platform-swagger.json` — the saved OpenAPI spec (raw artifact, source of truth for the above).
- `docs/superpowers/research/rambase-api-audit.md` — exact RamBase endpoints/params/fields for price, quote creation, order/invoice query, documents, and auth.
- `docs/superpowers/research/service-template-conventions.md` — the existing .NET/Mozaik service conventions (solution layout, test framework, DI, config, Mongo, Cognito validation, OTEL, k8s/Istio manifests).
- `docs/superpowers/research/service-api-decisions.md` — design decisions that depend on the above (Mongo cart schema, Cognito claim injection, Istio path list, resilience policy values).

Each is a focused, single-responsibility reference. The build plan (Task 5) cites them by path.

---

## Task 1: Capture the standard Mosaik platform contracts (Swagger)

The Storefront expects standard contracts; this service must mirror them. The Swagger UI is JS-rendered, so we capture the underlying OpenAPI JSON via the in-browser tool, save it, then summarize the four relevant contract areas.

**Files:**
- Create: `docs/superpowers/research/mosaik-platform-swagger.json`
- Create: `docs/superpowers/research/mosaik-platform-contracts.md`

- [ ] **Step 1: Open the Swagger UI in the browser**

Use the in-browser tools (load via ToolSearch `select:mcp__claude-in-chrome__tabs_context_mcp` etc.):
1. `tabs_context_mcp` to get current tabs.
2. `tabs_create_mcp` to open a new tab at:
   `https://api-northwind-no.test.geta.mozaikcommerce.ai/platform/swagger/index.html`

Expected: the Swagger UI renders a list of endpoints grouped by tag.

- [ ] **Step 2: Extract the OpenAPI JSON the UI loaded**

Use `read_network_requests` on the tab and find the request whose URL ends in `swagger.json` / `openapi.json` (the spec the UI fetched). Capture its response body.

Fallback if not in network log: use `javascript_tool` to read it from the page context:
```js
// returns the spec URL(s) the UI was configured with
JSON.stringify(window.ui?.getConfigs?.()?.urls ?? window.ui?.specSelectors?.url?.());
```
Then `navigate` directly to that URL and use `get_page_text` to read the raw JSON.

Expected: a JSON document with `"openapi"`/`"swagger"`, `paths`, and `components`/`definitions`.

- [ ] **Step 3: Save the raw spec**

Write the captured JSON verbatim to `docs/superpowers/research/mosaik-platform-swagger.json`.

Verification: file parses as JSON and contains a `paths` object.
Run: `pwsh -c "Get-Content docs/superpowers/research/mosaik-platform-swagger.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty paths | Get-Member -MemberType NoteProperty | Measure-Object | Select-Object -ExpandProperty Count"`
Expected: a number > 0 (count of paths).

- [ ] **Step 4: Summarize the four contract areas**

From the saved spec, write `mosaik-platform-contracts.md` with these exact sections, each listing the HTTP method + path + request body schema + response schema (field names and types) for the standard endpoints:
- `## Cart` — create cart, get cart, add/update/remove line, clear.
- `## Price` — the price lookup contract (single and/or batch shape).
- `## Orders` — order list + order detail (the read contract Min side mirrors).
- `## Quote` — quote/checkout submission contract (if the standard platform has one).
- `## Auth` — how the standard endpoints expect authorization (header, token type).
- `## Gaps` — any of the above the standard platform does NOT define (so we know where we must extend rather than mirror).

Verification: each section names concrete fields (not "various fields"); `## Gaps` explicitly lists anything missing.

- [ ] **Step 5: Hand off for check-in**

Report the two files to the user for git check-in. Do not commit.

---

## Task 2: Audit the RamBase API for the operations we wrap

Resolve the RamBase-dependent "verify during build" items from the spec §8. Use the public RamBase docs.

**Files:**
- Create: `docs/superpowers/research/rambase-api-audit.md`

- [ ] **Step 1: Audit customer-specific pricing**

WebFetch the RamBase Product/Sales pricing docs starting from `https://api.rambase.net/documentation` (Sales / Product areas). Determine and record: the endpoint that returns a price for a product **scoped to a customer**, whether **quantity-break/tiered** prices are returned, and the exact response **fields** (net price, currency, unit of measure/price unit, discount, VAT handling).

Record in section `## Price` with exact endpoint path(s), query params, and a sample response field list.

- [ ] **Step 2: Audit sales-quote creation**

WebFetch the RamBase Sales **Quote** resource docs. Record the **create-quote** endpoint (path + method), and the **required and optional fields** for authenticated customers (customer reference, delivery address selection vs custom address, requested delivery date, comment, line items).

Record in section `## Quote (create)`.

- [ ] **Step 3: Audit order & invoice query**

WebFetch the Sales **Order** and Finance **Sales invoice** resource docs. Record: list endpoint + single-detail endpoint for each; exact `$filter` field names for **date range, status, order/PO number**; pagination params (`$top`/`$pageno`); the **detail fields** available (status, dates, lines, totals, addresses); and how to **scope by customer** (the `$filter` field that takes the customer ID). Note credit notes if present.

Record in section `## Orders & Invoices (query)`.

- [ ] **Step 4: Audit document/PDF retrieval**

WebFetch the RamBase docs for document/print/attachment retrieval. Determine whether **order-confirmation and invoice PDFs** are retrievable via the API and how (endpoint + format). If not available, state that explicitly.

Record in section `## Documents / PDFs`.

- [ ] **Step 5: Audit authentication & company selection**

WebFetch `https://api.rambase.net/gettingstarted` auth pages. Record: the **system/integration credential** flow (token type, how `$access_token` is obtained/refreshed), the `$db` (company) parameter, and confirm that **customer-specific data** (prices, orders) is reachable with a system account by passing the customer as a parameter/filter.

Record in section `## Auth & company`.

- [ ] **Step 6: Verify completeness**

Verification: open `rambase-api-audit.md` and confirm every section has **concrete endpoint paths and parameter/field names** (no "TBD"). For any item the docs genuinely don't answer, write `UNRESOLVED — needs RamBase contact:` followed by the specific question. The doc must distinguish "answered" from "needs a human."

- [ ] **Step 7: Hand off for check-in**

Report the file to the user. Do not commit.

---

## Task 3: Document the existing .NET service conventions

The build plan needs real file paths, namespaces, and patterns. This task records the conventions of the existing Mozaik services so the new service fits in.

> **Prerequisite:** access to the actual service repository (not present in this `docs`-only workspace). If the repo is not yet available, this task is **blocked** — record the blocker in the decisions doc (Task 4) and proceed; the build plan cannot be made concrete until this is done.

**Files:**
- Create: `docs/superpowers/research/service-template-conventions.md`

- [ ] **Step 1: Locate a representative existing service**

With the repo available, identify one existing Mozaik .NET service in the same EKS cluster to use as the template. Record its repo path/name.

- [ ] **Step 2: Record solution & project layout**

Document, with exact paths: solution structure (`*.sln`, project folders), target framework (`<TargetFramework>` from the `.csproj`), API style (controllers vs minimal API), and folder conventions (e.g. `Endpoints/`, `Services/`, `Models/`, `Infrastructure/`).

Record in section `## Solution layout`.

- [ ] **Step 3: Record cross-cutting conventions**

Document: the **test framework** (xUnit/NUnit/MSTest) and test project layout; **DI/registration** pattern; **configuration** (appsettings + environment overrides for test/staging/production); **MongoDB** access (driver, repository pattern, connection config); **Cognito JWT validation** (middleware/auth handler, where the JWT authority/audience is configured, how claims are read); **OpenTelemetry** setup (exporters, Grafana wiring); **logging**.

Record in sections `## Testing`, `## DI & config`, `## MongoDB`, `## Auth (Cognito)`, `## Observability`.

- [ ] **Step 4: Record deployment manifests**

Document the **Kubernetes** manifests and **Istio** `VirtualService`/`Gateway` conventions an existing service uses (chart/kustomize location, how routes are declared, how a new path is added to routing).

Record in section `## K8s & Istio`.

- [ ] **Step 5: Verify completeness**

Verification: confirm each section cites **concrete file paths/snippets** from the real repo. Anything not found is recorded as `UNRESOLVED:`.

- [ ] **Step 6: Hand off for check-in**

Report the file to the user. Do not commit.

---

## Task 4: Resolve design decisions that depend on discovery

Turn discovery findings into the concrete decisions the build plan will assume.

**Files:**
- Create: `docs/superpowers/research/service-api-decisions.md`
- Modify: `docs/superpowers/specs/2026-06-08-pretec-service-api-design.md` (§8 — mark resolved items)

- [ ] **Step 1: Decide the MongoDB cart schema**

Using the standard cart contract (Task 1) and the cart lifecycle (spec §4.2), write the concrete Mongo document shape for a cart: fields, the **logged-in key** (RamBase customer ID + user), line-item fields, timestamps/TTL for abandoned carts, and the auth behavior for anonymous callers.

Record in section `## Cart document schema`.

- [ ] **Step 2: Decide the Cognito claim-injection approach**

Using Task 3's Cognito findings, write the concrete plan for the **Pre-Token-Generation Lambda** that injects `custom:rambaseCustomerId` into the **ID token**, including the **token-refresh-on-approval** handling.

Record in section `## Cognito claim injection`.

- [ ] **Step 3: Decide the Istio route list**

List the exact path prefixes that the `VirtualService` routes to this service (price, cart, quote, orders) versus the standard services, matched to the real paths from Task 1's contracts.

Record in section `## Istio routing paths`.

- [ ] **Step 4: Decide resilience policy values**

Set concrete numbers: RamBase call **timeout**, **retry** count/backoff, and the **catalog-without-prices** handshake (which call the frontend makes after render, and the "price on request" degraded state). Confirm with whoever owns the Storefront frontend behavior.

Record in section `## Resilience policy`.

- [ ] **Step 5: Update the sub-spec's open items**

In `2026-06-08-pretec-service-api-design.md` §8, mark each resolved item with its answer (or link to the research doc), and leave only genuinely-open items flagged.

Verification: spec §8 no longer lists an item that the research docs have answered.

- [ ] **Step 6: Hand off for check-in**

Report the modified spec + new decisions doc to the user. Do not commit.

---

## Task 5: Commission the build-phase plan

With discovery complete, write the concrete code-level build plan.

**Files:**
- Create: `docs/superpowers/plans/<YYYY-MM-DD>-pretec-service-api-build.md` (dated when written)

- [ ] **Step 1: Confirm discovery outputs are sufficient**

Verify Tasks 1–4 produced docs with **no UNRESOLVED items that block coding** (contracts captured, RamBase endpoints/fields known, service conventions documented, decisions made). List any remaining blockers; if a blocker exists, stop and escalate to the user rather than writing a guess-based plan.

- [ ] **Step 2: Re-invoke the writing-plans skill for the build**

With the research docs as inputs, use `superpowers:writing-plans` to produce the build plan: per-operation TDD slices (Price → Cart → Quote → Query), Cognito auth middleware, MongoDB cart repository, RamBase client, resilience, OTEL, and Istio manifest — each with concrete file paths and complete code drawn from the documented conventions.

- [ ] **Step 3: Hand off for check-in**

Report the build plan to the user. Do not commit.

---

## Self-Review

**1. Spec coverage** — Discovery maps to spec §8 open items: Task 1 → §8.1 (Mosaik contracts); Task 2 → §8.2–§8.6 (RamBase price, query, documents, auth, quote); Task 3 → the implicit "fit the existing .NET conventions" need; Task 4 → cart schema/§4.2, Cognito/§3, Istio/§2, resilience/§6; Task 5 → the build itself. No discovery-relevant spec area is unaddressed.

**2. Placeholder scan** — No "TBD/implement later" in the *actions*. Tasks explicitly require concrete endpoint/field names and mark genuine unknowns as `UNRESOLVED — needs <human>` rather than hiding them. The `<YYYY-MM-DD>` in Task 5's filename is an intentional date stamp, not a content gap.

**3. Type consistency** — The artifact names (`mosaik-platform-contracts.md`, `mosaik-platform-swagger.json`, `rambase-api-audit.md`, `service-template-conventions.md`, `service-api-decisions.md`) are used consistently across the File Structure, tasks, and Task 5 inputs. The claim name `custom:rambaseCustomerId` matches the sub-spec.

**Note:** Task 3 is gated on repository access, which is not present in this workspace — called out explicitly in its prerequisite and in Task 5's blocker check.
