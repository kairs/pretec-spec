# Maestro Backoffice Usage Specification

**Date:** 2026-06-26
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Configuration and operating use of Mosaik Maestro — no custom Maestro development in Phase 1
**Index ref:** [spec-index.md](spec-index.md) → C-2
**Related:** [F-7 Registration & approval](registration-approval-spec.md) · [X-1 Localization](localization-spec.md)

---

## 1. Purpose

Mosaik Maestro is the backoffice for the Pretec storefront. It is **provided as-is by the Mosaik platform** — there is no custom Maestro development in Phase 1. This specification defines which Maestro features are in use, who operates them, and how access is managed.

---

## 2. Maestro features in use

| Feature | Used for | Operator |
|---|---|---|
| **Customer approval** | Review company applications; send invitations to approved customers; resend expired invitations | Pretec Sales |
| **User management** | View storefront users; manage access | Pretec (multiple roles) |
| **Redirects** | Manage URL redirects when product or category URLs change | Pretec (self-service) |
| **Translations** | UI string management | Geta (Phase 1 is Norwegian only — minimal usage) |
| **Service versions** | View and manage deployed service versions | Geta operations |
| **Harmony sync operations** | View sync run status, failures, and logs | Geta operations |

---

## 3. Customer approval workflow

Pretec Sales uses Maestro as the primary interface for the customer onboarding process:

1. **Review application** — incoming company applications appear in Maestro for Sales review.
2. **Fill Sales fields** — before approving, Sales completes: shipment arrangement, shipment partner customer number (if own partner), and CoBuilder membership.
3. **Approve** — triggers company creation in RamBase and generates the invitation.
4. **Send invitation** — Sales sends the invitation email to the contact person from Maestro.
5. **Resend invitation** — if the invitation expires or was not received, Sales resends from Maestro.

For the full onboarding flow see [F-7 Registration & approval](registration-approval-spec.md).

---

## 4. Redirects

Pretec manages URL redirects **self-service in Maestro** — no Geta involvement is required for routine redirect changes.

Redirects are needed when:
- A product URL changes (e.g. after a slug update)
- A category URL changes (e.g. after a category rename or restructure)
- An editorial page URL changes in Sanity

Pretec is responsible for maintaining redirects when product or category URLs are updated. Geta provides training on Maestro redirect management at handover.

---

## 5. Access model

Maestro access is **role-based** within the Mosaik platform. Multiple Pretec roles need access:

| Pretec role | Maestro access needed |
|---|---|
| Sales | Customer approval, invitation sending, user management |
| Marketing / content | Redirects |
| Operations / admin | User management, redirects, general platform visibility |

Geta retains access for service version management, sync operations monitoring, and technical support.

### Access provisioning

- Geta provisions initial Maestro user accounts for Pretec at go-live.
- Pretec nominates the users and their roles before go-live.
- Ongoing user additions or removals are handled by Geta on request (no self-service user provisioning in Phase 1).

---

## 6. Translations

Phase 1 is Norwegian only — the storefront is not localised into additional languages. Maestro's translation feature has minimal use in Phase 1. Geta manages any platform-level string overrides as needed.

If additional languages are added in a future phase, Maestro translations become a Pretec content-team responsibility.

---

## 7. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Maestro configuration | Configure platform features and access roles | Nominate users and roles before go-live |
| Customer approval operations | — | Pretec Sales reviews applications and sends invitations |
| Redirect management | Provide training; support on escalation | Manage redirects self-service |
| User management | Provision/remove accounts on request | Nominate users; request changes |
| Service versions and sync ops | Monitor and manage | — |
| Handover training | Deliver Maestro training before go-live | Attend training; confirm readiness |

---

## 8. Open questions

| Question | Status |
|---|---|
| Full list of Pretec users requiring Maestro access (names and roles) | Confirm with Pretec before go-live |
| Pretec contact for escalating Maestro issues | Confirm with Pretec |

---

## 9. Related specs

- [registration-approval-spec.md](registration-approval-spec.md) — F-7 customer approval workflow detail
- [harmony-sync-spec.md](harmony-sync-spec.md) — C-1 Harmony sync operations (visible in Maestro)
- [localization-spec.md](localization-spec.md) — X-1 Norwegian-only Phase 1 (context for translations)
- [environments-spec.md](environments-spec.md) — X-2 Maestro access per environment
