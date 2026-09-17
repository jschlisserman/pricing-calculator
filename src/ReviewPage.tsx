import { useState } from 'react'
import type { OrderSnapshot, SubmitOrderRequest } from './orderSnapshot'
import { formatPercent, formatUsd } from './pricing'

interface ReviewPageProps {
  order: OrderSnapshot
  onBack: () => void
  onSubmitted: () => void
}

type ReviewStep = 'order' | 'details'

function OrderLines({ order }: { order: OrderSnapshot }) {
  return (
    <>
      {order.productLines.length > 0 && (
        <div className="summary-group">
          <h3 className="summary-group-title">Products</h3>
          <ul className="order-lines">
            {order.productLines.map((line) => {
              const showDiscount =
                !line.noBaseFee &&
                line.listAmount != null &&
                line.billedAmount != null &&
                line.listAmount > line.billedAmount
              return (
                <li className="order-line review-line" key={line.name}>
                  <div>
                    <span className="order-line-name">{line.name}</span>
                    {line.meta && (
                      <span className="order-line-meta">{line.meta}</span>
                    )}
                  </div>
                  <span className="order-line-price">
                    {line.noBaseFee ? (
                      <span className="order-line-meta">—</span>
                    ) : (
                      <>
                        {showDiscount && (
                          <span className="strike">
                            {formatUsd(line.listAmount!)}
                          </span>
                        )}
                        {formatUsd(line.billedAmount ?? 0)}
                        <span className="order-line-meta">{line.period}</span>
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="totals">
            {order.productDiscountRate > 0 &&
              order.productDiscountAmount > 0 && (
                <div className="total-row discount">
                  <span>
                    Volume discount ({formatPercent(order.productDiscountRate)})
                  </span>
                  <span>−{formatUsd(order.productDiscountAmount)}</span>
                </div>
              )}
            <div className="total-row grand">
              <span>Product total / year</span>
              <span>{formatUsd(order.productTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {order.conciergeLines.length > 0 && (
        <div className="summary-group">
          <h3 className="summary-group-title">Concierge</h3>
          <ul className="order-lines">
            {order.conciergeLines.map((line) => {
              const showDiscount =
                line.listAmount != null &&
                line.billedAmount != null &&
                line.listAmount > line.billedAmount
              return (
                <li
                  className="order-line review-line"
                  key={line.name + (line.meta ?? '')}
                >
                  <div>
                    <span className="order-line-name">{line.name}</span>
                    {line.meta && (
                      <span className="order-line-meta">{line.meta}</span>
                    )}
                  </div>
                  <span className="order-line-price">
                    {line.billedAmount == null || line.billedAmount === 0 ? (
                      '—'
                    ) : (
                      <>
                        {showDiscount && (
                          <span className="strike">
                            {formatUsd(Math.round(line.listAmount!))}
                          </span>
                        )}
                        {formatUsd(line.billedAmount)}
                      </>
                    )}
                    <span className="order-line-meta">{line.period}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="totals">
            {order.conciergeDiscountRate > 0 &&
              order.conciergeDiscountAmount > 0 && (
                <div className="total-row discount">
                  <span>
                    Concierge discount (
                    {formatPercent(order.conciergeDiscountRate)})
                  </span>
                  <span>−{formatUsd(order.conciergeDiscountAmount)}</span>
                </div>
              )}
            {order.conciergeQuarterlyTotal != null && (
              <div className="total-row grand">
                <span>Concierge / quarter</span>
                <span>{formatUsd(order.conciergeQuarterlyTotal)}</span>
              </div>
            )}
            {order.conciergeOneTimeTotal != null && (
              <div
                className={`total-row${order.conciergeQuarterlyTotal != null ? '' : ' grand'}`}
              >
                <span>Concierge one-time</span>
                <span>{formatUsd(order.conciergeOneTimeTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function ReviewPage({
  order,
  onBack,
  onSubmitted,
}: ReviewPageProps) {
  const [snapshot] = useState(order)
  const [step, setStep] = useState<ReviewStep>('order')
  const [accountOwner, setAccountOwner] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [leadCompanyName, setLeadCompanyName] = useState('')
  const [pointOfContactName, setPointOfContactName] = useState('')
  const [pointOfContactEmail, setPointOfContactEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const formReady =
    accountOwner.trim().length > 0 &&
    accountEmail.trim().length > 0 &&
    leadCompanyName.trim().length > 0

  async function confirmOrder() {
    const owner = accountOwner.trim()
    const email = accountEmail.trim()
    const company = leadCompanyName.trim()
    if (!owner || !email || !company) {
      setError('Account owner, account email, and lead company name are required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const body: SubmitOrderRequest = {
        order: snapshot,
        accountOwner: owner,
        accountEmail: email,
        leadCompanyName: company,
        pointOfContactName: pointOfContactName.trim(),
        pointOfContactEmail: pointOfContactEmail.trim(),
        notes: notes.trim() || undefined,
      }
      const response = await fetch('/api/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
      }
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit order.')
      }
      setDone(true)
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <section className="review-page animate-in delay-1">
        <div className="panel review-panel">
          <div className="panel-head">
            <h2>Order submitted</h2>
          </div>
          <p className="review-success">
            Confirmation emailed to {accountEmail.trim()}.
          </p>
          <button type="button" className="clear-btn" onClick={onBack}>
            Back to order builder
          </button>
        </div>
      </section>
    )
  }

  if (step === 'details') {
    return (
      <section className="review-page animate-in delay-1">
        <div className="panel review-panel">
          <div className="panel-head review-head">
            <div>
              <h2>Account details</h2>
            </div>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setError(null)
                setStep('order')
              }}
            >
              ← Back
            </button>
          </div>

          <div className="review-form review-form-standalone">
            <label className="review-field" htmlFor="account-owner">
              Account owner <span className="required">Required</span>
              <input
                id="account-owner"
                type="text"
                autoComplete="name"
                placeholder="Name"
                value={accountOwner}
                onChange={(e) => setAccountOwner(e.target.value)}
                required
              />
            </label>

            <label className="review-field" htmlFor="account-email">
              Account email <span className="required">Required</span>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                required
              />
            </label>

            <label className="review-field" htmlFor="lead-company-name">
              Lead company name <span className="required">Required</span>
              <input
                id="lead-company-name"
                type="text"
                autoComplete="organization"
                placeholder="Company name"
                value={leadCompanyName}
                onChange={(e) => setLeadCompanyName(e.target.value)}
                required
              />
            </label>

            <label className="review-field" htmlFor="poc-name">
              Point of contact name <span className="optional">Optional</span>
              <input
                id="poc-name"
                type="text"
                autoComplete="name"
                placeholder="Contact name"
                value={pointOfContactName}
                onChange={(e) => setPointOfContactName(e.target.value)}
              />
            </label>

            <label className="review-field" htmlFor="poc-email">
              Point of contact email address{' '}
              <span className="optional">Optional</span>
              <input
                id="poc-email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={pointOfContactEmail}
                onChange={(e) => setPointOfContactEmail(e.target.value)}
              />
            </label>

            <label className="review-field" htmlFor="order-notes">
              Notes <span className="optional">Optional</span>
              <textarea
                id="order-notes"
                rows={4}
                placeholder="Context for the deal, timeline, exceptions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {error && <p className="review-error">{error}</p>}

            <button
              type="button"
              className="clear-btn confirm-btn"
              onClick={() => {
                void confirmOrder()
              }}
              disabled={submitting || !formReady}
            >
              {submitting ? 'Sending…' : 'Confirm'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="review-page animate-in delay-1">
      <div className="panel review-panel">
        <div className="panel-head review-head">
          <div>
            <h2>Submit order</h2>
          </div>
          <button type="button" className="text-btn" onClick={onBack}>
            ← Back
          </button>
        </div>

        <OrderLines order={snapshot} />

        <div className="review-actions">
          <button
            type="button"
            className="clear-btn confirm-btn"
            onClick={() => setStep('details')}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
