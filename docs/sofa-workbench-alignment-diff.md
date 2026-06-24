# Alignment Diff — "SoFa Workbench" (Website–Sanity v10) vs. Internal Specs

**Date:** 2026-06-24
**Author:** Geta
**External document:** *SoFa Workbench* — "Website – Sanity" System Specification **v10** (dated 24/06/2026), customer/confidential, prepared for Pretec.
**Internal baseline:** `C:\git\pretec-spec\docs` (commerce overview, Service API design, and the X-/I-/F- sub-specs indexed in [spec-index.md](spec-index.md)).

---

## 1. Purpose & how to read this

This document records **where the SoFa Workbench spec and our internal specs do not agree**. It is a diff, not a merge — it lists divergences, their evidence, and a recommended resolution owner, so the two sets of documents can be reconciled.

**Important framing.** The SoFa Workbench is the **customer-facing *website* spec**. It states on page 2 that *"Detailed integration contracts (endpoints, payloads, authentication) are specified in a separate backend/integrations document,"* and page 30 confirms the integrations diagram, integration inventory, and decisions section are deliberately removed from the customer version. So not every difference is a conflict. Each finding below is tagged with a **kind**:

| Kind | Meaning |
|---|---|
| ⛔ **Contradiction** | The PDF affirmatively states something our specs say is *not* the case. Must be reconciled. |
| 🟧 **Abstraction** | The PDF omits backend detail we specify (Service API, Cognito, Harmony, Mongo…). Likely intentional simplification — but risks the customer forming a wrong mental model; confirm framing. |
| 🟨 **Gap (we owe)** | The PDF specifies a real, in-scope requirement our specs don't cover yet. We should absorb it. |
| 🔵 **Gap (they owe / open)** | We've decided something the PDF leaves open or contradicts itself on; Pretec must confirm. |

Severity = **High / Med / Low** by delivery impact.

---

## 2. Headline: the architecture model differs

The single largest divergence runs through the whole PDF. **The SoFa Workbench presents a "the website calls RamBase directly" model and never mentions a service layer.** Our internal architecture has **two tiers the PDF doesn't show**:

1. A **Harmony sync plane** — products, categories, **customer**, and **inventory** are *copied into the Storefront* via Mosaik Harmony (not read live).
2. A **Geta-built Pretec Service API** (.NET 10 on EKS, MongoDB cart store, Istio routing, AWS Cognito token validation) that wraps RamBase for **live Price, Cart, Quote, and Order/Invoice query**.

The PDF instead says (page 3, page 25 Data Sources Summary): *"The website calls Rambase directly for customer, order and inventory data"* and *"Prices are sourced from Rambase in real time. The website calls Rambase directly,"* with Mozaik Harmony reduced to *"Integration layer for the broader platform"* (direction "—").

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| A1 | **Service API existence** | No service tier; storefront ↔ RamBase direct; login/search are stock Mozaik | Pretec Service API wraps RamBase for Price/Cart/Quote/Query (`commerce-overview-design.md:40`; `service-api-design.md:13,27,29,81,116`) | 🟧 Abstraction (but see A2–A5) | High |
| A2 | **Customer data path** | Direct from RamBase | Synced **RamBase → Harmony → Storefront** (`commerce-overview-design.md:103`; `customer-sync-spec.md:18`) | ⛔ Contradiction | High |
| A3 | **Inventory data path** | *"website calls Rambase directly for … inventory"* | Synced **RamBase → Harmony → Storefront Catalog** (Phase-1 assumption "synced via Harmony, not live", `inventory-sync-spec.md:17,44`) | ⛔ Contradiction | High |
| A4 | **Price mechanism** | Website calls RamBase directly, real-time, nothing stored | Live **via Service API Price (batch)**; Phase-2 optional Redis price cache (`service-api-design.md:72-75,84`) | ⛔ Contradiction (path) / 🟧 (caching) | Med-High |
| A5 | **Orders/invoices path** | Direct from RamBase | **Service API Query** (read-only) (`service-api-design.md:100-107`) | 🟧 Abstraction | Med |
| A6 | **Harmony's role** | Background "integration layer," not on the website's data path | Harmony is the **named transport** for product/category/customer/inventory sync | ⛔ Contradiction | High |

**Why it matters:** acceptance criteria, latency expectations, and effort/cost derived from "direct RamBase calls" misstate the actual build for inventory and customer data (which are *synced copies*, with freshness lag) and hide the bespoke Service API. The "direct" wording in the customer spec should be corrected to "the website reads synced catalog/customer/inventory data and calls RamBase **via the Pretec Service API** for live price/quote/orders" — or at minimum not assert "direct."

> **Note — one-way quote submission is genuinely aligned** (PDF: *"Quotes flow one-way into Rambase"*; us: `service-api-design.md:87-90`). Only the *path* (via Service API) is abstracted.

---

## 3. Authentication, identity & users

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| B1 | **Identity provider** | *"Email-based login using standard Mozaik storefront login"*; Cognito never mentioned | **AWS Cognito** is the identity provider (`authentication-spec.md:16`; `customer-overview-spec.md:180`); login/reset flows themselves are an unwritten to-do | ⛔ Contradiction / 🟧 | High |
| B2 | **User invitations** | *"User invitations are handled through Maestro"* | Invitations sent by **Pretec Sales via Mosaik Backend/Storefront**; Maestro used only for *approval* (`flows-customer-sync.md:29,33-36`) | ⛔ Contradiction | Med |
| B3 | **User roles (org-admin / standard)** | Concrete two-tier role model; roles assigned by Pretec **in RamBase**, website reads only; org-admin manages standard users; cannot self-promote | **Now specified** — two-tier model defined in `security-privacy-spec.md` §3 (org-admin/standard, no self-promotion, assigned in RamBase, read-only on website) | ✅ Resolved (2026-06-24) | — |
| B4 | **Shared order visibility** | Stated as settled: same-company users see same orders | We agree in `service-api-design.md:107`, **but** `customer-overview-spec.md:135` still lists per-user vs per-company as an *open question* (internal inconsistency) | 🔵 Open (close it) | Med |
| B5 | **Entitlements** | Customer-specific *products* + inventory visibility originate from RamBase | We source customer-specific *price/inventory* from RamBase, but never define per-customer *product assortment* as an entitlement (`customer-overview-spec.md:93,174`) | 🟨 Gap (we owe) | Med |
| B6 | **No self-registration** | No self-registration; accounts created manually by Pretec | Aligned on "no account until invite accepted" (`registration-approval-spec.md:28`); **but** our flow has a public self-service *register → company application* step (`flows-customer-sync.md:9,23`) — a terminology/UX difference | 🔵 Open | Med |

---

## 4. Customer registration ("Become-a-Customer" form)

The PDF specifies a **detailed public request form**; our spec captures only *name / company / email* and defers "extra information" to Pretec Sales in Maestro (`flows-customer-sync.md:23`; `registration-approval-spec.md:42-43`).

| # | PDF form field | In our spec? | Kind |
|---|---|---|---|
| C1 | Company name, contact person email | ✅ (name/company/email) | aligned |
| C2 | Department | ❌ | 🟨 Gap |
| C3 | Organization number | ❌ | 🟨 Gap |
| C4 | Contact phone, **direct phone**, address, postal code, city | ❌ (phone is an open question, `registration-approval-spec.md:54`) | 🟨 Gap |
| C5 | Website, company email | ❌ | 🟨 Gap |
| C6 | Invoice method (EHF or e-mail invoice) | ❌ | 🟨 Gap |
| C7 | Shipment arrangement (Pretec arranges / own partner) + shipment partner customer number | ❌ | 🟨 Gap |
| C8 | CoBuilder membership (yes/no) | ❌ | 🟨 Gap |
| C9 | *"Credit check will be done"* notice | ❌ | 🟨 Gap |
| C10 | Submitting does **not** create an account (manual processing) | ✅ (`registration-approval-spec.md:26`) | aligned |

**Structural difference:** the PDF puts org-number, invoice method, shipment and CoBuilder *on the public form*; our model assumes Sales adds that "extra information" later in Maestro. Severity: **High** (the form is a concrete build item; ours is a placeholder).

---

## 5. Catalog, PDP/PLP, search & filtering

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| D1 | **Struct as product data/media/relations source** | All product data/specs/media/relations from Struct PIM (DAM) | Aligned (`product-rambase-struct-harmony-spec.md:69-70,140`) — word "DAM" not used | aligned | Low |
| D2 | **Certifications boundary** | Product/order docs & certs in **Struct**; **company** certs in **Sanity** | Product *documents* in Struct implied (`:69`); **certifications & the company/Sanity split are undocumented** (open `[ ]` `content-sanity-spec.md:44`) | 🟨 Gap | High |
| D3 | **PLP layout** | Grid default 4/row, list 2/row, responsive, toggleable; breadcrumbs; product count | All unspecified — `catalog-browsing-spec.md` is a **stub** (`:24,30` open `[ ]`) | 🟨 Gap | High |
| D4 | **Sorting** | Name A–Z, Name Z–A, Price low→high, Price high→low (standard Mozaik) | Sorting is an open `[ ]` (`search-filtering-spec.md:24`) | 🟨 Gap | Med |
| D5 | **Filtering** | Dynamic; from Struct attributes; **configured in Sanity** | Facets unspecified; ours implies **Struct-driven** faceting, not Sanity-configured (`search-filtering-spec.md:23,33`) | 🟨 Gap / mild ⛔ | Med |
| D6 | **PDP detail** | Structured key/value specs, no fixed schema; relations = related products + spare parts + PIM types; doc download on PDP; no per-product quote; add-to-basket login-only | Basket/anonymous rules aligned (`catalog-browsing-spec.md:26`); spec rendering, relation types, PDP doc download all unspecified (`:25,29`) | 🟨 Gap (partial) | Med |
| D7 | **Search scope** | Standard Mozaik search; **products + articles only** | Search engine itself still open (`search-filtering-spec.md:20`); products+articles scope not recorded | 🟨 Gap | High |

> `catalog-browsing-spec.md`, `catalog-publish-spec.md`, `search-filtering-spec.md`, `content-sanity-spec.md`, `storefront-customization-spec.md` are all **stubs** — most D-row gaps are "unwritten on our side," and the PDF can serve as input to fill them.

---

## 6. Pricing display

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| E1 | **Base pricing rules** | NOK; logged-in only; anonymous none; customer/project price else list price, resolved in RamBase | Aligned (`localization-spec.md:29`; `customer-overview-spec.md:94-95`; IPA model `definitions.md:18-41`) | aligned | — |
| E2 | **Special-price saving display** | When a special/reduced price applies, show **original price + special price + saving (NOK) + saving (%)** | **Absent everywhere.** Adjacent items even mark discount fields "to be confirmed" (`qa-spec.md:167`) and Phase 1 assumes "no tiered pricing" (`customer-overview-spec.md:101`) | 🟨 Gap (we owe) — **NEW** | High |

**E2 is the standout new functional requirement.** It implies the storefront receives both list and special prices and computes/derives the saving — a UI + price-data-contract item not in any current spec. Confirm which fields RamBase returns (the PDF itself flags this as an open question).

---

## 7. Content (Sanity)

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| F1 | **Content types** | 7 named: Article, News, Reference project, About us, Terms & conditions, Information page, Company certifications landing page | Stub lists *different generic candidates* (editorial landing / category / product editorial / navigation / banners) — `content-sanity-spec.md:34-38`; type list flagged open (`customer-overview-spec.md:251`) | 🟨 Gap | High |
| F2 | **Content blocks** | 6 named: Text, Image, Product list, Link list, Category list, Accordion | **No blocks listed** (`content-sanity-spec.md:42` open `[ ]`) | 🟨 Gap | Med-High |
| F3 | **Non-product imagery** | All website imagery except product media in Sanity | Implied but not explicit; asset handling is open (`content-sanity-spec.md:46`) | 🟨 Gap | Low |
| F4 | **GDPR consent** | Consent text/categories editable in **Sanity**; consent **data** stored/handled in **Maestro** | **Decided** — `security-privacy-spec.md` §7: 2 consents per contact (privacy-policy + marketing) **synced to RamBase Privacy**; SoFa's "Maestro" is an **error to correct in the customer spec** | ✅ Resolved our side — PDF to fix (2026-06-24) | — |

---

## 8. Cart, checkout & My Page

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| G1 | **Anonymous cart** | Internally inconsistent: Cart section requires login to add; Acceptance Criteria allow *"any visitor … may add products to the basket, submitting requires login"* (PDF flags as open) | **Login-only — anonymous cannot add to cart** (`service-api-design.md:82`; `customer-overview-spec.md:38,58-63`) | ⛔ Contradiction (one PDF branch) / 🔵 Open | High |
| G2 | **Cart expiry** | Not mentioned | **90-day sliding TTL** (`service-api-design.md:118`) — itself an open decision for Pretec (`customer-overview-spec.md:248`) | 🔵 Open | Low |
| G3 | **Checkout: pickup/delivery option** | A selectable field | Not in our payload | 🟨 Gap | Med |
| G4 | **Checkout: preferred shipment date** | Date picker, **defaults to 2 days ahead** | We have "requested delivery date" with **no default** (`service-api-design.md:92-96`) | 🟨 Gap (default) | Low |
| G5 | **Checkout: quote comment** | Not listed | We include a "quote comment/message" field (`service-api-design.md:96`) | 🔵 Open (ours extra) | Low |
| G6 | **Quotes on My Page** | Submitted quotes with status (conditional on RamBase) | **We explicitly exclude quotes from Min side** (`service-api-design.md:98` "Quotes do not appear in Min side") | ⛔ Contradiction | High |
| G7 | **Reorder** | Re-create an order into the basket | **No reorder capability** anywhere in our specs | 🟨 Gap | Med |
| G8 | **Order documentation on My Page** | Order-specific certs/docs from **Struct PIM** on My Page | Min side is RamBase-only (Query API); no Struct docs surfaced there | 🟨 Gap | Med |
| G9 | **Save & resume** | A My Page feature | We scope save/resume to the **cart TTL**, not a My Page feature | 🔵 Open | Low |
| G10 | **User administration on My Page** | Org-admin self-service user management, invitations via Maestro | Not modeled; Maestro isn't customer user-admin in our specs (`commerce-overview-design.md:39`) | 🟨 Gap | Med |
| G11 | **Invoice/receipt PDF** | Conditional on RamBase delivering PDF | Aligned — we mark it "to confirm against RamBase" (`service-api-design.md:110`) | aligned | — |

> The PDF is **internally inconsistent twice**: anonymous cart (G1) and "org-admin assignment out of scope" vs. a My Page "user administration" area (G10 / §10). Our specs happen to resolve both in the stricter direction (login-only cart; no customer org-admin). These need an explicit Pretec decision.

---

## 9. Analytics, environments & scope

| # | Topic | PDF says | We say (evidence) | Kind | Sev |
|---|---|---|---|---|---|
| H1 | **Analytics** | Google Tag Manager + Google Analytics, enhanced e-commerce baseline | **Absent from the entire repo** — no GTM/GA spec, no row in `spec-index.md` (only OTEL/Grafana *operational* observability) | 🟨 Gap (we owe) — **NEW integration** | High |
| H2 | **Environment tiers** | dev/test → staging → production | Aligned: test → staging/UAT → production (`environments-spec.md:16-20`) | aligned | — |
| H3 | **Release governance** | Pretec tests & **must approve** on staging; **production re-test** before go-live | **Now specified** — `environments-spec.md` §3 adopts the SoFa release process (test → staging/UAT → Pretec approval → production, prod re-test before go-live) | ✅ Resolved (2026-06-24) | — |
| H4 | **Out of scope** | Payments, shipping, self-registration, account creation, quote downstream | Aligned (`customer-overview-spec.md:36-44`) | aligned | — |
| H5 | **Deferred** | Additional markets/languages; non-NOK currencies | Aligned (`customer-overview-spec.md:41-42`; `spec-index.md:100`) | aligned | — |
| H6 | **Quote statuses** | Conditional My Page feature | We treat quotes as **excluded** from Min side, not conditional (see G6) | ⛔ Contradiction | High |

---

## 10. Where we *are* aligned (so it isn't re-litigated)

Localization (Norwegian-only, NOK, multi-language architecture, Maestro redirects) · one-way quote submission to RamBase · request-for-quote / no firm online ordering · no payments / no shipping · environment tiers · deferred markets/currencies · Struct as product data & media source · prices/inventory/cart gated to logged-in users · no self-registration (account on invite) · invoice-PDF treated as conditional on RamBase.

---

## 11. Recommended next actions

**Reconcile the contradictions (⛔) with Pretec first — these change the build:**
1. **Architecture wording (A2–A6, H6):** correct the customer spec's "calls RamBase directly" to reflect synced catalog/customer/inventory + Service API for live calls; decide whether quotes appear on My Page (G6/H6) — our spec currently excludes them.
2. **Auth (B1):** confirm Cognito is the identity provider behind "Mozaik login," or correct one side.
3. **Invitations (B2):** decide Maestro vs Sales/Backend as the invitation owner.
4. **Anonymous cart (G1):** resolve the PDF's own open question — recommend "login-only" to match our cart model.

**Absorb the net-new requirements (🟨) into our specs:**
5. Entitlements-as-product-assortment (B5). *(User-role model B3 — ✅ done, `security-privacy-spec.md` §3.)*
6. Become-a-Customer full field list + "credit check" notice (C2–C9).
7. Special-price saving display (E2) — confirm RamBase fields.
8. Sanity content types & blocks, certifications boundary (D2, F1, F2). *(Consent model F4 — ✅ decided: RamBase Privacy; correct the SoFa PDF.)*
9. PLP/PDP/search detail to fill the catalog & search stubs (D3–D7).
10. **Analytics (GTM/GA) — add a new integration row to `spec-index.md`** (H1); it has no home today.
11. Reorder, My Page Struct docs, customer user-administration (G7, G8, G10). *(Release-governance gate H3 — ✅ done, `environments-spec.md` §3.)*

**Close our own open items the PDF settles (🔵):** shared order visibility (B4), and confirm whether a public self-service registration form exists (B6).

---

*Generated from a four-way comparison of the SoFa Workbench PDF against the internal spec set. File:line references point at the internal specs as of 2026-06-24; several internal specs (catalog, search, content, environments, security, customer-sync, registration) are stubs, which accounts for most "Gap (we owe)" rows.*
