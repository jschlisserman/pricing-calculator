import {
  AUDIT_FEE,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  PATH2_MARGIN_OPTIONS,
  SUPPORT_PATH1_TABLE,
  SUPPORT_PATH2_MARGIN_EXAMPLES,
} from './concierge'
import {
  ADDONS,
  AGENCY_ANNUAL_FEE,
  BUILDER_SEAT_MONTHLY,
  DESIGN_PARTNER_AGENT_LEARNING_CREDIT_MONTHLY,
  DESIGN_PARTNER_ANNUAL_FEE,
  DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY,
  DESIGN_PARTNER_INCLUDED_BUILDER_SEATS,
  DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS,
  PLANS,
  formatPercent,
  formatUsd,
} from './pricing'

export default function TablesPage() {
  return (
    <div className="tables-page animate-in delay-1">
      <section className="hero">
        <h1>Tables</h1>
        <p>Seat-based plans, add-ons, and support packages.</p>
      </section>

      <section className="rules">
        <div className="rule">
          <h4>Teams</h4>
          <p>$250/mo · no seats</p>
        </div>
        <div className="rule">
          <h4>Enterprise</h4>
          <p>Annual minimum · fixed seat price</p>
        </div>
        <div className="rule">
          <h4>Builder seats</h4>
          <p>
            Enterprise only · {formatUsd(BUILDER_SEAT_MONTHLY)}/mo · viewers
            free
          </p>
        </div>
        <div className="rule">
          <h4>Add-ons</h4>
          <p>Enterprise only · each % of seat contract</p>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Plans</h2>
        </div>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Seats</th>
                <th>Includes</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>
                    {plan.id === 'free'
                      ? '$0'
                      : plan.flatMonthly != null
                        ? `${formatUsd(plan.flatMonthly)}/month`
                        : `${formatUsd(plan.annualMinimum)}/yr minimum`}
                  </td>
                  <td>
                    {plan.id === 'free'
                      ? 'Unlimited users'
                      : plan.id === 'teams'
                        ? 'None'
                        : `${plan.includedDeveloperSeats} developer included${
                            plan.flatDeveloperSeatMonthly != null
                              ? `, ${formatUsd(plan.flatDeveloperSeatMonthly)}/seat/mo`
                              : ''
                          }`}
                  </td>
                  <td>{plan.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Additional developer seats</h2>
        </div>
        <p className="band-table-intro">
          Fixed monthly price. Platform is $150/seat/mo, Self-Hosted is
          $175/seat/mo, BYO VPC and Private Cloud are $200/seat/mo, and BYOC
          is $250/seat/mo.
        </p>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Add-ons</h2>
        </div>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Add-on</th>
                <th>Price</th>
                <th>What it covers</th>
              </tr>
            </thead>
            <tbody>
              {ADDONS.map((addon) => (
                <tr key={addon.id}>
                  <td>{addon.name}</td>
                  <td>
                    {formatPercent(addon.rate)} of seat contract
                    {addon.annualMinimum > 0
                      ? `, ${formatUsd(addon.annualMinimum)}/yr minimum`
                      : ''}
                    {addon.enterpriseOnly ? '. Enterprise only' : ''}
                  </td>
                  <td>{addon.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Support Path 1 — Standard</h2>
        </div>
        <p className="band-table-intro">
          Hours expire weekly and do not roll over. Annual is quarterly
          annualized, less approximately 10%.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Hours</th>
                <th>Per quarter</th>
                <th>Annual</th>
                <th>Implied hourly</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORT_PATH1_TABLE.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.hoursPerWeek} hrs/week</td>
                  <td>{row.quarterly}</td>
                  <td>{row.annual}</td>
                  <td>{row.impliedHourly}/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Support Path 2 — Hours × margin</h2>
        </div>
        <p className="band-table-intro">
          Price = ${DEFAULT_ENGINEER_COST_PER_HOUR}/hr × hours ÷ (1 − target
          margin). Packages: Evals, Integrations, Infrastructure, Custom.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Hours</th>
                <th>Cost</th>
                {PATH2_MARGIN_OPTIONS.map((rate) => (
                  <th key={rate}>{Math.round(rate * 100)}% price</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUPPORT_PATH2_MARGIN_EXAMPLES.map((row) => (
                <tr key={row.hours}>
                  <td>{row.hours}</td>
                  <td>{row.cost}</td>
                  {PATH2_MARGIN_OPTIONS.map((rate) => {
                    const label = `${Math.round(rate * 100)}%`
                    return <td key={rate}>{row.margins[label]}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Mastra Audit</h2>
        </div>
        <p className="band-table-intro">
          {formatUsd(AUDIT_FEE)} one-time. Credits 100% against a Build
          purchased within 90 days.
        </p>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Programs</h2>
        </div>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Fee</th>
                <th>Includes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Agency Partner</td>
                <td>{formatUsd(AGENCY_ANNUAL_FEE)}/yr</td>
                <td>
                  Includes {DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS} developer
                  seats and {DESIGN_PARTNER_INCLUDED_BUILDER_SEATS} builder
                  seats, then {formatUsd(DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY)}
                  /developer seat/mo and {formatUsd(BUILDER_SEAT_MONTHLY)}
                  /builder seat/mo. Client pass-through unpublished. Platform
                  or Self-Hosted only.
                </td>
              </tr>
              <tr>
                <td>Design Partner</td>
                <td>{formatUsd(DESIGN_PARTNER_ANNUAL_FEE)}/yr</td>
                <td>
                  Includes {DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS} developer
                  seats and {DESIGN_PARTNER_INCLUDED_BUILDER_SEATS} builder
                  seats, then {formatUsd(DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY)}
                  /developer seat/mo and {formatUsd(BUILDER_SEAT_MONTHLY)}
                  /builder seat/mo;{' '}
                  {formatUsd(DESIGN_PARTNER_AGENT_LEARNING_CREDIT_MONTHLY)}
                  /mo Agent Learning credit; one quarter Small support.
                  Platform or Self-Hosted only.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
