# Customer Registration & Approval Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing flows
**Audience:** Pretec and Geta
**Scope:** Self-registration, approval, and linking a storefront user to a RamBase customer
**Index ref:** [spec-index.md](spec-index.md) → F-7
**Consolidates:** [flows-customer-sync.md Diagram 1](flows-customer-sync.md) + [customer-overview §4.7](customer-overview-spec.md)

---

## 1. Purpose

Promote the registration/approval flow into its own spec covering the user-facing journey and the operating
process behind it. The sync mechanics live in [I-4 Customer sync](customer-sync-spec.md); this spec covers
the **experience and process**.

---

## 2. User states (from customer overview)

- **Anonymous** — browse catalog only.
- **Pending approval** — registered, not yet linked; browse only, **no price/cart/checkout**.
- **Approved / linked** — full B2B access.

## 3. Already documented (pull in / don't duplicate)

- Registration → approval → claim sequence — [flows-customer-sync.md Diagram 1](flows-customer-sync.md)
- Claim refresh-on-approval — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 4. To specify

- [ ] Registration form fields (name, company, email, phone)
- [ ] What the **pending** user sees and is blocked from
- [ ] Approval workflow in Maestro (ties to [C-2 Maestro](maestro-usage-spec.md))
- [ ] Who approves and how approval is triggered/notified
- [ ] Linking logic — match to existing RamBase customer/contact
- [ ] Customer deactivation handling
- [ ] Re-approval / role changes

## 5. Open decisions (from customer overview §4.7)

- Who approves new users; how approval is triggered.
- What the pending-approval user sees.
- What happens if a RamBase customer account is deactivated.

## 6. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Registration/approval build | Implement agreed flow | Define approvers & operating process |

## 7. Success criteria

- Users can self-register; approved users gain full B2B access; pending users are correctly restricted.
