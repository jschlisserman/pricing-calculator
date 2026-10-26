import { PATH2_PACKAGES, PATH2_EVALS_ID } from './concierge'
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
            Agent Learning starts at $5,000/yr for the first 10k analyzed
            traces/mo, then the volume scale (25K $16/1k → 10M $2/1k). Not
            multiplied by headcount.
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
