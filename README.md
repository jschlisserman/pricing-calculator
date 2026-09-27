# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging (Vite / React / TypeScript). Deployed on Netlify (`mastrapricing.ai`).

## Local setup

```bash
cp .env.example .env
# set RESEND_API_KEY=re_...
# optional: RESEND_FROM=Mastra Pricing <orders@mastrapricing.ai>
npm install
npm run dev
```

## Order submission

Submit order opens a review page (line items), then account details. Confirm emails the order to `josh@mastra.ai` and `jake@mastra.ai` via Resend.

For Netlify, set `RESEND_API_KEY` and `RESEND_FROM=Mastra Pricing <orders@mastrapricing.ai>` in site env vars (verified root domain).

## Pricing logic (v5 — seat-based)

### Plans

| Plan | Price | Seats |
| --- | --- | --- |
| Free | $0 | Up to 5 developer seats |
| Teams | $250/month | 5 developer included, then $39/seat/mo · unlimited viewers · builders separate |
| Enterprise (Platform) | $10,000/yr minimum | 10 developer included, then volume-tier $/seat/mo |
| Enterprise Self-Hosted | $12,000/yr minimum | 10 included, then $125-lane tiers |
| BYO VPC | $30,000/yr minimum | 10 included, then $150-lane tiers |
| Private Cloud | $50,000/yr minimum | 10 included, then $150-lane tiers |
| BYOC | $100,000/yr minimum | 25 included, then $150-lane tiers |

Enterprise billed amount is `max(annual minimum, seats × rate × 12)` plus builder seats. Included seats are priced at the same rate as marginal seats.

### Seat types

- **Developer** — plan rate (volume tiers on Enterprise)
- **Builder** — $50/mo flat (Agent Builder only; no CLI/deploy/admin)
- **Viewer** — $0 (read-only)

### Developer volume tiers ($/seat/mo)

| Seats | Platform | Self-Hosted | Isolated |
| --- | --- | --- | --- |
| 1–50 | $100 | $125 | $150 |
| 51–150 | $85 | $105 | $125 |
| 151–400 | $70 | $85 | $105 |
| 401+ | $55 | $65 | $80 |

Self-hosted and isolated rates follow the platform step-down, rounded to the amounts above.

### Add-ons

- **Agent Learning** — 30% of seat contract, $7.5k/yr minimum (Teams + Enterprise)
- **Compliance** — 25% of seat contract, $5k/yr minimum (Enterprise only)
- **Premium on-call** — 20% of seat contract, $15k/yr minimum (Enterprise only)

### Platform usage

Enterprise Platform only. Usage packages scale includes from seat contract. Additional volume bills at 50% of list unit cost.

### Programs

- **Agency Partner** — $10,000/yr program fee (client pass-through unpublished)
- **Design Partner** — $12,000/yr; Platform or Self-Hosted only; up to 25 developer + 25 builder; $250/mo Agent Learning credit; one quarter Small support

### Support

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals / Integrations / Infrastructure / Custom; price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $2,000 one-time

No purchase-count or support package discounts.
