import {
  CONCIERGE_AUDIT_BANDS,
  CONCIERGE_PATH1_ADVISORY_BANDS,
  CONCIERGE_PATH1_HANDS_ON_BANDS,
  CONCIERGE_PATH2_MARGIN_EXAMPLES,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  PATH2_MARGIN_OPTIONS,
} from './concierge'
import {
  AGENCY_PASS_THROUGH_BANDS,
  DPP_HEADCOUNT_BANDS,
  HEADCOUNT_BANDS,
  formatMultiplier,
  formatUsd,
} from './pricing'

interface TablesPageProps {
  activeBandId: string
  dppBandId: string | null
}

export default function TablesPage({
  activeBandId,
  dppBandId,
}: TablesPageProps) {
  return (
    <div className="tables-page animate-in delay-1">
      <section className="hero">
        <h1>Tables</h1>
        <p>Volume discounts and list-price bands by headcount.</p>
      </section>

      <section className="rules">
        <div className="rule">
          <h4>2 purchases</h4>
          <p>15% off product total</p>
        </div>
        <div className="rule">
          <h4>3 purchases</h4>
          <p>20% off product total</p>
        </div>
        <div className="rule">
          <h4>4+ purchases</h4>
          <p>25% off product total</p>
        </div>
        <div className="rule">
          <h4>Concierge + packages</h4>
          <p>
            15% Concierge with 1 package, 20% with 2+. Package volume still
            applies.
          </p>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Headcount pricing bands</h2>
        </div>
        <p className="band-table-intro">
          Annual list prices for one purchase in each product category. Growth is
          the baseline; other bands apply the multiplier to that list.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>Deployment</th>
                <th>Security</th>
                <th>Agent Learning</th>
                <th>Collaboration</th>
                <th>All four (list)</th>
              </tr>
            </thead>
            <tbody>
              {HEADCOUNT_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === activeBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier, band.custom)}</td>
                  <td>{band.deployment}</td>
                  <td>{band.security}</td>
                  <td>{band.agentLearning}</td>
                  <td>{band.collaboration}</td>
                  <td>{band.allFour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Concierge Path 1 — Advisory</h2>
        </div>
        <p className="band-table-intro">
          Quarterly Advisory list prices by headcount band (implied hourly in
          parentheses). Growth is the 1.0× baseline.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>Small / qtr</th>
                <th>Medium / qtr</th>
                <th>Large / qtr</th>
              </tr>
            </thead>
            <tbody>
              {CONCIERGE_PATH1_ADVISORY_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === activeBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier, band.custom)}</td>
                  <td>{band.small}</td>
                  <td>{band.medium}</td>
                  <td>{band.large}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Concierge Path 1 — Hands-On</h2>
        </div>
        <p className="band-table-intro">
          Hands-On is 30% above Advisory. Same hours; higher quarterly rate and
          implied hourly.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>Small / qtr</th>
                <th>Medium / qtr</th>
                <th>Large / qtr</th>
              </tr>
            </thead>
            <tbody>
              {CONCIERGE_PATH1_HANDS_ON_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === activeBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier, band.custom)}</td>
                  <td>{band.small}</td>
                  <td>{band.medium}</td>
                  <td>{band.large}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Concierge Path 2 — Hours × margin</h2>
        </div>
        <p className="band-table-intro">
          Price = ${DEFAULT_ENGINEER_COST_PER_HOUR}/hr × hours ÷ (1 − target
          margin). Pick 30%–70% margin per project.
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
              {CONCIERGE_PATH2_MARGIN_EXAMPLES.map((row) => (
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
          <h2>Mastra Audit fees</h2>
        </div>
        <p className="band-table-intro">
          One-time Audit fee by headcount band.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Audit fee</th>
              </tr>
            </thead>
            <tbody>
              {CONCIERGE_AUDIT_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === activeBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{band.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>DPP headcount bands</h2>
        </div>
        <p className="band-table-intro">
          Design Partner Program annual fees for Startup through Mid-Market only.
          Not offered at Enterprise (500+) or above.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>DPP annual fee</th>
              </tr>
            </thead>
            <tbody>
              {DPP_HEADCOUNT_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === dppBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier)}</td>
                  <td>{formatUsd(band.annualFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band-table-section">
        <div className="panel-head">
          <h2>Agency pass-through fees</h2>
        </div>
        <p className="band-table-intro">
          Client pass-through pricing for agencies: 30% off product headcount
          bands, rounded to the nearest $1,000.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>Deployment</th>
                <th>Security</th>
                <th>Agent Learning</th>
                <th>Collaboration</th>
                <th>All four (list)</th>
              </tr>
            </thead>
            <tbody>
              {AGENCY_PASS_THROUGH_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === activeBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier, band.custom)}</td>
                  <td>{band.deployment}</td>
                  <td>{band.security}</td>
                  <td>{band.agentLearning}</td>
                  <td>{band.collaboration}</td>
                  <td>{band.allFour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
