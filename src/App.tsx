import { useEffect, useMemo, useState } from 'react'
import {
  AGENCY_PASS_THROUGH_BANDS,
  CATALOG,
  CATEGORY_ORDER,
  DESIGN_PARTNER_ID,
  DPP_HEADCOUNT_BANDS,
  HEADCOUNT_BANDS,
  PLATFORM_ID,
  PLATFORM_USAGE_METRICS,
  buildQuote,
  emptyPlatformUsage,
  formatMultiplier,
  formatPercent,
  formatUnitCost,
  formatUsd,
  getCatalogListAmount,
  isDppEligible,
  type CatalogItem,
  type PlatformUsageAmounts,
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
  const [platformUsage, setPlatformUsage] =
    useState<PlatformUsageAmounts>(emptyPlatformUsage)

  useEffect(() => {
    if (!isDppEligible(employees)) {
      setSelectedIds((prev) => prev.filter((id) => id !== DESIGN_PARTNER_ID))
    }
  }, [employees])

  const quote = useMemo(
    () =>
      buildQuote(
        selectedIds,
        Number.isFinite(employees) ? employees : 0,
        platformUsage,
      ),
    [selectedIds, employees, platformUsage],
  )

  const platformSelected = selectedIds.includes(PLATFORM_ID)

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

  function setUsageAmount(metricId: string, value: string) {
    const parsed = Number(value.replace(/,/g, ''))
    setPlatformUsage((prev) => ({
      ...prev,
      [metricId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }))
  }

  function clearOrder() {
    setSelectedIds([])
    setPlatformUsage(emptyPlatformUsage())
  }

  const hasProducts = quote.productLineItems.length > 0
  const hasSupport = quote.supportLineItem !== null
  const hasOrder = quote.lineItems.length > 0

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
          Select products against Growth-band list pricing, then scale by
          headcount band. Volume discounts apply across product purchases;
          support is a separate quarterly engagement.
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
                <strong>
                  {formatMultiplier(
                    quote.companyMultiplier,
                    quote.companyCustom,
                  )}
                </strong>
              </div>
            </div>
            <p className="size-hint">
              Growth (25–99) is 1.0x list. Startup is 0.5x; larger bands scale up
              to an 8.0x floor for Global+.
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
                    const isDpp = item.id === DESIGN_PARTNER_ID
                    const isPlatform = item.id === PLATFORM_ID
                    const dppUnavailable = isDpp && !quote.dppEligible
                    const futureFeatures = FUTURE_FEATURES[item.id] ?? []

                    return (
                      <div
                        key={item.id}
                        className={`item-wrap${isPlatform && selected ? ' open' : ''}`}
                      >
                        <button
                          type="button"
                          className={`item${selected ? ' selected' : ''}${isSupport ? ' radio' : ''}${dppUnavailable ? ' unavailable' : ''}`}
                          onClick={() => {
                            if (dppUnavailable) return
                            toggleItem(item.id)
                          }}
                          aria-pressed={selected}
                          aria-disabled={dppUnavailable}
                          disabled={dppUnavailable}
                        >
                          <span className="check" aria-hidden="true">
                            {selected && !isSupport ? <CheckIcon /> : null}
                          </span>
                          <span className="item-body">
                            <span className="item-name">
                              {item.name}
                              {item.future && (
                                <span className="pill future">Future</span>
                              )}
                              {item.kind === 'bundle' && (
                                <span className="pill">Bundle</span>
                              )}
                              {isPlatform && (
                                <span className="pill">Usage</span>
                              )}
                              {dppUnavailable && (
                                <span className="pill">Not offered</span>
                              )}
                            </span>
                            {item.description && (
                              <p className="item-desc">{item.description}</p>
                            )}
                            {item.features && (
                              <div className="feature-list">
                                {item.features.map((feature) => {
                                  const isFuture =
                                    futureFeatures.includes(feature)
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
                            {dppUnavailable ? (
                              '—'
                            ) : isPlatform ? (
                              <>
                                Metered
                                <br />
                                usage
                              </>
                            ) : (
                              <>
                                {formatUsd(
                                  getCatalogListAmount(item, employees),
                                )}
                                <br />
                                {periodLabel(item)}
                              </>
                            )}
                            {dppUnavailable && (
                              <>
                                <br />
                                Enterprise+
                              </>
                            )}
                            {isDpp && quote.dppMultiplier != null && (
                              <>
                                <br />
                                <span className="item-price-note">
                                  DPP {formatMultiplier(quote.dppMultiplier)}
                                </span>
                              </>
                            )}
                          </span>
                        </button>

                        {isPlatform && selected && (
                          <div className="platform-usage">
                            <p className="platform-usage-intro">
                              Enter <strong>additional</strong> volume only.
                              First 1,000,000 observability events and first 250
                              CPU hours are included free.
                            </p>
                            <div className="platform-usage-table">
                              <div className="platform-usage-head">
                                <span>Meter</span>
                                <span>Additional amount</span>
                                <span>Unit cost</span>
                                <span>Line cost</span>
                              </div>
                              {PLATFORM_USAGE_METRICS.map((metric) => {
                                const amount = platformUsage[metric.id] ?? 0
                                const lineCost = amount * metric.unitCost
                                return (
                                  <div
                                    className="platform-usage-row"
                                    key={metric.id}
                                  >
                                    <div className="platform-usage-label">
                                      <span>{metric.name}</span>
                                      {metric.includedNote && (
                                        <span className="platform-usage-note">
                                          {metric.includedNote}
                                        </span>
                                      )}
                                    </div>
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={amount}
                                      onChange={(e) =>
                                        setUsageAmount(metric.id, e.target.value)
                                      }
                                      aria-label={`Additional ${metric.name}`}
                                    />
                                    <span className="platform-usage-unit">
                                      {formatUnitCost(metric.unitCost)}
                                      <span className="platform-usage-note">
                                        / {metric.unitLabel}
                                      </span>
                                    </span>
                                    <span className="platform-usage-cost">
                                      {formatUsd(lineCost)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
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

          {hasOrder ? (
            <>
              <ul className="order-lines">
                {quote.lineItems.map(({ item, listAmount, billedAmount }) => {
                  const isSupport = item.kind === 'support'
                  const isPlatform = item.id === PLATFORM_ID
                  return (
                    <li className="order-line" key={item.id}>
                      <div>
                        <span className="order-line-name">{item.name}</span>
                        <span className="order-line-meta">
                          {item.category}
                          {isSupport
                            ? ' · 3-month term'
                            : isPlatform
                              ? ' · usage-based'
                              : item.id === DESIGN_PARTNER_ID &&
                                  quote.dppMultiplier != null
                                ? ` · DPP ${formatMultiplier(quote.dppMultiplier)}`
                                : ''}
                        </span>
                        {isPlatform && quote.platformUsageLines.length > 0 && (
                          <ul className="usage-breakdown">
                            {quote.platformUsageLines.map((line) => (
                              <li key={line.metric.id}>
                                {line.metric.name}:{' '}
                                {line.additionalAmount.toLocaleString('en-US')} ×{' '}
                                {formatUnitCost(line.metric.unitCost)} ={' '}
                                {formatUsd(line.cost)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isPlatform &&
                          quote.platformUsageLines.length === 0 && (
                            <span className="order-line-meta">
                              No additional usage entered
                            </span>
                          )}
                      </div>
                      <span className="order-line-price">
                        {isSupport && billedAmount !== listAmount ? (
                          <>
                            <span className="strike">{formatUsd(listAmount)}</span>
                            {formatUsd(billedAmount)}
                          </>
                        ) : isPlatform ? (
                          formatUsd(quote.platformUsageTotal)
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
                        {quote.companyMultiplier !== 1
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

                    <div className="total-row muted">
                      <span>Products after discount</span>
                      <span>{formatUsd(quote.productTotal)}</span>
                    </div>
                  </>
                )}

                {platformSelected && (
                  <div className="total-row muted">
                    <span>Platform usage</span>
                    <span>{formatUsd(quote.platformUsageTotal)}</span>
                  </div>
                )}

                {(hasProducts || platformSelected) && (
                  <div className={`total-row${hasSupport ? '' : ' grand'}`}>
                    <span>Annual total</span>
                    <span>{formatUsd(quote.annualTotal)}</span>
                  </div>
                )}

                {hasSupport && quote.supportLineItem && (
                  <>
                    {(hasProducts || platformSelected) && (
                      <div className="totals-divider" />
                    )}

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

                {!hasSupport && (hasProducts || platformSelected) && (
                  <div className="total-row muted">
                    <span>Effective / quarter</span>
                    <span>{formatUsd(quote.annualTotal / 4)}</span>
                  </div>
                )}
              </div>

              <p className="footnote">
                Support is billed on 3-month engagements only and is never
                annualized. When support is sold with other purchases, volume
                discount is waived: 15% credit with 1 purchase, 20% with 2+.
                Platform usage is metered separately and is not volume-discounted.
              </p>

              <button
                type="button"
                className="clear-btn"
                onClick={clearOrder}
              >
                Clear order
              </button>
            </>
          ) : (
            <p className="summary-empty">
              Select products from the catalog. You can add or remove anything
              after the order is started.
            </p>
          )}
        </aside>
      </div>

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
          <h4>Support + products</h4>
          <p>No volume discount. 15% with 1 purchase, 20% with 2+.</p>
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
                    band.id === quote.companyBandId ? 'active-band' : undefined
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
                    band.id === quote.dppBandId ? 'active-band' : undefined
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
          bands.
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
                    band.id === quote.companyBandId ? 'active-band' : undefined
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
