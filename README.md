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

## Pricing logic — fixed annual subscription

### Plans

Each deployment plan is a fixed annual subscription fee. There is no seat-based pricing.

| Plan | Fixed annual fee |
| --- | --- |
| Enterprise (Platform) | $10,000/yr |
| Enterprise Self-Hosted | $15,000/yr |
| BYO VPC | $40,000/yr |
| Private Cloud | $60,000/yr |
| BYOC | $120,000/yr |

### Add-ons

Priced as a percentage of the plan subscription, subject to an annual minimum.

- **Agent Learning** — Trace Intelligence pool pricing (all plans): 10k analyzed traces/mo included, then an add-on pool you enter in traces/mo at $5.00/1k, declining to ~$2.10/1k at 10M/mo, billed annually (pool × rate × 12)
- **Compliance** — fixed $5,000/yr (Enterprise Platform only)
- **Premium on-call support** — fixed $10,000/yr (Enterprise plans: Enterprise Platform, Enterprise Self-Hosted; also available without a plan selected)

### Platform usage

Enterprise Platform only. Usage packages scale includes from the product total per year, excluding additional usage. Additional volume bills at 50% of list unit cost.

### Agency mode

Optional toggle on the order builder. Applies **30% off** plan and add-ons. Platform usage overage is not discounted. While agency mode is on, Support / services are hidden.

### Support

Hidden while agency mode is on.

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals is a flat $5,000 one-time payment. Integrations / Infrastructure / Custom: price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $500 one-time

No purchase-count or support package discounts.
