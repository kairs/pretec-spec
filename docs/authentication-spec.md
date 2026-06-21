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

Onboarding is **invitation-based** (see authoritative [`sign-up.png`](sign-up.png)): the **Cognito user is
created when the invitation is accepted**, *after* the company exists in RamBase. So the account is **born
already linked** — the `custom:rambaseCustomerId` is known at creation, not retrofitted after a separate
approval step.

---

## 2. Already documented (pull in / don't duplicate)

- Cognito ID-token validation; `custom:rambaseCustomerId` claim — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)
- Pre-Token-Generation Lambda injects the claim at login/refresh — [flows-customer-sync.md](flows-customer-sync.md)
- Account + claim created at invitation acceptance — [flows-customer-sync.md Diagram 1](flows-customer-sync.md) / [`sign-up.png`](sign-up.png)

## 3. To specify / consolidate

- [ ] Cognito user pool config (attributes, custom claims, token lifetimes)
- [ ] **Account creation at invitation acceptance** — create the Cognito user and persist `rambaseCustomerId` from the company-creation step
- [ ] Pre-Token-Generation Lambda behavior (claim source = Storefront DB `rambaseCustomerId`)
- [ ] ID-token (not access-token) validation rationale — avoids Cognito Plus tier
- [ ] Login / refresh / logout flows
- [ ] Missing-claim handling (defensive — should not occur for invitation-created accounts)
- [ ] Session management
- [ ] Security details cross-ref → [X-5 Security & privacy](security-privacy-spec.md)

## 4. Caveats (from Service API §3)

- The claim is resolved **at token issuance**. In the invitation model the id is known before the account
  exists, so a newly created user carries the claim from first login — no refresh-on-approval gap. The
  caveat still applies if a customer link **changes** after the account exists (force a refresh, or use
  short token lifetimes).

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Auth implementation | Build & operate (Cognito + Lambda) | Approve link/approval process |

## 6. Success criteria

- Users authenticate via Cognito; invitation-created users carry a valid `rambaseCustomerId` claim from
  first login.
- Pre-account (anonymous) users are correctly scoped; claim is reliably present for active accounts.
