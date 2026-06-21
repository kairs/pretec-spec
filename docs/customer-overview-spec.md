# Pretec Commerce Platform — Customer Overview Specification

**Date:** 2026-06-19  
**Status:** Draft for customer review  
**Audience:** Pretec stakeholders  
**Prepared by:** Geta

---

## 1. Purpose

This document gives Pretec a customer-facing overview of the commerce platform Geta will deliver. It describes the main user-facing capabilities, the systems involved, the agreed scope for Phase 1, and the decisions or inputs still needed from Pretec.

The goal is to make the solution understandable without requiring detailed knowledge of the Mosaik platform, RamBase APIs, or the technical implementation plans.

---

## 2. Phase 1 Scope

Phase 1 delivers a B2B commerce storefront where customers can browse products, log in, see their own prices, maintain a cart, submit quote requests, and view order history.

In scope:

- Product and category browsing
- Anonymous catalog browsing without prices
- Customer onboarding via company application → approval → invitation (a new company is created in RamBase on approval; the user account is created when the invitation is accepted)
- Logged-in B2B price display
- Logged-in cart
- Checkout as quote request, not direct online ordering
- My Page / Min side with order and invoice history, subject to RamBase API support
- Sanity CMS for editorial content
- Harmony sync from RamBase and Struct into the storefront
- Pretec Service API for live price, cart, quote, and order data
- Test, staging/UAT, and production environments

Out of scope for Phase 1:

- Anonymous cart
- Anonymous checkout or "ask for offer"
- Direct confirmed online ordering and payment
- Additional languages beyond Norwegian
- Markets or currencies beyond Norway / NOK
- Custom Maestro backoffice development

---

## 3. User Experience Summary

### Anonymous Visitor

Anonymous visitors can:

- Browse product categories and product pages
- Read editorial content
- See product information and inventory information where available

Anonymous visitors cannot:

- See customer-specific prices
- Add products to a cart
- Check out
- Submit quote requests
- View order or invoice history

### Registered / Approved Customer User

Logged-in users whose company application has been approved and who have accepted their invitation (account created and linked to a RamBase customer) can:

- See their customer-specific B2B prices
- Add products to a cart
- Manage cart line items
- Submit the cart as a quote request
- Select or enter delivery details during checkout
- Add customer reference / PO information and comments
- View relevant order and invoice history in My Page / Min side

### Applicant (Pending Onboarding)

Someone who has submitted a company application but has **not yet accepted an invitation has no user account**. Until the account is created, they browse exactly as an anonymous visitor — catalog and content only, no prices, no cart, no checkout. There is no separate logged-in "pending" state.

---

## 4. Main Capabilities

### 4.1 Catalog & Products

Products and categories originate in RamBase, are enriched in Struct, and are made available in the storefront through Mosaik Harmony.

The storefront will support product browsing and product detail pages. Search and filtering behavior still needs confirmation from Pretec.

### 4.2 Pricing

Prices are customer-specific and come live from RamBase through the Pretec Service API.

Prices are only shown to logged-in, approved users. Anonymous users browse without prices.

Current scope assumes:

- Norway / NOK only
- Prices shown ex-VAT
- No quantity-break or tiered pricing in Phase 1

If RamBase is slow or unavailable, the storefront should degrade gracefully, for example by showing "Price on request" while keeping the catalog usable.

### 4.3 Cart

Cart is available only to logged-in, approved users.

The cart is stored by the Pretec Service API and linked to the authenticated user and their RamBase customer. Prices are not stored as final truth on cart lines; they are fetched live for display.

Suggested cart lifetime is 90 days with sliding expiry, meaning the expiry is refreshed when the cart is read or changed.

### 4.4 Checkout & Quote

Checkout creates a quote request in RamBase. It does not create a confirmed sales order and does not take payment online.

The customer provides:

- Customer reference / PO number
- Delivery address selection or custom delivery address
- Requested delivery date
- Quote comment / message

After submission, Pretec sales follows up from RamBase. The cart is cleared only after a successful quote submission.

### 4.5 My Page / Min Side

My Page gives logged-in, approved users access to order and invoice history from RamBase.

Open items:

- Whether invoices are shown in addition to orders
- Whether credit notes are shown
- Whether PDFs can be downloaded, depending on RamBase API support
- Whether order history is shared across users in the same company or scoped per individual user

### 4.6 Content / CMS

Sanity will be used for editorial content and content assets.

Content types still need confirmation, for example:

- Editorial landing pages
- Category content
- Product editorial content
- Navigation / mega menu
- Banners and campaign content

### 4.7 Customer Registration & Approval

Onboarding is **invitation-based** (see [`sign-up.png`](sign-up.png)):

1. A visitor registers, raising a **company application** (no user account is created yet).
2. Pretec Sales reviews the application and fills in any extra needed information.
3. On approval, the **company is created in RamBase** (via Harmony), which returns the RamBase id.
4. Pretec Sales **invites** the user; the **user account is created only when the invitation is accepted**, already linked to the RamBase company.

Pretec still needs to confirm:

- Who approves applications and who sends invitations
- De-duplication when the company already exists in RamBase
- Invitation expiry / resend rules and whether `phone` is captured at registration
- Adding further users to an already-onboarded company
- What happens if a RamBase customer account is deactivated

See the detailed [Registration & Approval spec](registration-approval-spec.md) and [Customer Sync spec](customer-sync-spec.md).

---

## 5. Systems Involved

| System | Role |
|---|---|
| **RamBase** | Source of truth for customers, products, prices, inventory, orders, invoices, and quotes |
| **Struct** | Product enrichment and product assets |
| **Sanity** | Editorial content and CMS-managed assets |
| **Mosaik Storefront** | Customer-facing web storefront customized for Pretec |
| **Mosaik Harmony** | Sync engine moving product, category, customer, and inventory data into the commerce platform |
| **Mosaik Maestro** | Backoffice for platform operations such as redirects, translations, users, and service versions |
| **AWS Cognito** | User authentication |
| **Pretec Service API** | Geta-built live integration API for prices, cart, quote submission, and order/invoice lookups |

---

## 6. Data Flow Overview

The platform uses two data patterns.

### Synced Data

Synced data is copied ahead of time and used for fast browsing:

- Products and categories: RamBase -> Harmony -> Struct -> Harmony -> Storefront catalog
- Product assets: Struct -> Storefront catalog
- Customer data: RamBase -> Harmony -> Storefront customer data
- Inventory: RamBase -> Harmony -> Storefront catalog
- Content: Sanity -> Storefront

### Live Data

Live data is fetched when the user needs it:

- Prices for the logged-in customer
- Cart state
- Quote submission
- Orders and invoices for My Page

Live data flows through the Pretec Service API, which calls RamBase.

---

## 7. Environments

The agreed environment model is:

- **Test**
- **Staging / UAT**
- **Production**

Staging doubles as UAT. There is no separate UAT environment.

RamBase database / company values for each environment still need confirmation from Pretec.

---

## 8. Key Responsibilities

| Area | Geta | Pretec |
|---|---|---|
| Storefront customization | Builds and configures | Provides brand, requirements, feedback |
| Product and customer data sync | Configures Harmony | Provides RamBase and Struct access, validates data |
| Pretec Service API | Builds and operates | Provides RamBase access and validates business behavior |
| Sanity CMS | Sets up model/integration | Authors and maintains content |
| Customer onboarding (application → approval → invitation) | Implements agreed flow; creates company in RamBase on approval | Defines approvers, reviews applications, sends invitations |
| Quote handling | Sends quote request to RamBase | Handles quote follow-up in RamBase |
| Environments | Sets up test/staging/production | Provides environment-specific RamBase details |

---

## 9. Open Decisions For Pretec

The most important open decisions are:

- Search and filtering behavior on product listings
- What to show when live price lookup fails
- Whether 90-day cart expiry is accepted
- Delivery address rules at checkout
- Whether customer reference / PO number is required
- Who approves company applications and sends invitations (and de-duplication against existing RamBase companies)
- Whether My Page should include invoices, credit notes, and PDF downloads
- Which content types Pretec wants in Sanity
- Harmony sync frequency and error handling expectations
- Expected user volume and any performance/availability requirements
- RamBase database / company value per environment

---

## 10. Success Criteria

Phase 1 is successful when:

- Customers can browse the catalog anonymously
- Approved B2B users can log in and see their own prices
- Approved B2B users can build a cart and submit it as a quote request
- Quote requests are created in RamBase for Pretec sales follow-up
- Users can view relevant order/invoice history in My Page, within confirmed RamBase API limits
- Pretec can manage agreed editorial content in Sanity
- The solution runs in test, staging/UAT, and production with agreed monitoring and support expectations

