import { useInternalEdition } from './edition'
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

export default function MatricesPage() {
  // Evals is a support service, so it only appears in the internal app.
  const internal = useInternalEdition()
  const evalsRow: MatrixRow | null = internal
    ? {
        name: 'Evals (Path 2)',
        note: 'Support · one-time',
        baseAnnual: internal.evalsBasePrice,
        multipliers: EVALS_HEADCOUNT_MULTIPLIERS,
      }
    : null
  const multiplierRows: MatrixRow[] = evalsRow ? [...ROWS, evalsRow] : ROWS

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
                {multiplierRows.map((row) => (
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
            Trace Intelligence uses progressive per-trace bands (first 10k/mo
            at $0, then down through 10M); selecting it adds $3,000/yr to the
            plan. Not multiplied by headcount.
          </p>
        </section>

        {evalsRow && (
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
                      {evalsRow.name}
                      {evalsRow.note && (
                        <span className="matrix-row-note">{evalsRow.note}</span>
                      )}
                    </th>
                    <td>{formatUsd(evalsRow.baseAnnual)}</td>
                    {HEADCOUNT_BANDS.map((band) => (
                      <td key={band.id}>
                        {formatUsd(
                          Math.round(
                            evalsRow.baseAnnual *
                              evalsRow.multipliers[band.id],
                          ),
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
