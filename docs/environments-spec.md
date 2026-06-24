# Environments & Deployment Specification

**Date:** 2026-06-24
**Status:** Written
**Audience:** Pretec and Geta
**Scope:** Environment model, upstream-system mapping, deployment, configuration/secrets, and release governance
**Index ref:** [spec-index.md](spec-index.md) → X-2
**Consolidates:** [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md) + [customer-overview §7](customer-overview-spec.md)

---

## 1. Purpose

Define the platform's environment model, how each environment maps to the upstream systems (RamBase,
Struct, Sanity), and how code and configuration are deployed and promoted to production.

There are **three environments only — staging doubles as UAT** (no separate UAT environment).

---

## 2. Environment model & upstream mapping

Each Mosaik environment connects to a specific environment of every upstream system. RamBase and Struct
each have only **test** and **production**, so the Mosaik **test** and **staging** environments both point
at the upstream **test** environments; Sanity has a dedicated **dataset per Mosaik environment**.

| Mosaik env | RamBase | Struct (PIM) | Sanity (CMS) | Secrets |
|---|---|---|---|---|
| **Test** | RamBase **test** | Struct **test** | Sanity **test** dataset | Infisical (test) |
| **Staging / UAT** | RamBase **test** | Struct **test** | Sanity **staging** dataset | Infisical (staging) |
| **Production** | RamBase **production** | Struct **production** | Sanity **production** dataset | Infisical (production) |

**Credential sets required:**
- **RamBase:** two (test, production) — Mosaik test + staging share the test credential.
- **Struct:** two (test, production) — Mosaik test + staging share the test credential.
- **Sanity:** three datasets (test, staging, production), each with its own access token.

All credentials and connection values are stored per environment in **Infisical** (see §4).

### Runtime infrastructure
- **Pretec Service API:** .NET service on **AWS EKS**, in the **Istio** service mesh alongside the other
  Mosaik services; **MongoDB** for service-owned state. (See [Service API §2, §7](superpowers/specs/2026-06-08-pretec-service-api-design.md).)
- Each environment runs an isolated instance of the Service API with its own config/secrets.

---

## 3. Deployment & release process

Code flows through the three environments with a Pretec approval gate before production:

1. **Develop & test** — code is developed and tested in the **test** environment.
2. **Promote to staging** — the tested build is promoted to **staging / UAT**.
3. **Pretec UAT & approval** — **Pretec tests on staging and must approve** before any production deployment.
4. **Production deploy** — the approved build is promoted to **production**.
5. **Production re-test** — a re-test is completed in production **before go-live**.

The same build artifact is promoted across environments (no per-environment rebuild); only configuration
and secrets differ per environment (§4). The concrete CI/CD tooling is a build-phase detail; the **invariant
is the Pretec approval gate on staging and the production re-test before go-live**.

---

## 4. Configuration & secrets

- **Secrets management:** **Infisical**, scoped per environment. RamBase, Struct, and Sanity credentials —
  and any other service secrets — are stored and retrieved per environment from Infisical; secrets are never
  baked into images or committed to the repo.
- **Non-secret configuration:** per-environment configuration (endpoints, dataset names, feature toggles)
  is environment-specific and isolated; production config is never reused in lower environments.
- Rotation policy, access control, and data-residency rules for secrets are owned by
  [X-5 Security & Privacy](security-privacy-spec.md); this spec only fixes the mechanism (Infisical) and the
  per-environment isolation.

---

## 5. Mosaik platform versioning & upgrades

Mosaik (Harmony, the Storefront starterkit, Maestro) is consumed as a **SaaS platform**:

- **Mosaik** ships platform upgrades.
- **Geta** validates each upgrade on **staging**.
- **Pretec** approves promotion of the validated upgrade to **production**.

This mirrors the application release gate in §3 — nothing reaches production without Pretec approval.

---

## 6. Data seeding & refresh

- Mosaik **test** and **staging** connect to RamBase/Struct **test**, so they operate on non-production
  upstream data.
- **Production PII is not copied down** into test or staging environments (data-protection principle; full
  rules owned by [X-5 Security & Privacy](security-privacy-spec.md)).
- Sanity **test** and **staging** datasets hold sample/editorial content for verification; the **production**
  dataset holds live content.

---

## 7. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Environment setup | Set up test / staging / production (Service API, EKS, Istio, MongoDB, Infisical) | Provide environment-specific RamBase/Struct/Sanity details |
| Release & promotion | Build, promote across environments, operate the pipeline | **Test & approve on staging**; sign off before production |
| Mosaik upgrades | Validate on staging | Approve promotion to production |
| Secrets & config | Manage per-environment secrets in Infisical | Provide credentials/values for their systems |

---

## 8. Open items

- **RamBase database / company (`$db`) value per environment** — still to be confirmed by Pretec (carried
  over from [customer-overview §7](customer-overview-spec.md) and [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md)).

---

## 9. Success criteria

- All three environments run and connect to the correct upstream environments per the §2 table, with
  isolated configuration and secrets (Infisical) per environment.
- No build reaches production without **Pretec approval on staging**, and a **production re-test** is
  completed before go-live.
- Mosaik platform upgrades are validated on staging and promoted to production only with Pretec approval.
- No production PII is present in test or staging environments.
