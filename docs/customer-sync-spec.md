# Customer Sync Specification — RamBase ↔ Mosaik

**Date:** 2026-06-24
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Two-way customer/contact-person sync between RamBase and Mosaik
**Index ref:** [spec-index.md](spec-index.md) → I-4
**Consolidates:** [flows-customer-sync.md](flows-customer-sync.md) · [Service API §3 Auth](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Two independent sync directions exist between RamBase and Mosaik:

- **RamBase → Mosaik** (Harmony, scheduled every 10 min) — existing company master data and contact persons. RamBase is source of truth.
- **Mosaik → RamBase** (on company-application approval) — a new company is created in Mosaik, Harmony syncs it to RamBase, and the returned RamBase Company ID is written back to Mosaik.

```text
RamBase  --Harmony (Δ every 10 min, RamBase source of truth)-->  Mosaik (existing companies)
Mosaik   --Harmony (on approval, no RamBase ID yet)------------>  RamBase (new company)
RamBase  --returns RamBase Company ID-------------------------->  Mosaik (stored on company record)
```

---

## 2. Flow diagrams

See [flows-customer-sync.md](flows-customer-sync.md):

- **Diagram 1** — B2B Signup → Company Application → Approval → User Invitation (sequence)
- **Diagram 2** — Two-way sync flowchart + direction summary

---

## 3. New company onboarding (Mosaik → RamBase)

### 3.1 Registration form (filled by the applicant)

| Field | Level |
|---|---|
| Company name | Company |
| Organization number | Company |
| Department | Company |
| Website | Company |
| Company email | Company |
| Invoice method (EHF or E-mail invoice) | Company |
| Contact person — first/last name | Contact person |
| Contact person — email | Contact person |
| Contact person — phone number | Contact person |
| Contact person — direct phone | Contact person |
| Contact person — address | Contact person |
| Contact person — postal code | Contact person |
| Contact person — city | Contact person |

### 3.2 Fields added by Pretec Sales in Maestro (before approval)

| Field | Values |
|---|---|
| Shipment arrangement | Pretec arranges / Own partner |
| Shipment partner customer number | Free text (when own partner) |
| CoBuilder membership | Yes / No |

### 3.3 Approval flow

1. Sales reviews the application in Maestro, fills in the three Sales fields, and approves.
2. Maestro creates the company in Mosaik.
3. Harmony picks up companies without a RamBase Company ID on its next sync cycle, creates the company in RamBase, and receives the RamBase Company ID.
4. Harmony writes the RamBase Company ID back to the company record in Mosaik.
5. The registering user's contact details are written to RamBase as a **contact person** on the new company.
6. Subsequent syncs use the RamBase Company ID to **update** the company (not create a duplicate).

### 3.4 Error handling on approval

If RamBase returns an error during company creation:

- The approval **rolls back** — no company is created in Mosaik or RamBase.
- Pretec Sales sees the error in Maestro and must **retry the approval manually**.

---

## 4. De-duplication

When an applicant submits a company registration, the org number is checked against existing RamBase companies before the application is accepted.

| Condition | Result |
|---|---|
| Org number **matches** an existing RamBase company | Application is **blocked** — applicant is directed to contact Pretec Sales |
| Org number has **no match** | Application proceeds normally |

The match key is **organization number** (Norwegian org nr) — name matching is not used.

---

## 5. Inbound sync — RamBase → Mosaik

### 5.1 Mechanism

| Property | Value |
|---|---|
| Trigger | Scheduled — every **10 minutes** |
| Strategy | **Delta** — only records changed since the last run |
| Change detection | RamBase **last-modified timestamp** |
| Lookup key | **RamBase Company ID** (stored on Mosaik company record) |
| Conflict rule | **RamBase is source of truth** — RamBase data overwrites Mosaik on update |

> **Requirement:** RamBase must expose a filterable last-modified timestamp on customer and contact-person records. This is a stated integration requirement.

### 5.2 What moves

| RamBase entity | Synced to Mosaik |
|---|---|
| Customer / Company | Company record (master data) |
| Contact Persons | Contact person records linked to company |

### 5.3 Deactivation and deletion

| RamBase state | Mosaik result |
|---|---|
| Company / contact **deactivated** | Account **blocked** — user cannot log in |
| Company / contact **deleted** | Account **deleted** from Mosaik |

---

## 6. Field mapping — RamBase customer → Mosaik company

| RamBase field | Mosaik target | Notes |
|---|---|---|
| Company name | Company name | |
| Organization number | Org number | De-duplication key |
| Department | Department | |
| Website | Website | |
| Company email | Company email | |
| Invoice method | Invoice method | EHF or E-mail invoice |
| Shipment arrangement | Shipment arrangement | Set by Sales on new company; synced back thereafter |
| Shipment partner customer number | Shipment partner customer number | When own partner |
| CoBuilder membership | CoBuilder membership | Yes / No |
| Contact person name | Contact person name | |
| Contact person email | Contact person email | |
| Contact person phone | Contact person phone | |
| Contact person direct phone | Contact person direct phone | |
| Contact person address | Contact person address | |
| Contact person postal code | Contact person postal code | |
| Contact person city | Contact person city | |

---

## 7. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Harmony inbound sync config | Configure frequency, delta, field mapping | Provide RamBase access; confirm last-modified timestamp support |
| New company creation flow | Implement Maestro approval → Mosaik create → Harmony sync → RamBase ID write-back | Approve applications; fill in Sales fields |
| De-duplication check | Implement org-number check on registration | — |
| Error visibility | Surface RamBase create errors in Maestro | Retry failed approvals |

---

## 8. Open questions

None outstanding. Resolved decisions:

| Question | Resolution |
|---|---|
| De-duplication rule | Block on org number match — applicant directed to contact Sales |
| Company creation mechanism | Created in Mosaik first; Harmony syncs to RamBase and writes back the RamBase Company ID |
| RamBase source of truth | Yes — RamBase overwrites Mosaik on inbound sync for all fields |
| Deactivation vs. deletion | Deactivated → blocked; deleted → deleted |
| Error on approval | Rolls back; Sales retries manually |

---

## 9. Related specs

- [flows-customer-sync.md](flows-customer-sync.md) — sequence and flowchart diagrams
- [registration-approval-spec.md](registration-approval-spec.md) — F-7 storefront UX for registration and approval
- [authentication-spec.md](authentication-spec.md) — A-1 Cognito identity, user↔RamBase-customer mapping
- [harmony-sync-spec.md](harmony-sync-spec.md) — C-1 Harmony engine config (frequency, error handling, initial vs delta)
- [security-privacy-spec.md](security-privacy-spec.md) — X-5 data residency, PII handling
