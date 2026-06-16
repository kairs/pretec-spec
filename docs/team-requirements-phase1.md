# Developer Requirements — Phase 1

**Date:** 2026-06-16
**Project:** Pretec Commerce Platform
**Delivery team:** Geta

---

## Overview

Phase 1 covers the full initial build: Catalog & Product, Customer & Authentication, Pricing, Cart/Checkout/Quote, Min side (orders), Content/CMS, Harmony sync, and the Pretec Service API. Three developer profiles are required to cover the workstream split.

---

## Profile 1 — Frontend Developer (Mosaik Storefront / Next.js)

**Main workstreams:** Storefront customization, all user-facing UI

### Responsibilities
- Customize the **Mosaik Storefront starterkit** (Next.js/React) to Pretec's brand and requirements
- Implement catalog pages: product listing, product detail, category navigation
- Implement user flows: self-registration, login, pending-approval state, account linking
- Implement cart and checkout (quote-request) flow
- Implement **Min side** (My Page): order list, order detail, filters
- Integrate Sanity CMS content into storefront pages (editorial pages, category content, navigation)
- Consume the Pretec Service API for live price display, cart state, and quote submission
- Handle **anonymous vs logged-in** states throughout (no prices, no cart for anonymous)
- Integrate Maestro (redirects, translations) as configured

### Required skills
- **Next.js / React** — strong production experience
- TypeScript
- REST API consumption (JSON)
- Familiarity with headless CMS patterns (Sanity is a plus)
- Understanding of JWT-based auth flows (Cognito ID tokens)
- CSS/design systems — ability to implement brand without major UX design experience

### Nice to have
- Prior Mosaik Storefront starterkit experience
- Experience with Sanity Studio content modelling

---

## Profile 2 — Backend Developer (.NET / Integration)

**Main workstreams:** Pretec Service API, RamBase integration, Harmony configuration

### Responsibilities
- Build the **Pretec Service API** (.NET 10, ASP.NET Core minimal APIs) end-to-end:
  - RamBase OAuth2 client-credentials token client (with cache and refresh)
  - Cognito ID-token JWT validation; `custom:rambaseCustomerId` claim extraction
  - Polly resilience pipelines (read: retries + circuit-breaker; write: no retry)
  - Price endpoint: `POST /prices` — batch live price lookup from RamBase
  - Cart endpoints: MongoDB-backed cart with TTL, anonymous/logged-in merge on sign-in, live-price projection on read
  - Quote endpoint: `POST /carts/{id}/create-order-request` — translate cart to RamBase sales quote
  - Query endpoints: `GET /orders` / `GET /orders/{id}` — read-only order history scoped to customer
  - OpenTelemetry instrumentation (OTLP → Grafana)
- Configure **Mosaik Harmony** sync: Product, Category, Customer, Inventory — RamBase → Struct → Catalog
- Verify RamBase price-lookup and quote-create endpoint contracts (A5/A6) against the live API
- Set up Istio `VirtualService` routing manifest (price/cart/quote/orders paths → Service API)

### Required skills
- **.NET 10, ASP.NET Core** — strong production experience
- **MongoDB** (MongoDB.Driver, document design, TTL indexes)
- REST API integration: OAuth2 client-credentials flows, JSON API clients
- **Polly / Microsoft.Extensions.Http.Resilience** — resilience pipelines
- JWT validation (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- Unit and integration testing: xUnit, FluentAssertions, NSubstitute, WireMock.Net, Testcontainers
- OpenTelemetry (.NET SDK, OTLP exporter)

### Nice to have
- Mosaik Harmony configuration experience
- RamBase API experience
- Kubernetes manifest authoring (Istio VirtualService)
- Struct PIM integration

---

## Profile 3 — Platform / DevOps Engineer

**Main workstreams:** AWS infrastructure, CI/CD, observability, environments

### Responsibilities
- Operate and configure **AWS EKS** cluster for the Pretec Service API alongside existing Mosaik services
- Set up and configure **AWS Cognito** user pool:
  - App client, hosted UI or custom UI integration
  - **Pre-Token-Generation Lambda** that injects `custom:rambaseCustomerId` into the ID token
- Configure **Istio** service mesh and `VirtualService` for path-based routing
- Provision **MongoDB** (Atlas or self-managed on EKS) with correct indexes, TTL, and access controls
- Manage **three environments** (test, staging/UAT, production) with correct RamBase `$db` targeting per environment
- Set up CI/CD pipelines (build, test, deploy) for the .NET Service API and Next.js Storefront
- Wire **OpenTelemetry → Grafana** observability stack; ensure service name `pretec-service-api` appears in dashboards
- Manage secrets (RamBase client credentials, Cognito config, OTLP endpoint) via the cluster secret store
- Ensure GDPR/data residency requirements are met at the infrastructure level

### Required skills
- **AWS** — EKS, Cognito, Lambda, IAM, ECR
- **Kubernetes** — workload manifests, namespaces, resource limits
- **Istio** — VirtualService, DestinationRule, gateway configuration
- **Terraform** or equivalent IaC
- CI/CD (GitHub Actions, or the team's existing toolchain)
- MongoDB operations (Atlas or self-managed)
- Secrets management (AWS Secrets Manager / Kubernetes Secrets)

### Nice to have
- Grafana / OpenTelemetry stack operations
- Experience running Mosaik platform services on EKS

---

## Team composition summary

| Role | Count | Critical path |
|---|---|---|
| Frontend Developer (Next.js / Mosaik Storefront) | 1–2 | Storefront customization blocks all user-facing UI |
| Backend Developer (.NET / Integration) | 1–2 | Pretec Service API + Harmony config — blocks Pricing, Cart, Quote, Orders |
| Platform / DevOps Engineer | 1 | EKS, Cognito, Istio, environments — blocks everything from deploying |

A team of **3–4 developers** (1 Platform + 1–2 Frontend + 1 Backend) can cover Phase 1 in parallel once environments are provisioned. The Backend and Platform roles have the most front-loaded dependencies; Frontend can begin Storefront customization against mock APIs while the Service API is built.

---

## Key constraints and dependencies

- **RamBase credentials** are now available (10.1 resolved) — Price (Task 5) and Quote (Task 7) are unblocked.
- **RamBase test/staging `$db` values** still needed (10.2 open) — the Platform engineer needs these to configure environments.
- **Mosaik Storefront starterkit** must be forked/instantiated before Frontend can begin customization.
- **Harmony configuration** can only begin once RamBase and Struct access is confirmed.
- The `.NET service repository` must be created (matching existing Mosaik service conventions) before the Backend developer can scaffold the solution.
