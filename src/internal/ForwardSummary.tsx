import { CloseIcon } from '../icons'
import { formatPercent, formatUsd } from '../pricing'
import type { MastraForwardQuote } from './concierge'

export interface ForwardSummaryProps {
  quote: MastraForwardQuote
  onRemove: () => void
}

/** Mastra Forward line, total and margin in the order summary. */
export default function ForwardSummary({ quote, onRemove }: ForwardSummaryProps) {
  return (
    <div className="summary-group">
      <h3 className="summary-group-title">Mastra Forward</h3>
      <ul className="order-lines">
        <li className="order-line">
          <div>
            <span className="order-line-name">Mastra Forward</span>
            <span className="order-line-meta">
              {formatUsd(quote.sellRatePerHour)}/hr · {quote.hoursPerWeek}{' '}
              hrs/wk · cost {formatUsd(quote.costPerHour)}/hr
            </span>
          </div>
          <span className="order-line-price">
            {formatUsd(Math.round(quote.annualRevenue))}
            <span className="order-line-meta">/ yr</span>
          </span>
          <button
            type="button"
            className="remove"
            onClick={onRemove}
            aria-label="Remove Mastra Forward"
          >
            <CloseIcon />
          </button>
        </li>
      </ul>
      <div className="totals">
        <div className="total-row grand">
          <span>Mastra Forward / year</span>
          <span>{formatUsd(Math.round(quote.annualRevenue))}</span>
        </div>
        <div className="total-row muted">
          <span>Forward margin</span>
          <span>
            {formatUsd(Math.round(quote.annualMargin))}
            {quote.marginRate != null
              ? ` (${formatPercent(quote.marginRate)})`
              : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
