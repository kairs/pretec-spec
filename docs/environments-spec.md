# Environments & Deployment Specification

**Date:** 2026-06-21
**Status:** Stub — consolidation of Service API §7
**Audience:** Pretec and Geta
**Scope:** Environment model, RamBase mapping, and deployment
**Index ref:** [spec-index.md](spec-index.md) → X-2
**Consolidates:** [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md) + [customer-overview §7](customer-overview-spec.md)

---

## 1. Purpose

Promote the environment model into a platform-wide spec. Three environments only — staging doubles as UAT.

| Mosaik env | Connects to RamBase | Notes |
|---|---|---|
| **Test** | RamBase **test** | |
| **Staging / UAT** | RamBase **test** | Staging doubles as UAT — no separate UAT env |
| **Production** | RamBase **production** | |

Two sets of RamBase credentials are needed (one per RamBase environment).

---

## 2. Already documented (pull in / don't duplicate)

- Environment ↔ RamBase mapping & credentials — [Service API §7](superpowers/specs/2026-06-08-pretec-service-api-design.md)
- Runtime: .NET on AWS EKS, Istio mesh, MongoDB — [Service API §2, §7](superpowers/specs/2026-06-08-pretec-service-api-design.md)

## 3. To specify / consolidate

- [ ] RamBase `$db` / company value per environment (open — needs Pretec)
- [ ] Deployment pipeline / promotion across test → staging → production
- [ ] Config & secrets management per environment (ties to [X-5 Security](security-privacy-spec.md))
- [ ] Mosaik platform versioning/upgrade responsibility
- [ ] Data seeding / refresh for test/staging
- [ ] Sanity & Struct environment mapping (dataset/workspace per env)

## 4. Open decisions

- RamBase database / company values per environment (from [customer-overview §7](customer-overview-spec.md)).
- Mosaik versioning/upgrade ownership (from [overview §7](superpowers/specs/2026-06-08-pretec-commerce-overview-design.md)).

## 5. Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Environments | Set up test/staging/production | Provide env-specific RamBase details |

## 6. Success criteria

- All three environments run and connect to the correct RamBase environment with isolated config/secrets.
