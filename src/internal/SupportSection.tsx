import NumberField from '../NumberField'
import { CheckIcon } from '../icons'
import { formatPercent, formatUsd } from '../pricing'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  DEFAULT_PATH2_MARGIN,
  PATH1_TIERS,
  PATH2_MARGIN_OPTIONS,
  PATH2_PACKAGES,
  getAuditFee,
  getPath1ImpliedHourly,
  getPath1ListPrice,
  getPath1PeriodLabel,
  getPath2Cost,
  getPath2ListPrice,
  isPath1Id,
  type Path1BillingPeriod,
  type Path2Hours,
  type Path2MarginRate,
  type Path2Margins,
  type Path2PackageId,
} from './concierge'

export interface SupportSectionProps {
  supportIds: string[]
  path1BillingPeriod: Path1BillingPeriod
  path2Hours: Path2Hours
  path2Margins: Path2Margins
  evalsMultiplier: number
  onToggle: (id: string) => void
  onBillingPeriodChange: (period: Path1BillingPeriod) => void
  onHoursChange: (packageId: Path2PackageId, hours: number | null) => void
  onMarginChange: (packageId: Path2PackageId, rate: Path2MarginRate) => void
}

/** Support services picker (Path 1, Path 2 builds, Mastra Audit). */
export default function SupportSection({
  supportIds,
  path1BillingPeriod,
  path2Hours,
  path2Margins,
  evalsMultiplier,
  onToggle,
  onBillingPeriodChange,
  onHoursChange,
  onMarginChange,
}: SupportSectionProps) {
  const engineerCostPerHour = DEFAULT_ENGINEER_COST_PER_HOUR
  const selectedPath1Id = supportIds.find(isPath1Id)
  const auditSelected = supportIds.includes(AUDIT_ID)
  const auditFee = getAuditFee()

  return (
    <section className="category concierge-section">
      <div className="category-title">
        <h3>Support</h3>
        <span className="category-meta">Services</span>
      </div>

      <div className="concierge-subhead">
        <h4>Path 1 — Standard</h4>
        <p>
          Ongoing engineering support. Annual is ~10% off quarterly
          annualized.
        </p>
      </div>
      <div
        className="mode-picker path1-billing-picker"
        role="radiogroup"
        aria-label="Path 1 billing period"
      >
        <button
          type="button"
          className={`mode-option${path1BillingPeriod === 'quarter' ? ' active' : ''}`}
          role="radio"
          aria-checked={path1BillingPeriod === 'quarter'}
          onClick={() => onBillingPeriodChange('quarter')}
        >
          <strong>Quarterly</strong>
          <span>Billed each quarter</span>
        </button>
        <button
          type="button"
          className={`mode-option${path1BillingPeriod === 'year' ? ' active' : ''}`}
          role="radio"
          aria-checked={path1BillingPeriod === 'year'}
          onClick={() => onBillingPeriodChange('year')}
        >
          <strong>Annually</strong>
          <span>~10% off vs quarterly × 4</span>
        </button>
      </div>
      <div className="items">
        {PATH1_TIERS.map((tier) => {
          const selected = selectedPath1Id === tier.id
          const price = getPath1ListPrice(tier, path1BillingPeriod)
          const hourly = getPath1ImpliedHourly(
            price,
            tier,
            path1BillingPeriod,
          )
          const periodLabel = getPath1PeriodLabel(path1BillingPeriod)
          return (
            <button
              key={tier.id}
              type="button"
              className={`item radio${selected ? ' selected' : ''}`}
              onClick={() => onToggle(tier.id)}
              aria-pressed={selected}
            >
              <span className="check" aria-hidden="true" />
              <span className="item-body">
                <span className="item-name">
                  {tier.name}
                  <span className="pill">
                    {tier.hoursPerWeek} hrs/wk
                  </span>
                </span>
                <p className="item-desc">
                  {formatUsd(Math.round(hourly))}/hr implied
                  {path1BillingPeriod === 'quarter'
                    ? ` · ${formatUsd(tier.annualPrice)} annual package`
                    : ` · ${formatUsd(tier.quarterlyPrice)}/qtr`}
                </p>
              </span>
              <span className="item-price">
                {formatUsd(price)}
                <br />
                {periodLabel}
              </span>
            </button>
          )
        })}
      </div>

      <div className="concierge-subhead">
        <h4>Path 2 — Builds</h4>
        <p>
          Fixed-scope delivery. Price = ${engineerCostPerHour}/hr ×
          hours ÷ (1 − margin)
        </p>
      </div>
      <div className="items">
        {PATH2_PACKAGES.map((pkg) => {
          const selected = supportIds.includes(pkg.id)
          const isFlat = pkg.flatPrice != null
          const hours = path2Hours[pkg.id] ?? 0
          const targetMargin =
            path2Margins[pkg.id] ?? DEFAULT_PATH2_MARGIN
          const cost = getPath2Cost(hours, engineerCostPerHour)
          const listPrice =
            pkg.flatPrice != null
              ? pkg.flatPrice * evalsMultiplier
              : getPath2ListPrice(
                  hours,
                  targetMargin,
                  engineerCostPerHour,
                )
          return (
            <div
              key={pkg.id}
              className={`item-wrap${selected ? ' open' : ''}`}
            >
              <button
                type="button"
                className={`item${selected ? ' selected' : ''}`}
                onClick={() => onToggle(pkg.id)}
                aria-pressed={selected}
              >
                <span className="check" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
                <span className="item-body">
                  <span className="item-name">
                    {pkg.name}
                    <span className="pill">Outcome</span>
                  </span>
                </span>
                <span className="item-price">
                  {listPrice > 0 ? (
                    <>
                      {formatUsd(Math.round(listPrice))}
                      <br />
                      / one-time
                    </>
                  ) : (
                    <>
                      Set hours
                      <br />
                      / one-time
                    </>
                  )}
                </span>
              </button>
              {selected && !isFlat && (
                <div className="path2-pricing">
                  <label
                    className="scoped-price"
                    htmlFor={`hours-${pkg.id}`}
                  >
                    Project hours
                    <NumberField
                      id={`hours-${pkg.id}`}
                      value={
                        path2Hours[pkg.id] != null
                          ? path2Hours[pkg.id]!
                          : null
                      }
                      min={0}
                      placeholder="0"
                      emptyValue={null}
                      onCommit={(next) =>
                        onHoursChange(pkg.id, next)
                      }
                    />
                  </label>
                  <div
                    className="mode-picker path2-margin-picker"
                    role="radiogroup"
                    aria-label={`${pkg.name} target margin`}
                  >
                    {PATH2_MARGIN_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        className={`mode-option${targetMargin === rate ? ' active' : ''}`}
                        role="radio"
                        aria-checked={targetMargin === rate}
                        onClick={() =>
                          onMarginChange(pkg.id, rate)
                        }
                      >
                        <strong>{formatPercent(rate)}</strong>
                        <span>target margin</span>
                      </button>
                    ))}
                  </div>
                  <div className="path2-price-breakdown">
                    <span>
                      Cost {formatUsd(Math.round(cost))}
                      {hours > 0
                        ? ` · ${hours} hrs × ${formatUsd(engineerCostPerHour)}/hr`
                        : ''}
                    </span>
                    <strong>
                      {listPrice > 0
                        ? formatUsd(Math.round(listPrice))
                        : '—'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="concierge-subhead">
        <h4>Mastra Audit</h4>
        <p>
          One-time scoping fee. Credits 100% against a Build within 90
          days.
        </p>
      </div>
      <div className="items">
        <button
          type="button"
          className={`item${auditSelected ? ' selected' : ''}`}
          onClick={() => onToggle(AUDIT_ID)}
          aria-pressed={auditSelected}
        >
          <span className="check" aria-hidden="true">
            {auditSelected ? <CheckIcon /> : null}
          </span>
          <span className="item-body">
            <span className="item-name">Mastra Audit</span>
          </span>
          <span className="item-price">
            {formatUsd(auditFee)}
            <br />
            / one-time
          </span>
        </button>
      </div>
    </section>
  )
}
