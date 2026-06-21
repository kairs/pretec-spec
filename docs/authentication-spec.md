# Authentication & Identity Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing material
**Audience:** Pretec and Geta
**Scope:** Identity, authentication, and the RamBase customer link
**Index ref:** [spec-index.md](spec-index.md) → A-1
**Consolidates:** [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md) + [flows-customer-sync.md](flows-customer-sync.md)

---

## 1. Purpose

Promote the authentication mechanics — currently split between the Service API spec and the customer-sync
flows — into a single identity spec. Identity = **AWS Cognito + Storefront DB**, linked to a **RamBase
customer**.

---

## 2. Already documented (pull in / don't duplicate)

- Cognito ID-token validation; `custom:rambaseCustomerId` claim — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)
- Pre-Token-Generation Lambda injects the claim at login/refresh — [flows-customer-sync.md](flows-customer-sync.md)
- Refresh-on-approval & missing-claim handling — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 3. To specify / consolidate

- [ ] Cognito user pool config (attributes, custom claims, token lifetimes)
- [ ] Pre-Token-Generation Lambda behavior (claim source = Storefront DB `rambaseCustomerId`)
- [ ] ID-token (not access-token) validation rationale — avoids Cognito Plus tier
- [ ] Login / refresh / logout flows
- [ ] Forcing token refresh on approval
- [ ] Missing-claim / pending-approval handling
- [ ] Session management
- [ ] Security details cross-ref → [X-5 Security & privacy](security-privacy-spec.md)

## 4. Caveats (from Service API §3)

- The claim reflects link state **at token issuance**; a user linked after login picks it up only on refresh.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Auth implementation | Build & operate (Cognito + Lambda) | Approve link/approval process |

## 6. Success criteria

- Users authenticate via Cognito; approved users carry a valid `rambaseCustomerId` claim.
- Pending/anonymous users are correctly scoped; claim refreshes on approval.
