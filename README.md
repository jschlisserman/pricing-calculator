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

### Add-ons

- **Trace Intelligence** — (all plans; also available without a plan selected). Progressive per-trace bands: first 10k/mo at $0, then $0.016 → $0.002 through 10M (see calculator table; includes overage rates). When selected with a plan, **+$3,000/yr** is added to that plan (waived when included via Forward). Pool cost = sum of each band × rate × 12.
- **Agent Builder** — fixed $6,000/yr base (all plans), scaled by the headcount multiplier (same curve as BYO VPC / Private Cloud)
- **Mastra Knowledge** — (all plans). **$6,000/KB/yr**; each KB includes **3 sources + 10GB**. Extra sources **$1,000/yr** each. Billable data (above includes) in 100GB blocks: **$2,500** up to 1TB, **$1,500** from 1–10TB, **$750** beyond. Not multiplied by headcount.
- **Compliance** — fixed $5,000/yr base (Enterprise Platform only), scaled by the headcount multiplier
- **Premium on-call support** — fixed $10,000/yr base (Enterprise plans: Enterprise Platform, Enterprise Self-Hosted; also available without a plan selected), scaled by the headcount multiplier

### Mastra Forward

Hidden while agency mode is on. Startup / Growth / Enterprise plans with hours/week chips. Embedded engineering is always an **annual subscription** at **$300/hr** × hours/week × commitment weeks (**13** for a quarterly / 3-month hours commitment, **52** for annual / 12 months — available on Startup, Growth, and Enterprise). **40 hrs/week** is a fixed **$500,000/yr** package (pro-rated for 3-mo). Cost basis $110/hr for margin (commitment weeks × cost, measured against the annual price). Feature picks: Agent Builder / Mastra Knowledge / Trace Intelligence. Trace Intelligence includes **25k traces/mo on Growth** and **50k on Enterprise** (10k when picked on Startup); overage still bills. TI margin uses COGS of **$0.005/trace** analyzed. Platform packages are paused for now. Features included by Forward are not charged again as add-ons. Legacy deployment SKUs and headcount multipliers remain available alongside Forward.

### Programs

Shown below Forward, hidden while agency mode is on. Fixed annual fees are not discounted and not multiplied by headcount. They do not count as add-ons for the bundle discount.

- **Mastra Agency Program** — $10,000/yr
- **Design Partner Program** — $12,000/yr

### Platform usage

Enterprise Platform only. Usage packages scale includes from the product total per year, excluding additional usage. Additional volume bills at 50% of list unit cost.

### Bundle discount

When a plan is bundled with any add-on, the **plan** gets **15% off**. Add-ons and platform usage overage are not discounted. The bundle discount does **not** stack with the agency discount — while agency mode is on, only the 30% agency discount applies.

### Agency mode

Optional toggle on the order builder. Applies **30% off** plan and add-ons. Platform usage overage is not discounted. While agency mode is on, Support / services are hidden.

### Support

Hidden while agency mode is on.

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals is a flat $5,000 one-time payment, scaled by the headcount multiplier (same curve as BYOC / Compliance / Premium On-Call). Integrations / Infrastructure / Custom: price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $500 one-time

No purchase-count or support package discounts.
