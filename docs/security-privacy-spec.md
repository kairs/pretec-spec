# Security & Data Privacy Specification

**Date:** 2026-06-21
**Status:** Stub — to be written
**Audience:** Pretec and Geta
**Scope:** Authentication security, access control, data residency, and PII handling
**Index ref:** [spec-index.md](spec-index.md) → X-5
**Related:** [A-1 Authentication & identity](flows-customer-sync.md), [Service API §3 Auth](superpowers/specs/2026-06-08-pretec-service-api-design.md)

---

## 1. Purpose

Define the cross-cutting security and data-privacy posture of the platform: how identities and tokens are
handled, how access is scoped, where data lives, and how PII is treated.

---

## 2. To specify

### Authentication & tokens
- [ ] Cognito ID-token validation on the Service API (see [Service API §3](superpowers/specs/2026-06-08-pretec-service-api-design.md))
- [ ] User↔RamBase-customer mapping held in Mosaik; resolved server-side (no token claim); no-mapping handling
- [ ] RamBase system/integration credential storage & rotation (per environment)
- [ ] Session / token lifetime policy

### Access control
- [ ] Anonymous vs. logged-in vs. pending-approval boundaries (no price/cart until approved)
- [ ] Company-scoped data access (orders/invoices shared across users in a company)
- [ ] Maestro / backoffice roles

### Data & privacy
- [ ] PII inventory (customer, contact persons) and where it is stored (Cognito, Storefront DB, MongoDB cart)
- [ ] Data residency / hosting region (AWS)
- [ ] Retention (e.g. cart TTL 90 days) and deletion / GDPR rights
- [ ] Logging — ensuring PII is not over-logged (ties to [X-3 Observability](spec-index.md))

## 3. Open decisions

- Data residency / region requirements.
- GDPR / data-subject request handling process.
- What happens to user data when a RamBase customer is deactivated.

## 4. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Security implementation | Build & operate | Define policy & compliance requirements |
| PII / GDPR process | Implement agreed process | Own data controller obligations |

## 5. Success criteria

- Tokens and credentials are validated, scoped, and rotated correctly.
- Access boundaries hold for anonymous / pending / approved users and across companies.
- PII handling meets Pretec's compliance requirements.
