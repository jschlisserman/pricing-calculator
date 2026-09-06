import { useMemo, useState } from 'react'
import {
  CATALOG,
  CATEGORY_ORDER,
  buildQuote,
  formatPercent,
  formatUsd,
  type CatalogItem,
} from './pricing'

const FUTURE_FEATURES: Record<string, string[]> = {
  'security-controls': ['FGC'],
  'agent-learning': ['Custom Signals', 'Agent Learning'],
}

const SUPPORT_IDS = new Set(
  CATALOG.filter((item) => item.kind === 'support').map((item) => item.id),
)

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function periodLabel(item: CatalogItem): string {
  return item.billingPeriod === 'quarter' ? '/ quarter' : '/ year'
}

function categoryMeta(category: string): string {
  if (category === 'Deployment' || category === 'Collaboration') {
    return 'Individual SKUs'
  }
  if (category === 'Security and Controls' || category === 'Agent Learning') {
    return 'Bundle'
  }
  if (category === 'Support') return '3-month terms'
  return 'Programs'
}

export default function App() {
  const [employees, setEmployees] = useState(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const quote = useMemo(
    () => buildQuote(selectedIds, Number.isFinite(employees) ? employees : 0),
    [selectedIds, employees],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    for (const category of CATEGORY_ORDER) {
      map.set(
        category,
        CATALOG.filter((item) => item.category === category),
      )
    }
    return map
  }, [])

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const isSupport = SUPPORT_IDS.has(id)
      const already = prev.includes(id)

      if (already) {
        return prev.filter((x) => x !== id)
      }

      if (isSupport) {
        return [...prev.filter((x) => !SUPPORT_IDS.has(x)), id]
      }

      return [...prev, id]
    })
  }

  function removeItem(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const hasProducts = quote.productLineItems.length > 0
  const hasSupport = quote.supportLineItem !== null

  return (
    <div className="app">
      <header className="topbar animate-in">
        <a className="brand" href="https://mastra.ai" target="_blank" rel="noreferrer">
          <img
            className="brand-mark"
            src="/mastra-logo.png"
            alt="Mastra logo"
            width={40}
            height={40}
          />
          <div className="brand-copy">
            <span className="brand-name">mastra</span>
            <span className="brand-sub">Pricing calculator</span>
          </div>
        </a>
      </header>

      <section className="hero animate-in delay-1">
        <h1>Build an order. Adjust as you go.</h1>
        <p>
          Select products for an SMB baseline, then scale by company size. Volume
          discounts apply across product purchases; support is a separate
          quarterly engagement.
        </p>
      </section>

      <div className="layout animate-in delay-2">
        <div className="panel">
          <div className="size-block">
            <div className="panel-head">
              <h2>Company size</h2>
            </div>
            <div className="size-row">
              <div className="field">
                <label htmlFor="employees">Number of employees</label>
                <input
                  id="employees"
                  type="number"
                  min={1}
                  step={1}
                  value={employees}
                  onChange={(e) => {
                    const next = Number(e.target.value)
                    setEmployees(Number.isFinite(next) ? Math.max(0, next) : 0)
                  }}
                />
              </div>
              <div className="size-badge" aria-live="polite">
                {quote.companySizeLabel}
                {quote.companyMultiplier > 1 && (
                  <strong>×{quote.companyMultiplier}</strong>
                )}
              </div>
            </div>
            <p className="size-hint">
              SMB list pricing. +50% at 100+ employees. +100% above 500.
            </p>
          </div>

          <div className="panel-head">
            <h2>Catalog</h2>
          </div>

          {CATEGORY_ORDER.map((category) => {
            const items = byCategory.get(category) ?? []
            return (
              <section className="category" key={category}>
                <div className="category-title">
                  <h3>{category}</h3>
                  <span className="category-meta">{categoryMeta(category)}</span>
                </div>
                <div className="items">
                  {items.map((item) => {
                    const selected = selectedIds.includes(item.id)
                    const isSupport = item.kind === 'support'
                    const futureFeatures = FUTURE_FEATURES[item.id] ?? []

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`item${selected ? ' selected' : ''}${isSupport ? ' radio' : ''}`}
                        onClick={() => toggleItem(item.id)}
                        aria-pressed={selected}
                      >
                        <span className="check" aria-hidden="true">
                          {selected && !isSupport ? <CheckIcon /> : null}
                        </span>
                        <span className="item-body">
                          <span className="item-name">
                            {item.name}
                            {item.future && <span className="pill future">Future</span>}
                            {item.kind === 'bundle' && (
                              <span className="pill">Bundle</span>
                            )}
                          </span>
                          {item.description && (
                            <p className="item-desc">{item.description}</p>
                          )}
                          {item.features && (
                            <div className="feature-list">
                              {item.features.map((feature) => {
                                const isFuture = futureFeatures.includes(feature)
                                return (
                                  <span
                                    key={feature}
                                    className={`feature${isFuture ? ' future' : ''}`}
                                  >
                                    {feature}
                                    {isFuture ? ' · Future' : ''}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </span>
                        <span className="item-price">
                          {formatUsd(item.basePrice)}
                          <br />
                          {periodLabel(item)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <aside className="panel summary">
          <div className="panel-head">
            <h2>Order summary</h2>
            <span className="category-meta">
              {quote.purchaseCount} purchase
              {quote.purchaseCount === 1 ? '' : 's'}
            </span>
          </div>

          {quote.lineItems.length === 0 ? (
            <p className="summary-empty">
              Select products from the catalog. You can add or remove anything
              after the order is started.
            </p>
          ) : (
            <>
              <ul className="order-lines">
                {quote.lineItems.map(({ item, listAmount, billedAmount }) => {
                  const isSupport = item.kind === 'support'
                  return (
                    <li className="order-line" key={item.id}>
                      <div>
                        <span className="order-line-name">{item.name}</span>
                        <span className="order-line-meta">
                          {item.category}
                          {isSupport ? ' · 3-month term' : ''}
                        </span>
                      </div>
                      <span className="order-line-price">
                        {isSupport && billedAmount !== listAmount ? (
                          <>
                            <span className="strike">{formatUsd(listAmount)}</span>
                            {formatUsd(billedAmount)}
                          </>
                        ) : (
                          formatUsd(billedAmount)
                        )}
                        <span className="order-line-meta">
                          {isSupport ? '/ qtr' : '/ yr'}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="totals">
                {hasProducts && (
                  <>
                    <div className="total-row muted">
                      <span>
                        Products subtotal
                        {quote.companyMultiplier > 1
                          ? ` (${quote.companySizeLabel})`
                          : ''}
                      </span>
                      <span>{formatUsd(quote.productSubtotal)}</span>
                    </div>

                    {quote.discountRate > 0 ? (
                      <div className="total-row discount">
                        <span>
                          Volume discount ({formatPercent(quote.discountRate)})
                        </span>
                        <span>−{formatUsd(quote.discountAmount)}</span>
                      </div>
                    ) : quote.supportBundled ? (
                      <div className="total-row muted">
                        <span>Volume discount</span>
                        <span>Waived (support credit)</span>
                      </div>
                    ) : (
                      <div className="total-row muted">
                        <span>Volume discount</span>
                        <span>None</span>
                      </div>
                    )}

                    <div className={`total-row${hasSupport ? '' : ' grand'}`}>
                      <span>Products annual total</span>
                      <span>{formatUsd(quote.productTotal)}</span>
                    </div>
                  </>
                )}

                {hasSupport && quote.supportLineItem && (
                  <>
                    {hasProducts && <div className="totals-divider" />}

                    <div className="total-row muted">
                      <span>Support engagement (list)</span>
                      <span>
                        {formatUsd(quote.supportListQuarterly)}
                        /qtr
                      </span>
                    </div>

                    {quote.supportCreditAmount > 0 ? (
                      <div className="total-row discount">
                        <span>
                          Support credit ({formatPercent(quote.supportCreditRate)})
                        </span>
                        <span>−{formatUsd(quote.supportCreditAmount)}</span>
                      </div>
                    ) : null}

                    <div className="total-row grand">
                      <span>Support / quarter</span>
                      <span>{formatUsd(quote.supportTotalQuarterly)}</span>
                    </div>
                  </>
                )}

                {!hasSupport && hasProducts && (
                  <div className="total-row muted">
                    <span>Effective / quarter</span>
                    <span>{formatUsd(quote.productTotal / 4)}</span>
                  </div>
                )}
              </div>

              <p className="footnote">
                Support is billed on 3-month engagements only and is never
                annualized. When support is sold with other purchases, volume
                discount is waived: 20% credit with 1 purchase, 25% with 2+.
              </p>

              <button
                type="button"
                className="clear-btn"
                onClick={() => setSelectedIds([])}
              >
                Clear order
              </button>
            </>
          )}
        </aside>
      </div>

      <section className="rules">
        <div className="rule">
          <h4>2 purchases</h4>
          <p>20% off product total</p>
        </div>
        <div className="rule">
          <h4>3 purchases</h4>
          <p>25% off product total</p>
        </div>
        <div className="rule">
          <h4>4+ purchases</h4>
          <p>30% off product total</p>
        </div>
        <div className="rule">
          <h4>Support + products</h4>
          <p>No volume discount. 20% with 1 purchase, 25% with 2+.</p>
        </div>
      </section>
    </div>
  )
}
