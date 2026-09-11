# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging.

## Run

```bash
npm install
npm run dev
```

## Pricing logic

- Catalog prices are Growth-band (25–99) list prices at 1.0x (Deployment $12k · Security $10k · Agent Learning $14k · Collaboration $12k)
- Headcount bands: Startup 0.5x · Growth 1.0x · Mid-Market 1.75x · Enterprise 2.5x · Enterprise+ 4.0x · Global 6.0x · Global+ custom with 8.0x floor
- Design Partner Program is Startup–Mid-Market only: Startup $8k · Growth $15k · Mid-Market $22k (not offered Enterprise+); selecting DPP shows a usage package calibrated to $15k/year that scales with the DPP fee
- Agency client pass-through fees are 30% off product headcount bands with a $7.5k minimum on the all-four total
- Volume discount by distinct product purchase count: 2 → 15%, 3 → 20%, 4+ → 25%
- Security and Agent Learning are bundles (one purchase each)
- Deployment and Collaboration SKUs are individual purchases
- Support tiers are mutually exclusive, billed on 3-month (quarterly) terms only — never annualized. Startup (1–24) starts at Small $6k / Medium $18k / Large $40k per quarter; prices scale with headcount band from Growth bases ($12k / $36k / $80k)
- Platform sits between Helm ($8k) and BYOC ($12k) at Growth $10k; usage packages (Standard / Observability / Obs+Studio) are calibrated to a $30k/year reference and scale includes with headcount × Platform list
- Selecting Helm Chart or BYOC gates Agent Learning (Platform deployment keeps it available)
- Programs are exclusive: selecting any non-program gates Programs; selecting a Program gates all other options
- If support is sold with other purchases: volume discount is waived; credit on the quarterly support engagement is 15% with 1 purchase, 20% with 2+
