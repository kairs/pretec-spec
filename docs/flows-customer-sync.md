# Customer Sync Flows

---

## Diagram 1 — B2B Signup in Mosaik → Approval → Sync to RamBase

A new B2B user self-registers on the Mosaik Storefront. Pretec reviews and approves the registration in Maestro. On approval the user is linked to a RamBase customer and a contact person is created in RamBase.

```mermaid
sequenceDiagram
    actor User as B2B User
    participant SF as Mosaik Storefront
    participant Cognito as AWS Cognito
    participant DB as Storefront DB
    participant Maestro as Maestro (Backoffice)
    participant Pretec as Pretec Sales
    participant RB as RamBase

    User->>SF: Register (name, company, email, phone)
    SF->>Cognito: Create Cognito user
    Cognito-->>SF: Account created
    SF->>DB: Save user — status: pending_approval
    SF->>Pretec: Notify — new registration request

    Note over User,SF: User can browse catalog. No prices, no cart until approved.

    Pretec->>Maestro: Review registration request
    Pretec->>Maestro: Approve & select RamBase customer to link

    Maestro->>DB: Update user — status: approved + rambaseCustomerId
    Maestro->>RB: Create contact person on the customer
    Maestro->>Cognito: Set custom:rambaseCustomerId claim on the user

    User->>SF: Next login or token refresh
    Cognito->>Cognito: Pre-Token-Generation Lambda injects rambaseCustomerId into ID token
    SF-->>User: Full B2B access — live prices, cart, quote, order history
```

---

## Diagram 2 — Two-way Sync: Customers & Contact Persons between RamBase and Mosaik

Two independent directions of sync:

- **RamBase → Mosaik** via Harmony: company master data and existing contact persons are synced on schedule. This is the source-of-truth flow — RamBase owns the customer record.
- **Mosaik → RamBase** on approval: when a new storefront user is approved in Maestro, they are written back to RamBase as a new contact person on the linked customer.

```mermaid
flowchart LR
    subgraph RB["RamBase (ERP — source of truth)"]
        rb_cust["Customer / Company"]
        rb_contact["Contact Persons"]
    end

    subgraph H["Mosaik Harmony"]
        h_sync["Customer Sync\n(scheduled)"]
    end

    subgraph MP["Mosaik Platform"]
        maestro["Maestro\nBackoffice"]
        sf_db["Storefront User DB"]
    end

    subgraph AWS["AWS Cognito"]
        cognito["User Pool\ncustom:rambaseCustomerId"]
    end

    %% ── Direction 1: RamBase → Mosaik (Harmony sync) ──────────────────
    rb_cust -->|"company master data"| h_sync
    rb_contact -->|"existing contacts"| h_sync
    h_sync -->|"upsert customer users"| sf_db

    %% ── Direction 2: Mosaik → RamBase (on approval) ───────────────────
    maestro -->|"approve + link to customer"| sf_db
    maestro -->|"create new contact person"| rb_contact
    sf_db -.->|"trigger claim update"| cognito
```

### Sync direction summary

| Direction | Trigger | Mechanism | What moves |
|---|---|---|---|
| RamBase → Mosaik | Scheduled (Harmony) | Mosaik Harmony Customer Sync | Company master data, existing contact persons |
| Mosaik → RamBase | User approved in Maestro | Direct API call (Maestro → RamBase) | New contact person created on the linked customer |

The dotted line from Storefront DB to Cognito indicates that `custom:rambaseCustomerId` is resolved at **token issuance** (Pre-Token-Generation Lambda), not written directly into Cognito by the sync — the claim is injected from the stored `rambaseCustomerId` on each login and refresh.
