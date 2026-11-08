import NumberField from '../NumberField'
import { CheckIcon } from '../icons'
import { formatPercent, formatUsd } from '../pricing'
import {
  DEFAULT_ENGINEER_COST_PER_HOUR,
  isForwardBillable,
  type MastraForwardQuote,
} from './concierge'

export interface ForwardSectionProps {
  selected: boolean
  sellRatePerHour: number | null
  hoursPerWeek: number | null
  quote: MastraForwardQuote | null
  onToggle: () => void
  onSellRateChange: (rate: number | null) => void
  onHoursChange: (hours: number | null) => void
}

/** Mastra Forward picker: bill rate, hours/week and live margin. */
export default function ForwardSection({
  selected,
  sellRatePerHour,
  hoursPerWeek,
  quote,
  onToggle,
  onSellRateChange,
  onHoursChange,
}: ForwardSectionProps) {
  const billable = isForwardBillable(quote)

  return (
    <section className="category">
      <div className="category-title">
        <h3>Mastra Forward</h3>
        <span className="category-meta">Services</span>
      </div>
      <div className="items">
        <div className={`item-wrap${selected ? ' open' : ''}`}>
          <button
            type="button"
            className={`item${selected ? ' selected' : ''}`}
            onClick={onToggle}
            aria-pressed={selected}
          >
            <span className="check" aria-hidden="true">
              {selected ? <CheckIcon /> : null}
            </span>
            <span className="item-body">
              <span className="item-name">Mastra Forward</span>
              <p className="item-desc">
                Billable engineering hours. Cost basis{' '}
                {formatUsd(DEFAULT_ENGINEER_COST_PER_HOUR)}/hr.
              </p>
            </span>
            <span className="item-price">
              {billable && quote ? (
                <>
                  {formatUsd(Math.round(quote.annualRevenue))}
                  <br />
                  / year
                </>
              ) : (
                <>
                  Set rate
                  <br />
                  &amp; hours
                </>
              )}
            </span>
          </button>
          {selected && (
            <div className="path2-pricing">
              <label className="scoped-price" htmlFor="forward-sell-rate">
                $/hour
                <NumberField
                  id="forward-sell-rate"
                  value={sellRatePerHour}
                  min={0}
                  placeholder="e.g. 220"
                  emptyValue={null}
                  onCommit={onSellRateChange}
                  aria-label="Mastra Forward bill rate per hour"
                />
              </label>
              <label className="scoped-price" htmlFor="forward-hours-week">
                Hours / week
                <NumberField
                  id="forward-hours-week"
                  value={hoursPerWeek}
                  min={0}
                  placeholder="e.g. 10"
                  emptyValue={null}
                  onCommit={onHoursChange}
                  aria-label="Mastra Forward hours per week"
                />
              </label>
              {billable && quote && (
                <div className="path2-price-breakdown">
                  <span>
                    Cost {formatUsd(Math.round(quote.annualCost))}/yr ·{' '}
                    {quote.hoursPerWeek} hrs/wk × {formatUsd(quote.costPerHour)}
                    /hr × 52
                  </span>
                  <strong>
                    Margin {formatUsd(Math.round(quote.annualMargin))}/yr
                    {quote.marginRate != null
                      ? ` (${formatPercent(quote.marginRate)})`
                      : ''}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
