# Customer Sync Specification — RamBase ↔ Mosaik

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing flows
**Audience:** Pretec and Geta
**Scope:** Two-way customer/contact-person sync between RamBase and Mosaik
**Index ref:** [spec-index.md](spec-index.md) → I-4
**Consolidates:** [flows-customer-sync.md](flows-customer-sync.md) (existing flow diagrams) + [Service API §3 Auth](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Promote the existing flow diagrams in [flows-customer-sync.md](flows-customer-sync.md) (authoritative:
[`sign-up.png`](sign-up.png)) into a complete customer-sync specification. Two independent directions exist:

- **RamBase → Mosaik** (Harmony, scheduled) — **existing** company master data + contact persons. Source-of-truth flow.
- **Mosaik → RamBase** (on company-application approval) — a **new company is created in RamBase** (via Harmony), which returns the RamBase unique id linked to the account.

```text
RamBase Customer/Contacts  --Harmony (scheduled)----->  Storefront User DB   (existing companies)
Maestro approval           --Create Customer (Harmony)->  RamBase (new company) --returns id--> account
```

---

## 2. Already documented (pull in / don't duplicate)

- Signup → approval → sync sequence — [flows-customer-sync.md Diagram 1](flows-customer-sync.md)
- Two-way sync flowchart + direction summary — [flows-customer-sync.md Diagram 2](flows-customer-sync.md)
- RamBase customer resolved from the Mosaik mapping (no token claim) — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md) / [authentication-spec.md](authentication-spec.md)

## 3. To specify / consolidate

- [ ] Field mapping: RamBase customer/contact → Storefront User DB (inbound)
- [ ] **Create-company payload**: exact RamBase customer fields set when a new company is created on approval (incl. the "extra needed information" Pretec Sales fills in)
- [ ] How the returned **RamBase unique id** is stored and linked to the account
- [ ] Sync frequency & delta strategy for the inbound sync (ties to [C-1 Harmony](harmony-sync-spec.md))
- [ ] Whether the approving user also becomes a RamBase **contact person** on the new company
- [ ] De-duplication — application names an existing RamBase company vs. genuinely new (avoid duplicate companies)
- [ ] Conflict handling — RamBase is source of truth for existing company data
- [ ] Customer deactivation handling (ties to [F-7](registration-approval-spec.md) / [X-5 Security](security-privacy-spec.md))
- [ ] Error handling & retry (esp. create-company failure mid-approval)

## 4. Open decisions

- **De-duplication rule** when an application's company already exists in RamBase — link vs. create new.
- Whether company creation truly runs **through Harmony** (per diagram) vs. a direct API call — confirm with the platform team.
- What happens if a RamBase customer account is deactivated.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Customer Sync config | Configure Harmony + write-back | Provide RamBase access, validate data |
| Approval operation | Implement flow | Approve & link (see [F-7](registration-approval-spec.md)) |

## 6. Success criteria

- Existing RamBase company/contact data appears in the Storefront on schedule.
- Approving a new company application creates the company in RamBase and links the returned id to the account.
- De-duplication prevents duplicate companies; failures are visible and retryable.
