# Customer Registration & Approval Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Company application, approval, invitation, and account creation (invitation-based onboarding)
**Index ref:** [spec-index.md](spec-index.md) → F-7
**Consolidates:** [flows-customer-sync.md Diagram 1](flows-customer-sync.md) · [customer-overview §4.7](customer-overview-spec.md)
**Sync mechanics:** [I-4 Customer sync](customer-sync-spec.md) — RamBase company creation and write-back

---

## 1. Purpose

This specification covers the user-facing journey and operating process for onboarding a new B2B company to the Pretec storefront. The platform uses **invitation-based onboarding**: registration raises a company application, the user account is created only when the invitation is accepted. No account exists before acceptance.

The RamBase company creation, sync mechanics, and field mapping are in [I-4 Customer sync](customer-sync-spec.md). This spec covers the experience and process.

---

## 2. Account states

| State | Description |
|---|---|
| **Anonymous** | Browsing catalog only — no account |
| **Application pending** | Company application submitted; no user account yet. Pretec Sales reviews. |
| **Approved / invited** | Application approved, company created in RamBase, invitation sent; account not yet created |
| **Active** | Invitation accepted; account created, user↔RamBase-customer mapping recorded; full B2B access |

There is no "logged-in pending" state. Until the invitation is accepted, the applicant browses as anonymous.

---

## 3. Registration form (new company)

Filled by the applicant on the storefront registration page:

**Company information**

| Field | Required |
|---|---|
| Company name | Yes |
| Organization number | Yes |
| Department | No |
| Website | No |
| Company email | Yes |
| Invoice method (EHF or E-mail invoice) | Yes |

**Contact person**

| Field | Required |
|---|---|
| First / last name | Yes |
| Email | Yes |
| Phone number | Yes |
| Direct phone | No |
| Address | No |
| Postal code | No |
| City | No |

On submit, the org number is checked against existing RamBase companies. If a match is found, the application is **blocked** and the applicant is directed to contact Pretec Sales. See [I-4 §4 De-duplication](customer-sync-spec.md).

---

## 4. Maestro — application review (Pretec Sales)

Pretec Sales receives an email notification when a new application is submitted. In Maestro, Sales reviews the application and fills in three additional fields before approving:

| Field | Values |
|---|---|
| Shipment arrangement | Pretec arranges / Own partner |
| Shipment partner customer number | Free text (when own partner) |
| CoBuilder membership | Yes / No |

On approval:
1. The company is created in Mosaik.
2. Harmony syncs the company to RamBase and receives the RamBase Company ID.
3. The RamBase Company ID is written back to the Mosaik company record.
4. Pretec Sales sends the invitation to the contact person from Maestro.

If RamBase returns an error on company creation, the approval rolls back. Pretec Sales sees the error in Maestro and retries manually. See [I-4 §3.4](customer-sync-spec.md).

---

## 5. Invitation — new company contact person

After approval, Pretec Sales sends the invitation from Maestro.

| Property | Value |
|---|---|
| Sent by | Pretec Sales (from Maestro) |
| Delivery | Email to the contact person's registered email address |
| Expiry | 7 days from send |
| Resend | Available in Maestro — Pretec Sales can resend an expired or pending invitation |

The invitation email contains a unique link. When the contact person clicks the link and completes account setup:

- A Cognito user is created.
- The user↔RamBase-customer mapping is recorded in Mosaik.
- The application is marked completed.
- The user immediately has full B2B access (live prices, cart, quote, order history).

---

## 6. Additional users on an existing company

An **org-admin** user can invite additional users to join their company account. This is the same invitation email flow, but the form the new user fills in contains **contact information only** — no company information is required (the company already exists).

| Step | Description |
|---|---|
| Org-admin sends invitation | From the storefront account management area |
| Invitee receives email | Unique invitation link, valid for 7 days |
| Invitee accepts | Fills in name and contact details; account created and linked to the same RamBase company |
| Resend | Org-admin can resend an expired or pending invitation |

For the two-tier role model (org-admin vs standard user), see [Security & privacy §3](security-privacy-spec.md).

---

## 7. Deactivation

When a RamBase customer account or contact person is deactivated, the change is picked up on the next Harmony sync cycle (up to 10 minutes). After sync:

- The user's storefront account is **blocked** — they cannot log in.
- Active sessions are invalidated on next token validation.

See [I-4 §5.3 Deactivation and deletion](customer-sync-spec.md) for the full sync rules.

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Registration form | Build and validate (including org-number de-duplication check) | Confirm field requirements and wording |
| Maestro application review UI | Configure Maestro approval flow | Review applications and fill in Sales fields |
| Invitation email | Build invitation mechanism and email template | Provide email content and branding |
| Invitation acceptance → account creation | Implement Cognito user creation and Mosaik mapping | — |
| Org-admin invitation flow | Build account management area for additional users | Define who has org-admin rights |
| Resend invitation | Implement resend in Maestro and storefront account management | — |
| Deactivation enforcement | Implement block on next sync after Harmony update | Deactivate/delete in RamBase |

---

## 9. Open questions

| Question | Status |
|---|---|
| Invitation email content and branding | Confirm with Pretec |
| Who in Pretec has org-admin approval rights | Confirm operating process with Pretec |

---

## 10. Related specs

- [flows-customer-sync.md](flows-customer-sync.md) — Sequence diagram (Diagram 1) and flow charts
- [customer-sync-spec.md](customer-sync-spec.md) — I-4 RamBase company creation, sync mechanics, de-duplication
- [authentication-spec.md](authentication-spec.md) — A-1 Cognito identity and user↔customer mapping
- [security-privacy-spec.md](security-privacy-spec.md) — X-5 user roles (org-admin vs standard user)
