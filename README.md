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
| Free | $0 | Unlimited users · bounded usage grant |
| Teams | $250/month | No seats |
| Enterprise (Platform) | $8,000/yr minimum | 5 developer included, $100/seat/mo |
| Enterprise Self-Hosted | $10,000/yr minimum | 5 included, then $125-lane tiers |
| BYO VPC | $30,000/yr minimum | 10 included, then $150-lane tiers |
| Private Cloud | $50,000/yr minimum | 10 included, then $150-lane tiers |
| BYOC | $100,000/yr minimum | 10 included, $200/seat/mo |

Enterprise billed amount is the annual minimum, which includes the plan’s developer seats, plus additional developer seats and builder seats purchased on top.

### Seat types

- **Developer** — Enterprise only. Included seats come with the plan floor; additional seats use the volume tier
- **Builder** — Enterprise only. $50/mo flat (Agent Builder only; no CLI/deploy/admin)
- **Viewer** — Enterprise only. $0 (read-only)

### Developer volume tiers ($/seat/mo)

| Seats | Platform | Self-Hosted | Isolated |
| --- | --- | --- | --- |
| 1–50 | $100 | $125 | $150 |
| 51–150 | $85 | $105 | $125 |
| 151–400 | $70 | $85 | $105 |
| 401+ | $55 | $65 | $80 |

Self-hosted and isolated rates follow the platform step-down, rounded to the amounts above. BYOC developer seats are a flat $200/seat/mo and do not use this ladder.

### Add-ons

- **Agent Learning** — 30% of seat contract, $7.5k/yr minimum (Enterprise only)
- **Compliance** — 25% of seat contract, $5k/yr minimum (Enterprise only)
- **Premium on-call** — 20% of seat contract, $15k/yr minimum (Enterprise only)

### Platform usage

Enterprise Platform only. Usage packages scale includes from the product total per year, excluding additional usage. Additional volume bills at 50% of list unit cost.

### Programs

- **Agency Partner** — $10,000/yr; Platform or Self-Hosted only; includes 10 developer seats and 5 builder seats, then $100/developer seat/mo and $50/builder seat/mo; client pass-through unpublished
- **Design Partner** — $12,000/yr; Platform or Self-Hosted only; includes 10 developer seats and 5 builder seats, then $100/developer seat/mo and $50/builder seat/mo; $250/mo Agent Learning credit; one quarter Small support

### Support

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals / Integrations / Infrastructure / Custom; price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $500 one-time

No purchase-count or support package discounts.
