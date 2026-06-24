# Security & Data Privacy Specification

**Date:** 2026-06-24
**Status:** Written
**Audience:** Pretec and Geta
**Scope:** Authentication security, access control, roles, data residency, PII, consent, retention/deletion
**Index ref:** [spec-index.md](spec-index.md) → X-5
**Related:** [A-1 Authentication & identity](authentication-spec.md), [X-2 Environments](environments-spec.md), [X-3 Observability](observability-spec.md), [Service API §3 Auth](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Define the cross-cutting security and data-privacy posture of the platform: how identities and tokens are
handled, how access is scoped, where data lives, how PII and consent are treated, and how data is retained
and deleted.

---

## 2. Authentication & tokens

- **Identity:** the identity provider establishes who the user is; the Service API **validates the ID token**
  (issuer/audience) on each request (see [A-1](authentication-spec.md), [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md)).
- **Customer resolution:** the user↔RamBase-customer mapping is held in **Mosaik** and resolved
  **server-side** — it is **not** carried as a token claim, so a client cannot spoof another customer. An
  authenticated user with **no mapping** gets a clear **"not onboarded"** state, never a 500.
- **Credentials & secrets:** RamBase, Struct, Sanity, and other service credentials are stored **per
  environment in Infisical** (see [X-2 §4](environments-spec.md)); never baked into images or committed.
  Two RamBase credential sets (test, production) are isolated by environment.
- **Session / token lifetime:** ID/access token **~1 hour**; refresh token **~30 days, sliding**. Once a
  session is idle past the refresh window, the user re-authenticates.

---

## 3. Access control

- **Visitor states:** anonymous → logged-in → approved. **No prices, no cart, no quote** until a user is
  logged in and approved (see [customer-overview](customer-overview-spec.md)). Anonymous users browse the
  catalog only.
- **Company-scoped access:** a user only sees their own company's data; **orders/invoices are shared across
  users of the same company**. The frontend never sends the RamBase customer id — it is resolved from the
  authenticated identity.
- **End-customer roles:** two-tier model — see §4.
- **Maestro / backoffice roles (Pretec staff):** open — to define with [C-2 Maestro usage](maestro-usage-spec.md) (§9).

---

## 4. User roles & permissions

End-customer access uses a **two-tier role model**:

| Role | Capabilities |
|---|---|
| **Standard user** | Standard My Page access — the company's orders, quotes, and documentation. |
| **Org-admin** | All standard-user capabilities, **plus** inviting, managing, and **deleting** the company's standard users (contacts). |

- **No self-promotion.** A standard user cannot elevate their own role, and an **org-admin cannot promote
  any user to org-admin**. Org-admin status is assigned **internally by Pretec in RamBase**; the website
  only **reads** role data and never writes it.
- **Company-scoped** — an org-admin manages/deletes only contacts within their own company. Deleting an
  **org-admin**, or the **company** itself, requires contacting Pretec (actioned in RamBase) — see §8.
- User invitations issued by an org-admin follow the invitation-based onboarding flow (see
  [A-1](authentication-spec.md)); the account is created on invitation acceptance.

---

## 5. Data residency

All PII is hosted in an **EU/EEA AWS region** (e.g. `eu-north-1`, Stockholm) — identity provider,
Storefront database, and the MongoDB cart store all reside within the EU/EEA, consistent with GDPR for a
Norwegian B2B platform.

---

## 6. PII inventory & storage

| Data | Stored in | Notes |
|---|---|---|
| Authentication identity (email, name) | Identity provider (EU/EEA) | Created at invitation acceptance |
| User ↔ RamBase-customer mapping | Mosaik platform | Resolved server-side; no token claim |
| Cart (customer id, line items) | MongoDB (EKS, EU/EEA) | Logged-in only; 90-day sliding TTL; **no payment data** |
| Customer & contact master, orders, invoices | **RamBase** (source of truth) | Read live via the Service API; not stored in the storefront as truth |
| Consents (see §7) | **RamBase Privacy** (synced) | Privacy-policy + marketing consent per contact |
| Editorial content & non-product imagery | Sanity | Minimal/no end-customer PII |

There is **no payment or card data** anywhere in the platform (quote-only; no payments — see scope).

---

## 7. Consent

Two consents are captured **per contact person**:

1. **Privacy policy accepted**
2. **Marketing consent**

Consent records are **synced to RamBase Privacy**, which is the source of truth for consent state.

> **Decision:** consent records are stored in **RamBase Privacy** (final). The SoFa Workbench spec's
> statement that consent data lives in *Maestro* is an **error to be corrected** in the customer spec —
> see [SoFa alignment diff F4](sofa-workbench-alignment-diff.md).

---

## 8. Retention & deletion

- **Cart:** 90-day sliding TTL (see [Service API §5](superpowers/specs/2026-06-08-pretec-service-api-design.md)).
- **Logs:** PII-safe (no identity-linked PII in logs) with ~30-day retention (see [X-3 §6](observability-spec.md)).
- **Account / contact deletion is RamBase-driven:** a contact deleted in RamBase is **deleted in Mosaik**
  via Customer Sync ([I-4](customer-sync-spec.md)). In-app, an **org-admin can delete other contacts**
  (standard users) in their company. Deleting an **org-admin** or the **company** requires the company /
  administrator to **contact Pretec**, who actions it in RamBase; the deletion then propagates to Mosaik.
- On deletion/deactivation the user loses access (login resolves to "not onboarded"), and associated
  storefront state (e.g. cart) is removed.

---

## 9. GDPR data-subject requests & open items

**Data-subject requests (access / erasure):**
- **Pretec is the data controller** — it receives and decides requests.
- **Geta executes** export/erasure across the systems it operates: identity provider, Storefront DB, and
  the MongoDB cart.
- **RamBase-held data** (customer/contact master, orders, invoices, consents) is actioned by **Pretec in
  RamBase**; deletions propagate to Mosaik via sync.

**Open items:**
- **Maestro / backoffice (Pretec staff) roles** — define with [C-2 Maestro usage](maestro-usage-spec.md).

---

## 10. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Security implementation | Build & operate (token validation, scoping, EU/EEA hosting, Infisical secrets) | Define policy & compliance requirements |
| Roles | Enforce two-tier model in the app; read roles from RamBase | Assign org-admin in RamBase |
| Consent | Capture consents, sync to RamBase Privacy | Own consent policy & text |
| PII / GDPR (DSR) | Execute export/erasure in operated systems | Own data-controller obligations; action RamBase data |

---

## 11. Success criteria

- ID tokens are validated; the RamBase customer is resolved server-side; no client can access another
  company's data; a no-mapping user gets a clear "not onboarded" state, never a 500.
- All PII resides in an EU/EEA region; secrets are held per-environment in Infisical; no payment data exists.
- The two-tier role model holds: org-admins manage/delete only their own company's standard contacts, and
  no user (org-admin included) can grant org-admin — that is set by Pretec in RamBase only.
- Consents (privacy + marketing) are captured per contact and synced to RamBase Privacy.
- Deletion is RamBase-driven and propagates to Mosaik; data-subject requests can be fulfilled across all
  operated systems.
