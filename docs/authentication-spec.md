# Authentication & Identity Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing material
**Audience:** Pretec and Geta
**Scope:** Identity, authentication, and resolving the RamBase customer for a user
**Index ref:** [spec-index.md](spec-index.md) → A-1
**Consolidates:** [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md) + [flows-customer-sync.md](flows-customer-sync.md)

---

## 1. Purpose

Promote the authentication mechanics into a single identity spec.

- **Authentication / identity:** AWS Cognito establishes *who the user is* (the authenticated subject).
- **RamBase customer resolution:** the **Mosaik platform already holds the user↔RamBase-customer mapping**.
  The RamBase customer id is **resolved server-side from that mapping**, keyed by the authenticated user —
  it is **not** carried as a token claim.

> **Design change (2026-06-21):** the earlier design injected `custom:rambaseCustomerId` into the Cognito
> ID token via a Pre-Token-Generation Lambda. That is **no longer needed** — Mosaik already maintains the
> mapping, so the customer id is looked up rather than carried in the token. This **removes the Lambda and
> the refresh-on-approval gap** entirely.

Onboarding is **invitation-based** (see authoritative [`sign-up.png`](sign-up.png)): the **Cognito user is
created when the invitation is accepted**, *after* the company exists in RamBase, and the user↔customer
mapping is recorded in Mosaik at that point.

---

## 2. Already documented (pull in / don't duplicate)

- Cognito ID-token validation for identity — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)
- Account created (and mapping recorded) at invitation acceptance — [flows-customer-sync.md Diagram 1](flows-customer-sync.md) / [`sign-up.png`](sign-up.png)

## 3. To specify / consolidate

- [ ] Cognito user pool config (attributes, token lifetimes) — **no custom RamBase claim**
- [ ] **Account creation at invitation acceptance** — create the Cognito user and record the user↔RamBase-customer mapping in Mosaik
- [ ] ID-token validation (issuer/audience) for identity; ID-token vs. access-token rationale
- [ ] **Customer resolution** — the Service API obtains the RamBase customer from the Mosaik mapping via the customer-public **`GET /customers/current`** (resolves the signed-in principal to a customer/company — see [contracts §Customer context](superpowers/research/mosaik-platform-contracts.md)), keyed by the Cognito subject
- [ ] Login / refresh / logout flows
- [ ] **No-mapping handling** — authenticated user with no RamBase customer mapping → clear "not onboarded" state, never a 500
- [ ] Caching/lifetime of a resolved mapping (if the Service API caches it per request/session)
- [ ] Session management
- [ ] Security details cross-ref → [X-5 Security & privacy](security-privacy-spec.md)

## 4. Notes

- Because the mapping is resolved live from Mosaik (not frozen into a token at login), a change to a user's
  customer link takes effect **immediately** on the next request — there is no token-refresh dependency.
- The frontend never sends the RamBase customer id; the Service API resolves it from the authenticated
  identity, preventing a client from spoofing another customer.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Auth implementation | Build & operate (Cognito + customer resolution from Mosaik mapping) | Approve onboarding / mapping process |

## 6. Success criteria

- Users authenticate via Cognito; the Service API reliably resolves the correct RamBase customer from the
  Mosaik mapping for each authenticated request.
- Anonymous (pre-account) users are correctly scoped; an authenticated user with no mapping gets a clear
  "not onboarded" state.
- A customer-link change takes effect immediately, with no token-refresh gap.
