# RamBase API Integration Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing research
**Audience:** Pretec and Geta
**Scope:** The RamBase API integration model — auth, credentials, scoping, environments
**Index ref:** [spec-index.md](spec-index.md) → I-6
**Consolidates:** [RamBase API Audit](superpowers/research/rambase-api-audit.md) + [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Promote the RamBase API research into a single integration spec describing how Geta's services authenticate
to and call RamBase — the shared foundation under Price, Cart, Quote, Query, and the customer write-back.

---

## 2. Already documented (pull in / don't duplicate)

- Auth model: OAuth2 Client-Credentials, Bearer, `$db` selects company — [audit §Auth](superpowers/research/rambase-api-audit.md)
- Orders/invoices endpoints + cursor pagination (`$top`/`$pageKey`, `$inlineCount`) — [audit §Orders & Invoices](superpowers/research/rambase-api-audit.md)
- Document/PDF mechanism (PEPPOL / Document-Messages) — [audit §Documents](superpowers/research/rambase-api-audit.md)
- Service-side auth hops — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 3. To specify / consolidate

- [ ] Single system/integration credential model & scopes
- [ ] Credential storage and rotation per environment (ties to [X-5 Security](security-privacy-spec.md))
- [ ] Customer-scoping by parameter (`$filter` on customer)
- [ ] Environment mapping — RamBase test vs. production (ties to [X-2 Environments](environments-spec.md))
- [ ] Rate limits, retries, timeouts (ties to [X-4 Resilience](spec-index.md))
- [ ] Document types in use (see [definitions.md](definitions.md): ART, AGR, CRQ, CQU, COA, CUS, IPA, PLI)

## 4. Open items (need RamBase credentials — from Service API §8)

- ⚠️ Customer-specific **price** lookup endpoint for `(product, customer, qty)`.
- ⚠️ Exact `$filter` field paths for date/status/PO; Sales Invoice (CIN) + credit notes.
- ⚠️ Create-quote endpoint (CRQ→CQU→COA) and required fields.
- ⚠️ Whether a single system account may read prices for any customer by parameter.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Integration build | Build & operate | Provide RamBase API access & scopes |

## 6. Success criteria

- Services authenticate to RamBase reliably per environment with rotatable credentials.
- Customer-scoped reads/writes work via the agreed parameters; open items resolved during build.
