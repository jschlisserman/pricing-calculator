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

Fees above are the base (1.0×) price before the headcount multiplier below.

### Headcount multipliers

Enter the customer's company headcount on the order builder. It maps to a band (Startup 1–24, SMB 25–99, Growth 100–249, Venture 250–499, Enterprise 500–999, Enterprise+ 1,000–4,999, Global 5,000–9,999, Global+ 10,000+) and multiplies the plan fee, Compliance, and Premium On-Call. No headcount entered = 1.0×. Agent Learning pool pricing is not multiplied.

| Band | Platform / Self-Hosted | BYO VPC / Private Cloud / Agent Builder | BYOC / Compliance / Premium On-Call / Evals |
| --- | --- | --- | --- |
| Startup | 0.6× | 0.6× | 0.6× |
| SMB | 1.0× | 1.0× | 1.0× |
| Growth | 1.5× | 1.5× | 1.25× |
| Venture | 2.0× | 2.0× | 1.5× |
| Enterprise | 2.5× | 2.5× | 1.75× |
| Enterprise+ | 3.0× | 3.0× | 2.0× |
| Global | 4.0× | 3.5× | 2.25× |
| Global+ | 5.0× | 4.0× | 2.5× |

### Add-ons

- **Agent Learning** — Trace Intelligence pool pricing (all plans; also available without a plan selected): 10k analyzed traces/mo included, then an add-on pool you enter in traces/mo at $10.00/1k through 1M/mo, declining to $5.00/1k at 10M/mo+ (50% volume discount), billed annually (pool × rate × 12)
- **Agent Builder** — fixed $6,000/yr base (all plans), scaled by the headcount multiplier (same curve as BYO VPC / Private Cloud)
- **Compliance** — fixed $5,000/yr base (Enterprise Platform only), scaled by the headcount multiplier
- **Premium on-call support** — fixed $10,000/yr base (Enterprise plans: Enterprise Platform, Enterprise Self-Hosted; also available without a plan selected), scaled by the headcount multiplier

### Programs

Shown below Add-ons, hidden while agency mode is on. Fixed annual fees, not discounted and not multiplied by headcount. They do not count as add-ons for the bundle discount.

- **Mastra Agency Program** — $10,000/yr
- **Design Partner Program** — $12,000/yr

### Platform usage

Enterprise Platform only. Usage packages scale includes from the product total per year, excluding additional usage. Additional volume bills at 50% of list unit cost.

### Bundle discount

When a plan is bundled with any add-on, the plan + add-ons subscription gets **20% off**. Platform usage overage is not discounted. The bundle discount does **not** stack with the agency discount — while agency mode is on, only the 30% agency discount applies.

### Agency mode

Optional toggle on the order builder. Applies **30% off** plan and add-ons. Platform usage overage is not discounted. While agency mode is on, Support / services are hidden.

### Support

Hidden while agency mode is on.

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals is a flat $5,000 one-time payment, scaled by the headcount multiplier (same curve as BYOC / Compliance / Premium On-Call). Integrations / Infrastructure / Custom: price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $500 one-time

No purchase-count or support package discounts.
