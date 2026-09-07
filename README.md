# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging.

## Run

```bash
npm install
npm run dev
```

## Pricing logic

- Catalog prices are Growth-band (25–99) list prices at 1.0x
- Headcount bands: Startup 0.5x · Growth 1.0x · Mid-Market 1.5x · Enterprise 2.0x · Enterprise+ 3.0x · Global 4.0x · Global+ custom with 5.0x floor
- Design Partner Program uses separate DPP bands (Startup $8k at 1.0x → Global+ $100k at 12.5x)
- Agency client pass-through fees are 50% off product headcount bands with a $7.5k minimum on the all-four total
- Volume discount by distinct product purchase count: 2 → 15%, 3 → 20%, 4+ → 25%
- Security and Agent Learning are bundles (one purchase each)
- Deployment and Collaboration SKUs are individual purchases
- Support tiers are mutually exclusive, billed on 3-month (quarterly) terms only — never annualized
- If support is sold with other purchases: volume discount is waived; credit on the quarterly support engagement is 15% with 1 purchase, 20% with 2+
