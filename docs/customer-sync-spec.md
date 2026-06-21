# Customer Sync Specification — RamBase ↔ Mosaik

**Date:** 2026-06-21
**Status:** Stub — consolidation of existing flows
**Audience:** Pretec and Geta
**Scope:** Two-way customer/contact-person sync between RamBase and Mosaik
**Index ref:** [spec-index.md](spec-index.md) → I-4
**Consolidates:** [flows-customer-sync.md](flows-customer-sync.md) (existing flow diagrams) + [Service API §3 Auth](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Promote the existing flow diagrams in [flows-customer-sync.md](flows-customer-sync.md) into a complete
customer-sync specification. Two independent directions exist:

- **RamBase → Mosaik** (Harmony, scheduled) — company master data + existing contact persons. Source-of-truth flow.
- **Mosaik → RamBase** (on approval) — a newly approved storefront user is written back as a contact person.

```text
RamBase Customer/Contacts  --Harmony (scheduled)-->  Storefront User DB
Maestro approval           --direct API call------>  RamBase (new contact person)
```

---

## 2. Already documented (pull in / don't duplicate)

- Signup → approval → sync sequence — [flows-customer-sync.md Diagram 1](flows-customer-sync.md)
- Two-way sync flowchart + direction summary — [flows-customer-sync.md Diagram 2](flows-customer-sync.md)
- Claim injection at token issuance — [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 3. To specify / consolidate

- [ ] Field mapping: RamBase customer/contact → Storefront User DB
- [ ] Sync frequency & delta strategy (ties to [C-1 Harmony](harmony-sync-spec.md))
- [ ] Write-back payload: exact RamBase contact-person fields created on approval
- [ ] Conflict handling — RamBase is source of truth for company data
- [ ] De-duplication — matching a self-registered user to an existing RamBase contact
- [ ] Customer deactivation handling (ties to [F-7](registration-approval-spec.md) / [X-5 Security](security-privacy-spec.md))
- [ ] Error handling & retry

## 4. Open decisions

- What happens if a RamBase customer account is deactivated.
- Whether existing RamBase contacts can self-claim a storefront account.

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Customer Sync config | Configure Harmony + write-back | Provide RamBase access, validate data |
| Approval operation | Implement flow | Approve & link (see [F-7](registration-approval-spec.md)) |

## 6. Success criteria

- RamBase company/contact data appears in the Storefront on schedule.
- Approved users are created as RamBase contact persons on the correct customer.
- Source-of-truth direction holds; failures are visible and retryable.
