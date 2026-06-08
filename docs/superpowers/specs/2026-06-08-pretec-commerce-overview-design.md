# Pretec Commerce Platform — System Overview Specification

**Date:** 2026-06-08
**Status:** Draft for customer review
**Audience:** Pretec (customer) and Geta (delivery team)
**Source diagram:** `docs/service-overview v2.png`

---

## 1. Purpose & audience

This specification describes the **commerce platform Geta is building for Pretec** and establishes a
**shared understanding of (a) what will be built and (b) who is responsible** for each part.

It is written for Pretec stakeholders first: precise enough to agree on scope and responsibility,
readable without deep technical knowledge. It is the **top-level document**. Each capability has (or
will have) its own detailed sub-spec — see §5.

How to read it:
- §2–§3 — the systems involved and who owns / builds / provides what.
- §4 — how data moves through the platform.
- §5 — the capabilities being built, each with scope and responsibility.
- §6 — concerns that span all capabilities (login, languages, hosting).
- §7 — questions still open.

---

## 2. Systems at a glance

| System | Role | Provided by |
|---|---|---|
| **RamBase** | ERP and **source of truth** for customers, products, categories, prices, inventory, orders/invoices | Third-party SaaS (Pretec's instance) |
| **Struct** | **PIM** — product information enrichment and product assets | Third-party SaaS (Pretec's instance) |
| **Sanity** | **Headless CMS** — editorial content and content assets | Third-party SaaS (Pretec's instance) |
| **AWS Cognito** | Authentication / identity for storefront users | AWS (operated by Geta) |
| **Mosaik** | The **commerce platform (SaaS)** — the umbrella product containing Harmony, Storefront and Maestro | Mosaik (Geta's platform product), consumed as a platform |
| ├─ **Mosaik Harmony** | Platform **sync & integration engine** — moves synced data between RamBase, Struct and the Storefront | Mosaik platform; **Geta configures** for Pretec |
| ├─ **Mosaik Storefront** | The customer-facing web application — a platform **starterkit** | Mosaik platform; **Geta customizes** for Pretec |
| └─ **Mosaik Maestro** | Backoffice to look into the Storefront — redirects, translations, view users, service versions | **Mosaik SaaS (as-provided)**; Geta/Pretec configure only |
| **Pretec Service API** | **Custom API built for this project** — wraps the [RamBase API](https://api.rambase.net/) and exposes **live** Price / Query / Cart / Quote to the Storefront | **Geta builds** |

**Mosaik** is the commerce platform (a SaaS product). For this project it is consumed as a platform:
**Harmony is configured**, the **Storefront starterkit is customized**, and **Maestro is used as-provided**.
The **Pretec Service API** is bespoke code Geta builds for this project (formerly labelled "RamBase Service
API" in v1 of the diagram).

---

## 3. Responsibility model

Parties:
- **Mosaik** — the SaaS platform; provides Harmony, the Storefront starterkit, and Maestro.
- **Geta** — the delivery team; configures Harmony, customizes the Storefront, builds the Pretec Service API and all integrations, models Sanity content, operates hosting.
- **Pretec** — the customer; owns source data, platform subscriptions/accounts, content authoring, and approvals.
- **RamBase / Struct / Sanity** — third-party data platforms.

We use a **RACI-lite** convention: **R (Responsible)** = does the work; **A (Accountable / provides inputs)** = owns the data, accounts, configuration and approvals it depends on.

### 3.1 Data ownership ("owner of data" — red boxes in the diagram)

| Data | Owner (system) | Owned by (party) |
|---|---|---|
| Customer | RamBase | Pretec |
| Price | RamBase | Pretec |
| Inventory | RamBase | Pretec |
| Order / Invoice | RamBase | Pretec |
| Cart | Pretec Service API | Pretec (data) / Geta (API) |
| Product (master) | RamBase | Pretec |
| Product assets | Struct | Pretec |
| Content & content assets | Sanity | Pretec |

Product and category **master data originate in RamBase**, are **enriched in Struct**, then reach the
Storefront Catalog. Product **assets** are owned in Struct; **content** assets and editorial in Sanity.

### 3.2 Build / configure / provide responsibility

| Component | R — does the work | A — provides inputs |
|---|---|---|
| Mosaik platform (Harmony, Storefront starterkit, Maestro) | Mosaik (provides) | — |
| Storefront customization | Geta | Pretec (brand, content, requirements) |
| Harmony sync configuration | Geta | Pretec (RamBase/Struct access, field-mapping rules) |
| Maestro usage | Geta / Pretec (configure) | Pretec (operational policies) |
| Pretec Service API | Geta (builds) | RamBase (underlying API & data), Pretec (access) |
| RamBase integration | Geta | Pretec + RamBase (API access, scopes) |
| Struct integration | Geta | Pretec (PIM model, enrichment) |
| Sanity integration & content model | Geta (model) | Pretec (authoring content) |
| Authentication (Cognito + RamBase linking) | Geta | Pretec (customer-link approval process) |
| Hosting / operations | Geta (AWS) | Pretec (commercial agreement) |

---

## 4. Architecture & data flows

Two patterns move data through the platform:

### 4.1 Synced data — copied into the Storefront via **Harmony**

Used for data that can be pre-computed and browsed without a specific user:

- **Product:** RamBase → Harmony (Product Sync) → **Struct** (enrich) → Harmony (Catalog Sync) → Storefront *Catalog*
- **Category:** RamBase → Harmony (Category Sync) → Struct → Catalog
- **Product assets:** Struct → Catalog
- **Customer:** RamBase → Harmony (Customer Sync) → Storefront *Customer User*
- **Inventory:** RamBase → Harmony (Inventory Sync) → Storefront *Catalog*
- **Content:** Sanity (Documents + content assets) → Storefront *Content*

### 4.2 Live data — fetched on demand via the **Pretec Service API**

Used for data that is user-specific or transactional. The Service API exposes three operations:

- **Price (live):** the Storefront looks up the logged-in user's specific **B2B price** in real time. No price for anonymous users.
- **Query:** read-only lookup of **ongoing and historic orders/invoices** (powers Min side).
- **Cart:** the Storefront cart is backed by the Service API cart.
- **Quote:** the Storefront's checkout flow creates a **quote (request)**, which the Service API submits to **RamBase** (creates the quote there). B2B request-for-quote — not a directly confirmed sales order.

### 4.3 Flow diagram (logical, per v2)

```
                       End user
                          │
                ┌─────────▼──────────┐
                │  Mosaik Storefront │  (starterkit, customized by Geta)
                │ Catalog  Price     │
                │ CustUser Cart      │
                │ Content  Quote     │
                │          Min side  │
                └─┬────┬──────┬────┬─┘
         synced   │    │      │    │   live
   ┌──────────────┘    │      │    └─────────────┐
   │             ┌─────┘      └─────┐            │
┌──▼─────────┐   │                  │     ┌──────▼─────────────┐
│  Harmony   │   │                  │     │ Pretec Service API │ (Geta builds)
│  (sync)    │   │                  │     │  Price Query       │
└──┬────┬────┘   │                  │     │  Cart  Quote       │
   │    │    ┌───▼────┐   ┌─────────▼─┐   └──────┬─────────────┘
   │    └───▶│ Struct │   │  Sanity   │          │
   │         │ (PIM)  │   │  (CMS)    │          │
   │         └───┬────┘   └───────────┘          │
   │             │                               │
┌──▼─────────────▼───────────────────────────────▼──┐
│                    RamBase (ERP)                   │
│  Customer Price Product Category                   │
│  Inventory  Order/Invoice                          │
└────────────────────────────────────────────────────┘
```

---

## 5. Capabilities (sub-specs)

Each capability is a **vertical slice** the customer recognizes as a feature, and will get its own
detailed sub-spec. Listed here with scope and responsibility.

### 5.1 Catalog & Product
**Scope:** Browsing products and categories; data sourced from RamBase, enriched in Struct, synced to the
Catalog via Harmony; product assets from Struct; inventory display from RamBase. Includes anonymous browsing
(no prices). **Out:** pricing logic (§5.3), search specifics (open question).
**R:** Geta (config + customization). **A:** Pretec (product/category data in RamBase, enrichment in Struct).

### 5.2 Customer & Authentication
**Scope:** Self-registration on the Storefront, identity in **AWS Cognito + Storefront database**, and
**linking/approval against a RamBase customer**. Customer data synced from RamBase via Harmony.
**R:** Geta. **A:** Pretec (customer master data, the approval/linking process).

### 5.3 Pricing
**Scope:** **Live** per-user B2B price lookup via the **Pretec Service API** for logged-in, linked users; no
prices for anonymous users. **R:** Geta (Service API + Storefront). **A:** Pretec + RamBase (price data and underlying RamBase API).

### 5.4 Cart, Checkout & Quote
**Scope:** Storefront cart backed by the Service API **Cart**; a Storefront checkout flow that creates a
**quote (request)** via the Service API **Quote** → RamBase. **R:** Geta (Storefront + Service API).
**A:** Pretec + RamBase (underlying RamBase cart/quote behavior).

### 5.5 My Page / Min side
**Scope:** **Read-only** view of ongoing and historic order/invoice status via the Service API **Query**.
**R:** Geta (Storefront + Service API). **A:** Pretec + RamBase (underlying RamBase order/invoice data).

### 5.6 Content / CMS
**Scope:** Editorial content and content assets authored in Sanity and rendered in the Storefront.
**R:** Geta (content model + integration). **A:** Pretec (authoring). *(Content types — open question.)*

### 5.7 Harmony — sync configuration
**Scope:** Configuring the Mosaik Harmony engine to sync Product, Category, Customer, Inventory (and feed
Catalog) between RamBase, Struct, and the Storefront. Foundational for §5.1, §5.2.
**R:** Geta (configuration). **A:** Pretec (system access, mapping rules). Mosaik provides the engine.
*(Sync mechanism, frequency, error handling — open question.)*

### 5.8 Maestro — backoffice (as-provided)
**Scope:** Using Mosaik's **as-provided** backoffice to look into the Storefront — redirects, translations,
view users, service versions. **No custom build for this project** — configuration/usage only.
**R:** Geta / Pretec (configure & operate). **A:** Pretec (operational policies). Mosaik provides Maestro.

### 5.9 Pretec Service API — live integration engine
**Scope:** The **Geta-built** API that talks to RamBase and exposes **live** capabilities to the Storefront —
per-user **Price**, **Query** (orders/invoices), **Cart**, and **Quote**. The live counterpart to Harmony's
sync. Foundational for §5.3, §5.4, §5.5. **R:** Geta (builds). **A:** Pretec + RamBase (underlying RamBase
API access, scopes, data).
*(API surface, auth/token handling, caching, error/timeout behavior — open question.)*

---

## 6. Cross-cutting concerns

- **Authentication:** All user-specific features (price, cart, quote, Min side) require a logged-in user.
  Identity = Cognito + Storefront DB; users self-register and are linked/approved to a RamBase customer.
- **Anonymous vs logged-in:** Anonymous users may browse the catalog but see **no prices** and cannot use
  cart/checkout/Min side.
- **Localization:** Translations are managed via Maestro — implies multi-language support in the Storefront
  (scope of languages/markets is an open question).
- **Hosting / operations:** Geta operates the Storefront on AWS (Cognito implies AWS). Mosaik platform
  versioning/upgrades and environments to be detailed.

---

## 7. Open questions

Carried from `qa-spec.md`, grouped by sub-spec:

- **Harmony:** sync mechanism (event-driven vs scheduled), frequency, direction, conflict/error handling, initial vs delta loads.
- **Content/CMS:** which content is authored in Sanity (editorial pages, product editorial, navigation) and how it relates to catalog data.
- **Catalog:** search/filtering and what powers it; localization / languages; markets / currencies.
- **Pricing:** caching of live prices; behavior on Service API failure.
- **Cart/Quote:** what the customer provides at checkout (PO/reference, delivery address, requested date, comments); what happens after a quote is created in RamBase.
- **Maestro:** full feature list; who operates it (Geta ops vs Pretec admins).
- **Pretec Service API:** API surface, authentication/token handling, caching, error/timeout behavior.
- **Mosaik platform:** which capabilities are config-only vs require Storefront-starterkit customization; versioning/upgrade responsibility.
- **Non-functional:** performance, availability, environments, hosting details.

---

## Appendix — diagram legend

- **Red box** = "owner of data" for that entity.
- **Arrow** = request direction.
- **v2 changes:** platform spelled **Mosaik**; Service API split into Query / Cart / Quote; live **Price**
  lookup shown at the Storefront; quote distinct from cart in checkout.
