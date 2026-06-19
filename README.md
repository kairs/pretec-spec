# Pretec Commerce Platform — Spec Repository

This repository contains the design specifications, build plans, research, and open questions for the Pretec B2B commerce platform being delivered by Geta.

---

## Documents

### Specs

| Document | What it covers |
|---|---|
| [Commerce Platform Overview](docs/superpowers/specs/2026-06-08-pretec-commerce-overview-design.md) | Top-level spec: systems, responsibilities, data flows, all capabilities |
| [Pretec Service API](docs/superpowers/specs/2026-06-08-pretec-service-api-design.md) | Sub-spec for the Geta-built .NET service (Price, Cart, Quote, Orders) |
| [Customer Overview Specification](docs/customer-overview-spec.md) | Customer-facing Phase 1 overview: scope, user experience, systems, responsibilities, open decisions |
| [Product Integration Specification](docs/product-rambase-struct-harmony-spec.md) | Product/category flow from RamBase to Struct using Mosaik Harmony |

### Build plans

| Document | What it covers |
|---|---|
| [Service API — Build Phase Plan](docs/superpowers/plans/2026-06-09-pretec-service-api-build.md) | Task-by-task build plan for the Pretec Service API with assumptions register |
| [Service API — API Discovery Plan](docs/superpowers/plans/2026-06-09-pretec-service-api-discovery.md) | Discovery plan for RamBase and Mosaik API contract research |

### Research

| Document | What it covers |
|---|---|
| [Mosaik Platform Contracts](docs/superpowers/research/mosaik-platform-contracts.md) | Mosaik API contract shapes the Service API must mirror |
| [RamBase API Audit](docs/superpowers/research/rambase-api-audit.md) | Findings from auditing the RamBase API (auth, endpoints, pagination, orders) |
| [Service API Decisions](docs/superpowers/research/service-api-decisions.md) | Key technical decisions: cart schema, Cognito model, Istio routing, resilience |

### Planning & team

| Document | What it covers |
|---|---|
| [Team Requirements — Phase 1](docs/team-requirements-phase1.md) | Developer profiles needed for Phase 1 (Frontend, Backend, Platform/DevOps) |
| [Open Questions for Pretec](docs/open-questions-for-pretec.md) | Outstanding questions Pretec must answer; resolved items marked |
| [Customer Questions](docs/customer-questions.md) | Additional questions from customer sessions |

### Diagrams

- `docs/service-overview v4.png` — current architecture diagram (v4)

---

## Project at a glance

**Delivery team:** Geta — builds the Storefront customization, Pretec Service API, Harmony sync configuration, and all integrations.

**Platform:** [Mosaik](https://mosaik.io) — provides Harmony (sync engine), Storefront starterkit (Next.js/React), and Maestro (backoffice). Consumed as a SaaS platform.

**Source systems:**
- **RamBase** — ERP; source of truth for products, pricing, inventory, customers, orders
- **Struct** — PIM; product enrichment and assets
- **Sanity** — headless CMS; editorial content

**Key custom build:** The **Pretec Service API** (.NET 10, ASP.NET Core) wraps RamBase and exposes live Price, Cart, Quote, and Order operations to the Storefront — mirroring Mosaik's standard API contracts so the starterkit can be reused without forking.

**Environments:** test, staging/UAT, production (three only — staging doubles as UAT).
