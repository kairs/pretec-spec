# Customer Registration & Approval Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing flows
**Audience:** Pretec and Geta
**Scope:** Company application, approval, invitation, and account creation (invitation-based onboarding)
**Index ref:** [spec-index.md](spec-index.md) → F-7
**Consolidates:** [flows-customer-sync.md Diagram 1](flows-customer-sync.md) + [customer-overview §4.7](customer-overview-spec.md)

---

## 1. Purpose

Promote the registration/approval flow into its own spec covering the user-facing journey and the operating
process behind it. This platform uses an **invitation-based onboarding** model (see authoritative
[`sign-up.png`](sign-up.png)): a registration raises a **company application**; the **user account is created
only when the invitation is accepted**. The sync/company-creation mechanics live in
[I-4 Customer sync](customer-sync-spec.md); this spec covers the **experience and process**.

---

## 2. Application & account states (invitation-based)

- **Anonymous** — browse catalog only; no account.
- **Application pending** — a company application has been submitted; **no user account exists yet**.
  Pretec Sales reviews and fills in extra needed information.
- **Approved / invited** — application approved, company created in RamBase, invitation sent; **account not
  yet created**.
- **Completed / active** — user accepted the invitation; **account created** and the user↔RamBase-customer
  mapping recorded in Mosaik; full B2B access (live price/cart/quote/orders).

> Note: because the account is created at invitation acceptance, there is **no logged-in "pending" user
> browsing with an account**. Pre-account browsing is plain anonymous browsing.

## 3. Already documented (pull in / don't duplicate)

- Signup → company application → approval → invitation → account sequence — [flows-customer-sync.md Diagram 1](flows-customer-sync.md) / [`sign-up.png`](sign-up.png)
- Mapping recorded from the new RamBase id at account creation — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 4. To specify

- [ ] Registration form fields (name, company, email — confirm whether phone is captured)
- [ ] Company-application review screen in Maestro — what "extra needed information" Pretec Sales fills in
- [ ] Approval → company creation in RamBase (ties to [I-4 Customer sync](customer-sync-spec.md))
- [ ] Invitation mechanism — email content, token/link, expiry, resend
- [ ] Invitation acceptance → account (Cognito user) creation + user↔customer mapping recorded in Mosaik
- [ ] Who invites (Pretec Sales per diagram) and who approves
- [ ] De-duplication when the company already exists in RamBase
- [ ] Customer deactivation handling
- [ ] Re-invitation / additional users on an existing company

## 5. Open decisions

- Whether **phone** is captured at registration (spec earlier listed it; diagram shows name/company/email).
- Invitation expiry and resend rules.
- Adding **further users** to an already-onboarded company (same application flow, or a lighter invite-only path?).
- What happens if a RamBase customer account is deactivated.

## 6. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Registration/approval build | Implement agreed flow | Define approvers & operating process |

## 7. Success criteria

- Users can submit a company application; approval creates the company in RamBase; the invited user gains
  full B2B access only after accepting the invitation. No account exists before acceptance.
