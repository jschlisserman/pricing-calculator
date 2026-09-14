# Mastra Pricing Calculator

Internal quote tool for Mastra product packaging.

## Run

```bash
npm install
npm run dev
```

## Pricing logic

- Catalog prices are Growth-band (25–99) list prices at 1.0x (Helm / Self-Hosted $8k · Platform $10k · BYOC $100k · Security $10k · Agent Learning $14k · Collaboration $12k). BYOC is $100k/year for Startup and Growth, then scales with headcount from Mid-Market up.
- Headcount bands: Startup 0.5x · Growth 1.0x · Mid-Market 1.75x · Enterprise 2.5x · Enterprise+ 4.0x · Global 6.0x · Global+ custom with 8.0x floor
- Design Partner Program is Startup–Mid-Market only: Startup $8k · Growth $15k · Mid-Market $22k (not offered Enterprise+); selecting DPP shows a usage package calibrated to $15k/year that scales with the DPP fee
- Agency client pass-through fees are 30% off product headcount bands, rounded to the nearest $1,000, with a $7.5k minimum on the all-four total
- Volume discount by distinct product purchase count: 2 → 15%, 3 → 20%, 4+ → 25%
- Security and Agent Learning are bundles (one purchase each)
- Deployment options (Helm / Self-Hosted / Platform / BYOC) are mutually exclusive — pick one; deselect to change. Self-Hosted matches Helm Chart pricing and scale
- Security and Controls, Agent Learning, and Collaboration require a Deployment selection first
- Platform Growth list is $10k; usage packages (Standard / Observability / Obs+Studio) are calibrated to a $30k/year reference and scale includes with headcount × Platform list. Overage/list unit costs are fixed (do not scale). Purchased additional usage is billed at 50% of that unit cost
- Selecting Helm Chart, Self-Hosted, or BYOC gates Agent Learning (Platform deployment keeps it available)
- Programs are exclusive with Deployment only (Agency vs Design Partner still mutually exclusive). BYOC is not offered with Agency or Design Partner unless explicit permission is given
- Collaboration SKUs are individual purchases
- **Concierge** replaces Support. It uses a capped labor multiplier (Startup 0.75x · Growth 1.0x · Mid-Market+ 1.5x) distinct from package headcount multipliers
  - **Path 1 (hours):** Small / Medium / Large quarterly; Advisory base or Hands-On (×1.3). One tier at a time. Shows implied $/hr over a 13-week quarter and annualized (×4)
  - **Path 2 (outcome):** Evals / Integrations / Infrastructure indicative floors scaled by Concierge multiplier; editable scoped price override. Multiple packages allowed. Selecting Path 2 auto-selects Mastra Audit (can deselect if audit already done)
  - **Mastra Audit:** one-time flat fee by band ($1k–$5k)
  - Concierge does not count toward or waive package volume discount. Parallel Concierge discount: 15% with 1 package, 20% with 2+, applied to Concierge lines only
  - Summary keeps Path 1 quarterly totals separate from Path 2 / Audit one-time totals. Margin uses fully loaded engineer $/hr (default $110): Path 1 cost = rate × hours/week × 13; Path 2 cost = rate × manually entered hours
