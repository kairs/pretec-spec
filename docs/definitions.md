# Definitions

## RamBase document types

| Code | Full name |
|------|-----------|
| ART | Product |
| AGR | Product group |
| CRQ | Sales Quote Request |
| CQU | Sales Quote |
| COA | Sales Order |
| CUS | Customer |
| IPA | Item price agreements — see detail below |
| PLI | Price list |

---

## IPA — Item price agreements

An IPA defines a price agreement in RamBase. Multiple dimensions control how a price is resolved for a given sale.

**Applies to (customer scope)**
- A specific customer (CUS)
- A customer group
- All customers

**Applies to (product scope)**
- A specific product (ART)
- A product group (AGR)
- A product classification
- All products

**Discount basis** — the price can be calculated from:
- Sales price
- Cost price
- Fixed gross margin
- Fixed price

**Other rules**
- Rounding rules apply to the calculated price.
- Each agreement has a **valid from** and **valid to** date — agreements are time-bounded.
| SPM | Sales price management |
