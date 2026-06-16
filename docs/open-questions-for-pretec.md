# Open Questions for Pretec

**Date:** 2026-06-09
**Purpose:** Questions from Geta that Pretec must answer to unblock design or build decisions.
**How to use:** Answer inline or in a meeting; link back to the relevant sub-spec where noted.

---

## 1. Catalog & Products

**1.1** ✅ Norwegian only in current scope. Other languages are a next-phase concern.

**1.2** ✅ Norway / NOK only in current scope.

**1.3** What search and filtering experience do you expect on listing pages? (e.g. free-text search, filter by category/attribute/inventory, faceted navigation?)

---

## 2. Pricing

**2.1** Does Pretec use quantity-break / tiered pricing (e.g. different unit price per 100/1000 units)?
- If yes: should the storefront display the price tiers on the product page?
- If yes: should the price recalculate live in the UI as the user changes quantity?

**2.2** Are prices always shown ex-VAT on the storefront, or do you need to display both ex-VAT and inc-VAT?

**2.3** What should the storefront show when a live price cannot be fetched (e.g. RamBase is slow)? Options:
- "Price on request" — show a contact prompt instead
- Last-known price with a staleness indicator
- No price displayed, catalog still browsable

---

## 3. Cart & Checkout

**3.1** How long should a cart be saved before it expires?
- Suggested: 7 days for anonymous carts, 30 days for logged-in carts.
- Does this match your expectations?

**3.2** Should the "ask for offer" flow (anonymous users building a cart and submitting a quote request without logging in) be in scope for **Phase 1**, or deferred to a later phase?

**3.3** At checkout, the user selects a delivery address. Will every RamBase customer always have at least one saved address in RamBase? Or is it common for a customer to have no saved addresses (meaning custom address entry is the primary path)?

**3.4** Is the customer reference number (PO/own reference) a **required** field at checkout, or optional?

---

## 4. Quote & Sales Process

**4.1** After a quote is submitted from the storefront, what is the internal process at Pretec?
- Who receives/picks up the quote in RamBase?
- What is the expected response time to the customer?

**4.2** Should the customer receive an email confirmation immediately after submitting a quote? If yes, is the "from" address a shared Pretec sales address, or is it the assigned sales rep?

**4.3** Quotes are not shown in Min side (by design — Min side shows orders and invoices only). Is that correct, or do customers need to track submitted quotes somewhere in the storefront?

---

## 5. Min Side (My Page — Orders & Invoices)

**5.1** Should Min side show **both orders and invoices**, or orders only?

**5.2** Should customers be able to **download PDFs** (order confirmation / invoice) directly from Min side?
*(Note: this depends on RamBase exposing document endpoints — Geta will verify, but we need to know if this is a requirement before committing to it.)*

**5.3** What order/invoice **statuses** are relevant to show in the storefront? Which ones should be filterable? (e.g. Pending, Confirmed, Shipped, Invoiced, Cancelled — please provide Pretec's standard status set if you have one.)

**5.4** What date range should the default view cover? (e.g. last 12 months, or all history?)

**5.5** Multiple users within the same company see the **same shared order/invoice history** — is that correct? Or should each user only see orders they personally placed?

---

## 6. Customer Registration & Approval

**6.1** When a new user self-registers and requests to be linked to a RamBase customer, **who at Pretec approves this**? Is there a specific team or role?

**6.2** How should the approval be triggered / notified? (e.g. email to a Pretec inbox, a task in RamBase, a backoffice action in Maestro?)

**6.3** What should the storefront show to a user who has registered but is **not yet approved**? (e.g. "Your account is pending approval — you can browse products but not see prices or place orders.")

**6.4** Can a RamBase customer account be deactivated or removed? If so, what should happen to storefront users linked to that customer?

---

## 7. Content (Sanity CMS)

**7.1** What content types will Pretec author in Sanity? Please confirm which apply:
- [ ] Editorial landing / campaign pages
- [ ] Category editorial content (banners, descriptions on category pages)
- [ ] Product editorial content (enriched product descriptions, stories)
- [ ] Navigation (menus, mega-menu)
- [ ] Banners / promotions (not pricing — visual/editorial)
- [ ] Other: ___

**7.2** ✅ New Sanity instance, set up from scratch. Content will be migrated manually from the old site by Pretec.

---

## 8. Harmony Sync

**8.1** How frequently should product and category data sync from RamBase? (e.g. every 15 minutes, hourly, nightly?) Is near-real-time sync important, or is a nightly sync acceptable?

**8.2** What should happen if a sync fails? Should Pretec receive an alert? Who should be notified?

**8.3** For the **initial load** (first time the catalog is populated), are there any known data quality concerns in RamBase that Geta should be aware of?

---

## 9. Non-Functional Requirements

**9.1** Are there any performance expectations Pretec has committed to? (e.g. product listing pages load within X seconds, search results within Y seconds?)

**9.2** What is the expected availability requirement? (e.g. 99.9% uptime during business hours, 24/7?)

**9.3** ✅ Three environments only: test, staging, production. Staging doubles as UAT — no separate UAT environment.

**9.4** Are there any data residency or compliance requirements Geta should be aware of? (e.g. GDPR data processor agreement, data stored in Norway/EU only?)

---

## 10. RamBase Access (Action Required to Unblock Build)

**10.1** ✅ RamBase OAuth2 client credentials (client ID + secret) received. Unblocks Price (Task 5) and Quote (Task 7) build slices — RamBase price-lookup and quote-create endpoints can now be verified against the live API.

**10.2** Which **RamBase company/database** (`$db`) should the integration use for test, staging, and production respectively?

---

*Questions answered → update the relevant sub-spec and mark resolved. Questions with a ⚠️ are blocking a build slice.*
