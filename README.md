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

Enter the customer's company headcount on the order builder. It maps to a band (Startup 1–24, SMB 25–99, Growth 100–249, Venture 250–499, Enterprise 500–999, Enterprise+ 1,000–4,999, Global 5,000–9,999, Global+ 10,000+) and multiplies the plan fee, Compliance, and Premium On-Call. No headcount entered = 1.0×. Trace Intelligence pool pricing is not multiplied.

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

### Order builder sections

Tabs: **Software**, **Services**, **Software + Services**. All options are annual contracts.

### Software — Enterprise Add-ons

- **Compliance** — fixed $5,000/yr base (Enterprise Platform only), scaled by the headcount multiplier
- **Agent Learning** — Coming Soon (formerly Trace Intelligence)
- **Knowledge** — Coming Soon
- **Factory** — Coming Soon (formerly Agent Builder)

### Software + Services

**Mastra Startup** (2 or 4 hrs/wk, pick 1 of 3 features), **Mastra Growth** (6 or 8 hrs/wk, pick 2 of 3), **Mastra Enterprise** (10 / 12 / 15 / 20 / 40 hrs/wk, all 3 features). Embedded engineering is an **annual** subscription at **$300/hr** × hours/week × 52 (**40 hrs/week** = fixed **$500,000/yr**). Features: Factory / Knowledge / Agent Learning. Agent Learning includes **25k traces/mo on Growth** and **50k on Enterprise** (10k when picked on Startup).

### Platform usage

Enterprise Platform only. Usage packages scale includes from the product total per year, excluding additional usage. Additional volume bills at 50% of list unit cost.

### Bundle discount

When a plan is bundled with any add-on, the **plan** gets **15% off**. Add-ons and platform usage overage are not discounted.

### Services

Annual contracts:

- **Support Small / Medium / Large** — $32k / $86k / $250k per year (2 / 6 / 20 hrs/wk)
- **Custom** — price = engineer $/hr × hours ÷ (1 − margin)
