# Customer Questions — Pretec Commerce Platform

> **For:** Pretec
> **From:** Geta
> **Date:** 2026-06-11
> **Purpose:** Collect answers needed to unblock design decisions and the build phase of the Pretec Service API and broader platform.

---

## 1. RamBase access & API credentials

These items block the Price and Quote build slices entirely. All other items can wait.

**Q1.1 — API credentials**
Can Pretec provide RamBase API client credentials (OAuth2 Client-Credentials: client id + secret) for the Geta integration account? The credentials should be scoped to at minimum: Sales Orders, Sales Customers, Product/Price, Sales Quote (CQU/CRQ), Sales Invoice (CIN), and any document/output resources.

**Q1.2 — RamBase environments**
Which RamBase environments exist (test, staging, production)? Are separate integration credentials needed per environment, or is one set sufficient for all?

---

## 2. Pricing

**Q2.1 — Customer-specific price endpoint**
Does RamBase expose a way to look up the net price for `(product, customer, quantity)` *without* creating a quote or order? (This is what the storefront needs to display prices on listing and product pages.) If not, are you aware of a workaround RamBase recommends for price display?

**Q2.2 — "Price on request" degraded state**

If RamBase is slow or unavailable, the storefront will show "price on request" instead of a number. Is this acceptable messaging to show end users? Do you have a preferred label or copy?

---

## 3. Cart

**Q3.1 — Cart retention / TTL**
How long should an abandoned (logged-in) cart persist before it is automatically cleaned up? Proposed: **30 days** after last activity — OK?

---

## 4. Checkout & quote

**Q4.1 — Post-submission email**
After a quote is submitted, the customer receives a confirmation email. Who sends this email — the Mosaik platform, or should it come from a Pretec email address? What should the email contain?

---

## 5. Min side (My Page — orders & invoices)

**Q5.1 — Invoices scope**
Should Min side show **invoices** in addition to orders? If yes, should credit notes also appear?

**Q5.2 — Document / PDF downloads**
Should users be able to **download a PDF** of their order confirmation or invoice directly from Min side? (This depends on whether RamBase exposes PDFs via its API — currently unconfirmed.)

**Q5.3 — Multi-user company view**
Multiple users from the same company will see the same order/invoice history (shared company view). Is this the intended behavior, or should order history be scoped per individual user?

**Q5.4 — Order status labels**
RamBase orders carry a numeric status code. What status labels should the storefront display, and which statuses are relevant to show (e.g. open, confirmed, shipped, invoiced)?

---

## 6. Authentication & user provisioning

**Q6.1 — Token lifetime**
The architecture injects a RamBase customer ID claim into the Cognito ID token at login. A user linked/approved *after* logging in will only receive the claim on their next token refresh. The proposed mitigations are:
- Force a token refresh when a user account is approved.
- Use a short ID-token lifetime (e.g. 15 minutes).

Is there a preference, or any constraint on token lifetime from Pretec's side?

**Q6.2 — Self-registration approval flow**
When a new user self-registers on the storefront, they go through a linking/approval flow to be connected to a RamBase customer. Who approves the link — a Pretec admin, a Geta admin, or is it automatic? What system or interface is used for the approval step?

---

## 7. Non-functional & infrastructure

**Q7.1 — Expected user volume**
What is the expected number of concurrent logged-in users and peak traffic periods (e.g. morning rush, campaign launches)? This informs RamBase call volume and whether price caching needs to be introduced at launch.

**Q7.2 — RamBase rate limits**
Are there known RamBase API rate limits or call quotas for your integration account? Listing pages will batch price lookups on every page load.

**Q7.3 — Environments**
The plan is to build and test on: **test → staging → production**. Can you confirm these environment names, and whether RamBase test/staging databases already exist and are seeded with representative data?

---

## 8. Broader platform (to be resolved per sub-spec)

The following are open questions that will be addressed in the individual capability sub-specs. Listing them here for awareness.

**Q8.1 — Harmony sync**
- Sync mechanism preference: event-driven or scheduled polling?
- How frequently should product/inventory/customer data be re-synced from RamBase?
- What is the expected initial data volume (number of products, customers)?

**Q8.2 — Content / Sanity CMS**
- Which content types will Pretec author in Sanity (editorial pages, product editorial overlays, navigation, banners, etc.)?
- Who on the Pretec side will manage CMS content? Will they need training/onboarding?

**Q8.3 — Maestro backoffice**
- Who at Pretec will use Maestro (redirects, translations, user management)? Is a Geta-side admin also needed?

**Q8.4 — Catalog & search**
- Are there multiple languages or markets in scope for launch?
- Are there multiple currencies?
- Should catalog search be enabled at launch, and what search behavior is expected (full-text, faceted filtering)?

**Q8.5 — Maestro / platform upgrade responsibility**
- As the Mosaik SaaS platform releases new versions, is Pretec responsible for approving upgrades, or does Geta apply them automatically?
