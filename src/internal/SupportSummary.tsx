import { useMemo } from 'react'
import { CloseIcon } from '../icons'
import {
  formatMultiplier,
  formatPercent,
  formatUsd,
  type HeadcountBand,
} from '../pricing'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  buildSupportMargin,
  type SupportQuote,
} from './concierge'

export interface SupportSummaryProps {
  support: SupportQuote
  headcountBand: HeadcountBand | null
  onRemove: (id: string) => void
}

/** Support lines, totals and margins in the order summary. */
export default function SupportSummary({
  support,
  headcountBand,
  onRemove,
}: SupportSummaryProps) {
  const margin = useMemo(
    () => buildSupportMargin(support, DEFAULT_ENGINEER_COST_PER_HOUR),
    [support],
  )

  return (
    <div className="summary-group">
      <h3 className="summary-group-title">Support</h3>
      <ul className="order-lines">
        {support.path1 && (
          <li className="order-line">
            <div>
              <span className="order-line-name">
                Path 1 · {support.path1.tier.name}
              </span>
              <span className="order-line-meta">
                {support.path1.tier.hoursPerWeek} hrs/wk ·{' '}
                {support.path1.billingPeriod === 'year'
                  ? 'Annual'
                  : 'Quarterly'}
              </span>
            </div>
            <span className="order-line-price">
              {formatUsd(support.path1.billedAmount)}
              <span className="order-line-meta">
                {support.path1.periodLabel}
              </span>
            </span>
            <button
              type="button"
              className="remove"
              onClick={() =>
                onRemove(support.path1!.tier.id)
              }
              aria-label={`Remove Path 1 ${support.path1.tier.name}`}
            >
              <CloseIcon />
            </button>
          </li>
        )}
        {support.path2.map((line) => (
          <li className="order-line" key={line.package.id}>
            <div>
              <span className="order-line-name">
                Path 2 · {line.package.name}
              </span>
              <span className="order-line-meta">
                {line.flatPrice != null
                  ? line.flatMultiplier !== 1 && headcountBand
                    ? `${formatUsd(line.flatPrice)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(line.flatMultiplier)} · Flat one-time`
                    : 'Flat one-time'
                  : `${line.hours} hrs · ${formatPercent(line.targetMarginRate)} target`}
              </span>
            </div>
            <span className="order-line-price">
              {line.listAmount > 0
                ? formatUsd(line.billedAmount)
                : '—'}
              <span className="order-line-meta">
                / one-time
              </span>
            </span>
            <button
              type="button"
              className="remove"
              onClick={() => onRemove(line.package.id)}
              aria-label={`Remove ${line.package.name}`}
            >
              <CloseIcon />
            </button>
          </li>
        ))}
        {support.audit && (
          <li className="order-line">
            <div>
              <span className="order-line-name">
                Mastra Audit
              </span>
            </div>
            <span className="order-line-price">
              {formatUsd(support.audit.billedAmount)}
              <span className="order-line-meta">
                / one-time
              </span>
            </span>
            <button
              type="button"
              className="remove"
              onClick={() => onRemove(AUDIT_ID)}
              aria-label="Remove Mastra Audit"
            >
              <CloseIcon />
            </button>
          </li>
        )}
      </ul>
      <div className="totals">
        {support.path1 && (
          <div className="total-row grand">
            <span>
              Support /{' '}
              {support.path1.billingPeriod === 'year'
                ? 'year'
                : 'quarter'}
            </span>
            <span>{formatUsd(support.path1Total)}</span>
          </div>
        )}
        {(support.path2.length > 0 || support.audit) && (
          <div
            className={`total-row${support.path1 ? '' : ' grand'}`}
          >
            <span>Support one-time</span>
            <span>{formatUsd(support.oneTimeTotal)}</span>
          </div>
        )}
        {support.path1 && (
          <div className="total-row muted">
            <span>Path 1 margin</span>
            <span>
              {formatUsd(margin.path1Margin)}
              {margin.path1MarginRate != null
                ? ` (${formatPercent(margin.path1MarginRate)})`
                : ''}
            </span>
          </div>
        )}
        {margin.path2.map((row) => (
          <div
            className="total-row muted"
            key={`margin-${row.id}`}
          >
            <span>Path 2 · {row.name} margin</span>
            <span>
              {formatUsd(Math.round(row.margin))}
              {row.marginRate != null
                ? ` (${formatPercent(row.marginRate)})`
                : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
