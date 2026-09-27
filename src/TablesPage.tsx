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
  DESIGN_PARTNER_MAX_BUILDER_SEATS,
  DESIGN_PARTNER_MAX_DEVELOPER_SEATS,
  PLANS,
  VOLUME_TIERS,
  formatPercent,
  formatUsd,
} from './pricing'

export default function TablesPage() {
  return (
    <div className="tables-page animate-in delay-1">
      <section className="hero">
        <h1>Tables</h1>
        <p>Seat-based plans, volume tiers, add-ons, and support packages.</p>
      </section>

      <section className="rules">
        <div className="rule">
          <h4>Teams</h4>
          <p>$250/mo · 5 developer seats, then $39/seat/mo</p>
        </div>
        <div className="rule">
          <h4>Enterprise</h4>
          <p>Annual minimum · seats at volume-tier rates</p>
        </div>
        <div className="rule">
          <h4>Builder seats</h4>
          <p>{formatUsd(BUILDER_SEAT_MONTHLY)}/mo flat · viewers free</p>
        </div>
        <div className="rule">
          <h4>Add-ons</h4>
          <p>Each % of seat contract · independent</p>
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
                      ? 'Up to 5 developer seats'
                      : plan.id === 'teams'
                        ? `5 developer included, then ${formatUsd(plan.extraDeveloperSeatMonthly ?? 0)}/seat/mo`
                        : `${plan.includedDeveloperSeats} developer included, then volume-tier $/seat/mo`}
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
          <h2>Developer seat volume tiers</h2>
        </div>
        <p className="band-table-intro">
          All developer seats bill at the rate for the total seat count.
          Self-hosted and isolated (BYO VPC, Private Cloud, BYOC) follow the
          platform step-down.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Developer seats</th>
                <th>Platform</th>
                <th>Self-Hosted</th>
                <th>Isolated</th>
              </tr>
            </thead>
            <tbody>
              {VOLUME_TIERS.map((tier) => (
                <tr key={tier.minSeats}>
                  <td>
                    {tier.maxSeats == null
                      ? `${tier.minSeats}+`
                      : `${tier.minSeats}–${tier.maxSeats}`}
                  </td>
                  <td>{formatUsd(tier.platform)}/mo</td>
                  <td>{formatUsd(tier.selfHosted)}/mo</td>
                  <td>{formatUsd(tier.isolation)}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <td>Program fee only; client pass-through unpublished</td>
              </tr>
              <tr>
                <td>Design Partner</td>
                <td>{formatUsd(DESIGN_PARTNER_ANNUAL_FEE)}/yr</td>
                <td>
                  Up to {DESIGN_PARTNER_MAX_DEVELOPER_SEATS} developer +{' '}
                  {DESIGN_PARTNER_MAX_BUILDER_SEATS} builder seats;{' '}
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
