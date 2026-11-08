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

## Authentication (WorkOS AuthKit)

Sign-in uses WorkOS AuthKit (same provider as projects.mastra.ai). Netlify Edge Functions gate every request, so people without access never receive the app or its pricing data.

| Who | Rule | Role |
| --- | --- | --- |
| Mastra | verified email on `INTERNAL_DOMAINS` (default `mastra.ai`) | `internal` |
| Agencies | approved in the **Access** tab (person or whole domain), or listed in `AGENCY_EMAILS` / `AGENCY_DOMAINS` | `agency` (agency app, see below) |
| Everyone else | — | "Request access" form |

### Agency access requests

1. Someone signs in with an email that has no access. They see a **Request access** form. Their email comes from their verified sign-in and can't be edited.
2. On submit, the request is saved and an email goes to `ACCESS_REQUEST_RECIPIENTS`, with a link to `/#access`.
3. Any `@mastra.ai` user opens the **Access** tab and clicks **Approve person**, **Approve all @domain** or **Deny**. Domain approval is blocked for public providers like gmail.com. Sales can also add people or domains directly.
4. Approved people get an email and sign in again, this time with agency access. **Remove** takes effect within about 30 seconds.

Requests and approvals are stored in Netlify Blobs (store `access`). No database or redeploy is needed. Locally they live in `.netlify/blobs-serve`. In React, `useSession()` (`src/session.tsx`) returns `{ email, name, role }`.

How it works:

- `netlify/edge-functions/auth.ts` handles `/auth/login`, `/auth/callback`, `/auth/logout`, `/auth/me` and `/auth/signed-out`.
- `netlify/edge-functions/gate.ts` blocks everything else unless the request has a valid session.
- Sessions are an HttpOnly cookie, signed with `SESSION_SECRET`, that lasts 12h.

### Two apps: internal and agency

One codebase builds two apps (`vite.config.ts` has two entries):

- **Internal** (`index.html` → `src/main.tsx`): everything, including support services, programs and platform margin.
- **Agency** (`agency/index.html` → `src/agency.tsx`): plans, add-ons and usage, always with the agency discount. There's no agency mode toggle, no support, no programs and no margins.

Customer prices live in `src/pricing.ts` and are shared, so a price change updates both apps. Internal-only data lives in `src/internal/` (`concierge.ts` for support, `programs.ts`, and `costs.ts` for delivery costs). Only the internal entry imports it, and it reaches shared code through `useInternalEdition()` (`src/edition.tsx`), which returns `null` in the agency app. **Never import from `src/internal/` in shared code**, except with `import type`.

The build puts internal code under `dist/assets/internal/`. The gate serves agency users `agency/index.html` for every page and returns 404 for internal files. `npm run build` ends with `scripts/check-agency-bundle.mjs`, which fails the build if any file the agency app loads is internal or contains internal data.

To preview the agency app, sign in as an approved agency user. With plain `npm run dev`, open http://localhost:5173/agency/.

### WorkOS setup

1. Create a WorkOS account (AuthKit is free up to 1M MAU) and enable AuthKit.
2. **Authentication**: enable Email + code (magic auth), Google OAuth and GitHub OAuth. Disable password if you want a passwordless setup like projects.mastra.ai.
3. **Redirects**: add `http://localhost:8888/auth/callback` as a redirect URI, and `http://localhost:8888/auth/signed-out` as the sign-out redirect. Add the production equivalents when deploying.
4. **Branding**: upload the Mastra logo and pick the dark theme so the hosted page matches.
5. Copy the API key and Client ID into `.env` (see `.env.example`) and generate `SESSION_SECRET` with `openssl rand -base64 48`.

### Running locally

- `npm run dev:auth`: `netlify dev` on http://localhost:8888 with real sign-in. Edge functions and the submit-order function both run.
- `npm run dev`: plain Vite with no sign-in. You are `dev@localhost` with role `AUTH_DEV_ROLE` (default `internal`).

## Order submission

Submit order opens a review page (line items), then account details. Confirm emails the order to `josh@mastra.ai` and `jake@mastra.ai` via Resend. Internal users only: agency users don't see Submit order, and the API rejects their orders (403), so agency orders are never emailed.

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

- **Trace Intelligence** — (all plans; also available without a plan selected). Progressive per-trace bands: first 10k/mo at $0, then $0.016 → $0.002 through 10M (see calculator table; includes overage rates). When selected with a plan, **+$3,000/yr** is added to that plan. Pool cost = sum of each band × rate × 12.
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

When a plan is bundled with any add-on, the **plan** gets **15% off**. Add-ons and platform usage overage are not discounted. The bundle discount does **not** stack with the agency discount — while agency mode is on, only the 30% agency discount applies.

### Agency mode

Optional toggle on the order builder in the internal app. Agency users always get it, with no toggle. Applies **30% off** plan and add-ons. Platform usage overage is not discounted. While agency mode is on, Support / services are hidden.

### Mastra Forward

Shown above Support, hidden while agency mode is on. Enter bill rate ($/hour) and hours/week. Cost basis is $110/hr. Annual = rate × hours/week × 52. Margin = revenue − cost (shown once both inputs are set).

### Support

Hidden while agency mode is on.

- **Path 1** — Small / Medium / Large; choose quarterly ($9k / $24k / $70k) or annual package ($32k / $86k / $250k, ~10% off)
- **Path 2** — Evals is a flat $5,000 one-time payment, scaled by the headcount multiplier (same curve as BYOC / Compliance / Premium On-Call). Integrations / Infrastructure / Custom: price = engineer $/hr × hours ÷ (1 − margin)
- **Mastra Audit** — $500 one-time

No purchase-count or support package discounts.
