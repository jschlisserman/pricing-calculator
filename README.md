# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging.

## Run

```bash
npm install
npm run dev
```

## Pricing logic

- Catalog prices are SMB list prices
- **100+ employees:** +50% on totals
- **Above 500 employees:** +100% on totals
- Volume discount by distinct product purchase count: 2 → 15%, 3 → 20%, 4+ → 25%
- Security and Agent Learning are bundles (one purchase each)
- Deployment and Collaboration SKUs are individual purchases
- Support tiers are mutually exclusive, billed on 3-month (quarterly) terms only — never annualized
- If support is sold with other purchases: volume discount is waived; credit on the quarterly support engagement is 15% with 1 purchase, 20% with 2+
