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

Submit order opens a review page (line items + discounts), then account details. Confirm emails the order to `josh@mastra.ai` and `jake@mastra.ai` via Resend.

For Netlify, set `RESEND_API_KEY` and `RESEND_FROM=Mastra Pricing <orders@mastrapricing.ai>` in site env vars (verified root domain).

## Pricing logic

### Catalog (Growth 1.0× list)

- Helm Chart $8k/year
- Self-Hosted / Platform — no base subscription (add products/bundles for pricing)
- Private Cloud $20k/year (**Future**)
- BYOVPC $40k at Growth list (**Future**; Mid-Market+ only)
- BYOC $120k/year at Mid-Market (**Future**; Mid-Market+ only; scales with band multiplier above Mid-Market)
- Security and Controls $10k · Agent Learning $14k · Agent Builder $12k
- Agency Program $10k · Design Partner Program $8k (DPP uses its own Startup–Mid-Market fee table)

### Headcount bands

| Band | Headcount | Multiplier |
| --- | --- | --- |
| Startup | 1–24 | 0.5× |
| Growth | 25–99 | 1.0× |
| Mid-Market | 100–499 | 2.0× |
| Enterprise | 500–1,999 | 3.0× |
| Enterprise+ | 2,000–4,999 | 4.0× |
| Global | 5,000–9,999 | 6.0× |
| Global+ | 10,000+ | 8.0× floor; **+0.25× per additional 1,000** employees |

### Eligibility & gating

- **BYOC / BYOVPC:** Mid-Market and above (100+ employees) only
- **Design Partner Program:** Startup–Mid-Market only (1–499): Startup $8k · Growth $15k · Mid-Market $22k
- Deployment options are mutually exclusive: Helm · Self-Hosted · Platform · Private Cloud · BYOVPC · BYOC
- Security and Controls, Agent Learning, and Collaboration require a Deployment selection first
- Selecting Helm, Self-Hosted, or BYOC gates Agent Learning (Platform keeps it available)
- Programs are exclusive with Deployment and Concierge (Agency vs Design Partner still mutually exclusive). BYOC with Agency / DPP still needs explicit permission in the UI gates

### Volume discount

By distinct product purchase count (\$0 deployment lines do not count): **2 → 15% · 3 → 20% · 4+ → 25%**. Applied evenly per product line; discounted prices round to the nearest whole dollar.

### Platform & DPP usage

- Platform has no base fee. Usage packages (Standard / Observability / Obs+Studio) are calibrated to a **\$30k/year** reference include table.
- DPP usage includes are calibrated to a **\$15k/year** reference.
- Include volumes for both **scale from Total (selected products)** (product total after volume discount), not headcount.
- Scaled quantities **round up** to the next **1 / 2 / 2.5 / 3 / 4 / 5 / 7.5 × 10ⁿ** figure.
- Package include amounts are monthly; margin annualizes ×12. Overage/list unit costs are fixed. Additional usage bills at **50%** of unit cost.

### Agency pass-through

Client pass-through fees are **30% off** product headcount bands, rounded to the nearest \$1,000, with a **\$7.5k** minimum on the all-four total. BYOVPC shows as unavailable below Mid-Market.

### Concierge

Replaces Support. Uses a capped labor multiplier (Startup 0.75× · Growth 1.0× · Mid-Market+ 1.5×), distinct from package headcount multipliers.

- **Path 1 (hours):** Small / Medium / Large quarterly; Advisory base or Hands-On (×1.3). One tier at a time. Implied \$/hr over a 13-week quarter; annualized ×4.
- **Path 2 (outcome):** Evals / Integrations / Infrastructure. Price = engineer \$/hr (default \$110) × project hours ÷ (1 − target margin). Margins 30% / 40% / 50% / 60% / 70% per package. Selecting Path 2 auto-selects Mastra Audit (can deselect).
- **Mastra Audit:** one-time flat fee by band (\$1k–\$5k).
- Concierge does not count toward or waive package volume discount. Parallel Concierge discount: **15%** with 1 package, **20%** with 2+, applied evenly and rounded to whole dollars.
- Summary keeps Path 1 quarterly totals separate from Path 2 / Audit one-time totals.
