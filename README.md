# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging.

## Order submission

Submit order opens a review page (line items + discounts). Confirm emails the order to `josh@mastra.ai`, `aron@mastra.ai`, and `jake@mastra.ai` via Resend.

```bash
cp .env.example .env
# set RESEND_API_KEY=re_...
npm run dev
```

For Netlify, set `RESEND_API_KEY` (and optional `RESEND_FROM`) in site env vars.

## Pricing logic

- Catalog prices are Growth-band (25–99) list prices at 1.0x (Helm $8k · Self-Hosted / Platform no base subscription · BYOC $100k · Security $10k · Agent Learning $14k · Collaboration $12k). BYOC is $100k/year for Startup and Growth, then scales with headcount from Mid-Market up.
- Headcount bands: Startup 0.5x · Growth 1.0x · Mid-Market 2.0x · Enterprise 2.5x · Enterprise+ 4.0x · Global 6.0x · Global+ custom with 8.0x floor
- Design Partner Program is Startup–Mid-Market only: Startup $8k · Growth $15k · Mid-Market $22k (not offered Enterprise+); selecting DPP shows a usage package calibrated to $15k/year that scales with the DPP fee
- Agency client pass-through fees are 30% off product headcount bands, rounded to the nearest $1,000, with a $7.5k minimum on the all-four total
- Volume discount by distinct product purchase count: 2 → 15%, 3 → 20%, 4+ → 25%. Applied evenly to each product line; discounted prices round to the nearest whole dollar. $0 deployment lines do not count.
- Security and Agent Learning are bundles (one purchase each)
- Deployment options (Helm / Self-Hosted / Platform / BYOC) are mutually exclusive — pick one; deselect to change. Self-Hosted and Platform have no base subscription cost — add products/bundles for pricing (gating still applies)
- Security and Controls, Agent Learning, and Collaboration require a Deployment selection first
- Platform has no base fee; usage packages (Standard / Observability / Obs+Studio) are calibrated to a $30k/year reference and scale includes with headcount × a $10k Growth usage-scale reference (not billed). Overage/list unit costs are fixed (do not scale). Purchased additional usage is billed at 50% of that unit cost
- Selecting Helm Chart, Self-Hosted, or BYOC gates Agent Learning (Platform deployment keeps it available)
- Programs are exclusive with Deployment and Concierge (Agency vs Design Partner still mutually exclusive). BYOC is not offered with Agency or Design Partner unless explicit permission is given
- Collaboration SKUs are individual purchases
- **Concierge** replaces Support. It uses a capped labor multiplier (Startup 0.75x · Growth 1.0x · Mid-Market+ 1.5x) distinct from package headcount multipliers
  - **Path 1 (hours):** Small / Medium / Large quarterly; Advisory base or Hands-On (×1.3). One tier at a time. Shows implied $/hr over a 13-week quarter and annualized (×4)
  - **Path 2 (outcome):** Evals / Integrations / Infrastructure. Price = fixed engineer $/hr (default $110) × project hours ÷ (1 − target margin). Choose 30% / 40% / 50% / 60% / 70% margin per package. Multiple packages allowed. Selecting Path 2 auto-selects Mastra Audit (can deselect if audit already done)
  - **Mastra Audit:** one-time flat fee by band ($1k–$5k)
  - Concierge does not count toward or waive package volume discount. Parallel Concierge discount: 15% with 1 package, 20% with 2+, applied evenly to Concierge lines and rounded to the nearest whole dollar
  - Summary keeps Path 1 quarterly totals separate from Path 2 / Audit one-time totals. Margin uses fully loaded engineer $/hr (default $110): Path 1 cost = rate × hours/week × 13; Path 2 cost = rate × project hours (target margin sets list price)
