# Authentication & Identity Specification

**Date:** 2026-06-25
**Status:** Complete
**Audience:** Pretec and Geta
**Scope:** Identity, authentication, session management, and RamBase customer resolution
**Index ref:** [spec-index.md](spec-index.md) → A-1
**Consolidates:** [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md) · [flows-customer-sync.md](flows-customer-sync.md)

---

## 1. Purpose

This specification defines how users authenticate, how the storefront establishes identity, and how the RamBase customer is resolved for each authenticated request. The mechanics here underpin every logged-in capability — price, cart, quote, and order history.

---

## 2. Identity provider

**AWS Cognito** is the identity provider. It handles user accounts, authentication, and token issuance for all storefront users.

| Property | Value |
|---|---|
| Provider | AWS Cognito |
| Token validated | **ID token** (not access token) — avoids Cognito Plus tier |
| Custom token claims | **None** — no `rambaseCustomerId` or similar claim injected |
| Pre-Token-Generation Lambda | **Not used** — removed from design |
| Account creation | At invitation acceptance — see [F-7 Registration & approval](registration-approval-spec.md) |
| SSO (AD/ADFS) | Phase 2 — standard Cognito login for Phase 1 |

---

## 3. Authentication flow — Storefront → Pretec Service API

On every request requiring a logged-in user:

1. The Storefront sends the user's **Cognito ID token** in the `Authorization: Bearer` header.
2. The Pretec Service API **validates the ID token** (issuer, audience, signature, expiry).
3. The authenticated subject (Cognito user ID) is extracted from the validated token.
4. The Service API resolves the **RamBase customer** from the Mosaik user↔customer mapping using the subject — see §4.

The frontend never sends the RamBase customer ID. It is always resolved server-side, preventing a client from spoofing another customer's data.

---

## 4. RamBase customer resolution

The Mosaik platform holds the **user↔RamBase-customer mapping** recorded at invitation acceptance. On each authenticated request, the Service API:

1. Calls Mosaik `GET /customers/current` (customer-public API) with the authenticated subject.
2. Receives the RamBase Company ID linked to that user.
3. Uses the RamBase Company ID to scope all downstream RamBase calls (price, orders, quote).

**Key properties:**

| Property | Value |
|---|---|
| Mapping location | Mosaik platform (customer-public API) |
| When recorded | At invitation acceptance |
| Lookup | Per request — live from Mosaik, not cached across requests |
| Immediate effect | A mapping change (e.g. company reassignment) takes effect on the next request — no token-refresh gap |
| Frontend involvement | None — customer ID never sent by the client |

### No-mapping handling

If a valid authenticated user has no RamBase customer mapping in Mosaik (e.g. account created but not yet linked, or mapping removed):

- The Service API returns a clear **"not onboarded"** response — not a 500.
- The Storefront shows an appropriate message directing the user to contact Pretec.
- This state must never grant access to any B2B data.

---

## 5. Service API → RamBase authentication

The Service API authenticates to RamBase with a **single system/integration credential** (not per-user):

| Property | Value |
|---|---|
| Grant type | OAuth2 Client Credentials |
| Token endpoint | `POST /oauth2/access_token` |
| Token format | Bearer, short-lived |
| Company selector | `$db` parameter selects the RamBase company/environment |
| Customer scoping | Passed as a parameter on each call (e.g. `$filter` on customer ID) |

One set of RamBase credentials per environment (test credentials for Mosaik test + staging; production credentials for Mosaik production).

---

## 6. Session management

| Property | Value |
|---|---|
| Session duration | **8 hours** — user must re-authenticate after 8 hours of inactivity |
| Token refresh | Standard Cognito refresh token flow |
| Logout | Cognito session terminated; storefront clears local token state |
| Concurrent sessions | Standard Cognito behaviour (multiple devices allowed) |

---

## 7. Account lifecycle

| Event | Auth effect |
|---|---|
| Invitation accepted | Cognito user created; user↔customer mapping recorded in Mosaik |
| RamBase customer deactivated | Account blocked on next Harmony sync (up to 10 min); login rejected |
| RamBase customer deleted | Account deleted on next Harmony sync; Cognito user removed |
| User removed by org-admin | Cognito user removed; mapping deleted from Mosaik |

See [I-4 Customer sync §5.3](customer-sync-spec.md) for deactivation/deletion sync mechanics.

---

## 8. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Cognito configuration | Set up user pool, token lifetimes, attributes | Provide AWS account/environment details |
| ID token validation | Implement in Pretec Service API | — |
| Customer resolution (Mosaik mapping) | Implement `GET /customers/current` lookup per request | — |
| No-mapping handling | Implement "not onboarded" state in Service API and Storefront | — |
| RamBase system credential | Configure OAuth2 Client Credentials for Service API→RamBase | Provide RamBase credentials per environment |
| Account creation at invitation | Implement Cognito user creation on invitation acceptance | — |
| Session timeout | Configure 8-hour Cognito token lifetime | Confirm 8 hours is acceptable |

---

## 9. Open questions

| Question | Status |
|---|---|
| SSO against Pretec's AD/ADFS | Phase 2 — not in scope for Phase 1 |
| Confirm single system account can read prices for any customer by parameter | To verify during RamBase API integration |

---

## 10. Related specs

- [registration-approval-spec.md](registration-approval-spec.md) — F-7 account creation at invitation acceptance
- [customer-sync-spec.md](customer-sync-spec.md) — I-4 deactivation/deletion sync
- [security-privacy-spec.md](security-privacy-spec.md) — X-5 user roles, token handling, data privacy
- [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md) — technical auth implementation detail
