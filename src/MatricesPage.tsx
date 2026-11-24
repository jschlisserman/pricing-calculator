import { PATH2_PACKAGES, PATH2_EVALS_ID } from './concierge'
import {
  ENTERPRISE_FEATURES,
  FORWARD_PLANS,
  formatForwardPriceRange,
  getForwardTraceIncludedMonthly,
} from './forwardPlans'
import {
  ADDON_HEADCOUNT_MULTIPLIERS,
  ADDONS,
  EVALS_HEADCOUNT_MULTIPLIERS,
  HEADCOUNT_BANDS,
  PLANS,
  PLAN_HEADCOUNT_MULTIPLIERS,
  formatMultiplier,
  formatUsd,
  type AddonId,
  type HeadcountBandId,
} from './pricing'

interface MatrixRow {
  name: string
  note?: string
  baseAnnual: number
  multipliers: Record<HeadcountBandId, number>
}

function addonRow(id: AddonId, note: string): MatrixRow {
  const addon = ADDONS.find((a) => a.id === id)!
  return {
    name: addon.name,
    note,
    baseAnnual: addon.flatAnnual ?? 0,
    multipliers: ADDON_HEADCOUNT_MULTIPLIERS[id]!,
  }
}

const ROWS: MatrixRow[] = [
  ...PLANS.map((plan) => ({
    name: plan.name,
    baseAnnual: plan.annualFee,
    multipliers: PLAN_HEADCOUNT_MULTIPLIERS[plan.id],
  })),
  addonRow('agent-builder', 'Add-on · All plans'),
  addonRow('compliance', 'Add-on · Enterprise Platform only'),
  addonRow(
    'premium-on-call',
    'Add-on · Enterprise plans, or standalone',
  ),
]

const evalsPackage = PATH2_PACKAGES.find((p) => p.id === PATH2_EVALS_ID)!
const EVALS_ROW: MatrixRow = {
  name: 'Evals (Path 2)',
  note: 'Support · one-time',
  baseAnnual: evalsPackage.flatPrice ?? 0,
  multipliers: EVALS_HEADCOUNT_MULTIPLIERS,
}

const MULTIPLIER_ROWS: MatrixRow[] = [...ROWS, EVALS_ROW]

export default function MatricesPage() {
  return (
    <>
      <section className="hero animate-in delay-1">
        <h1>Headcount pricing matrix.</h1>
        <p className="matrix-sub">
          Annual subscription by company headcount band. Base fee is the 1.0×
          (SMB) price; each band multiplies the base.
        </p>
      </section>

      <div className="matrix-stack animate-in delay-2">
        <section className="matrix-card">
          <h2>Software + Services</h2>
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Guidance / yr</th>
                  <th scope="col">Hours / wk</th>
                  <th scope="col">Features</th>
                  <th scope="col">Agent Learning traces</th>
                </tr>
              </thead>
              <tbody>
                {FORWARD_PLANS.map((plan) => {
                  const featureNote =
                    plan.featurePickCount > 0
                      ? plan.includedFeatures.length > 0
                        ? `${plan.includedFeatures
                            .map(
                              (id) =>
                                ENTERPRISE_FEATURES.find((f) => f.id === id)
                                  ?.name,
                            )
                            .filter(Boolean)
                            .join(', ')} + pick ${plan.featurePickCount}`
                        : `Pick ${plan.featurePickCount} of ${plan.featurePool.length}`
                      : 'All enterprise features'
                  const tiIncluded = getForwardTraceIncludedMonthly(plan)
                  return (
                    <tr key={plan.id}>
                      <th scope="row">
                        {plan.name}
                        <span className="matrix-row-note">
                          {plan.description}
                        </span>
                      </th>
                      <td>{formatForwardPriceRange(plan)}</td>
                      <td>
                        {plan.hoursMax == null
                          ? `${plan.hoursMin}+`
                          : `${plan.hoursMin}–${plan.hoursMax}`}
                      </td>
                      <td>{featureNote}</td>
                      <td>
                        {tiIncluded.toLocaleString('en-US')}/mo
                        {plan.id === 'startup' ? ' when picked' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="matrix-note">
            Annual contracts at $300/hr × hours/week × 52 weeks, rounded to the
            nearest $1,000, except 40 hrs/week which is a fixed $500k/yr.
            Guidance bands: Startup $31k–$62k (2–4 hrs), Growth $94k–$125k (6–8
            hrs), Enterprise $156k–$500k (10–40 hrs). Startup picks 1 of 3
            enterprise features; Growth picks 2 of 3; Enterprise includes all 3
            (Factory, Knowledge, Agent Learning). Agent Learning includes 25k
            traces/mo on Growth and 50k on Enterprise (10k when picked on
            Startup); margin COGS is $0.005/trace.
          </p>
        </section>

        <section className="matrix-card">
          <h2>Multipliers</h2>
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Base / yr</th>
                  {HEADCOUNT_BANDS.map((band) => (
                    <th scope="col" key={band.id}>
                      {band.name}
                      <span className="matrix-band-range">
                        {band.rangeLabel}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MULTIPLIER_ROWS.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">
                      {row.name}
                      {row.note && (
                        <span className="matrix-row-note">{row.note}</span>
                      )}
                    </th>
                    <td>{formatUsd(row.baseAnnual)}</td>
                    {HEADCOUNT_BANDS.map((band) => (
                      <td key={band.id}>
                        {formatMultiplier(row.multipliers[band.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="matrix-card">
          <h2>Annual price</h2>
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Base / yr</th>
                  {HEADCOUNT_BANDS.map((band) => (
                    <th scope="col" key={band.id}>
                      {band.name}
                      <span className="matrix-band-range">
                        {band.rangeLabel}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">
                      {row.name}
                      {row.note && (
                        <span className="matrix-row-note">{row.note}</span>
                      )}
                    </th>
                    <td>{formatUsd(row.baseAnnual)}</td>
                    {HEADCOUNT_BANDS.map((band) => (
                      <td key={band.id}>
                        {formatUsd(
                          Math.round(
                            row.baseAnnual * row.multipliers[band.id],
                          ),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="matrix-note">
            Agent Learning, Knowledge, and Factory are Coming Soon on the
            Software tab. When Agent Learning is included via Software +
            Services, the $3k plan uplift is waived; pool overage still bills.
          </p>
        </section>

        <section className="matrix-card">
          <h2>Evals (Path 2) — one-time price</h2>
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Base</th>
                  {HEADCOUNT_BANDS.map((band) => (
                    <th scope="col" key={band.id}>
                      {band.name}
                      <span className="matrix-band-range">
                        {band.rangeLabel}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    {EVALS_ROW.name}
                    {EVALS_ROW.note && (
                      <span className="matrix-row-note">{EVALS_ROW.note}</span>
                    )}
                  </th>
                  <td>{formatUsd(EVALS_ROW.baseAnnual)}</td>
                  {HEADCOUNT_BANDS.map((band) => (
                    <td key={band.id}>
                      {formatUsd(
                        Math.round(
                          EVALS_ROW.baseAnnual *
                            EVALS_ROW.multipliers[band.id],
                        ),
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
