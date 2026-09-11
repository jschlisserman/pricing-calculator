import { useEffect, useMemo, useState } from 'react'
import {
  AGENCY_PASS_THROUGH_BANDS,
  CATALOG,
  CATEGORY_ORDER,
  DESIGN_PARTNER_ID,
  DPP_HEADCOUNT_BANDS,
  DPP_USAGE_REFERENCE_ANNUAL,
  HEADCOUNT_BANDS,
  PLATFORM_ID,
  PLATFORM_PACKAGES,
  PLATFORM_USAGE_METRICS,
  PLATFORM_USAGE_REFERENCE_ANNUAL,
  buildQuote,
  defaultDppUsageConfig,
  defaultPlatformConfig,
  dppUsageConfigFromEmployees,
  formatMultiplier,
  formatPercent,
  formatUnitCost,
  formatUsd,
  getCatalogListAmount,
  getDppAnnualFee,
  getPlatformListPrice,
  hasSelfHostedDeployment,
  isDeploymentExclusiveGated,
  isDeploymentId,
  isDppEligible,
  isGatedBySelfHosted,
  isProgramExclusiveGated,
  isProgramId,
  platformConfigFromPackage,
  withoutSelfHostedGatedItems,
  type CatalogItem,
  type DppUsageConfig,
  type PlatformConfig,
  type PlatformPackageId,
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
  if (category === 'Deployment') return 'Pick one'
  if (category === 'Collaboration') {
    return 'Individual SKUs'
  }
  if (category === 'Security and Controls' || category === 'Agent Learning') {
    return 'Bundle'
  }
  if (category === 'Support') return '3-month terms'
  if (category === 'Programs') return 'Pick one'
  return 'Exclusive'
}

export default function App() {
  const [employees, setEmployees] = useState(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(50),
  )
  const [dppUsageConfig, setDppUsageConfig] = useState<DppUsageConfig>(() =>
    defaultDppUsageConfig(50),
  )

  useEffect(() => {
    if (!isDppEligible(employees)) {
      setSelectedIds((prev) => prev.filter((id) => id !== DESIGN_PARTNER_ID))
    }
  }, [employees])

  useEffect(() => {
    setPlatformConfig((prev) => {
      const scaled = platformConfigFromPackage(prev.packageId, employees)
      return { ...scaled, additional: prev.additional }
    })
    setDppUsageConfig((prev) => {
      const scaled = dppUsageConfigFromEmployees(employees)
      return { ...scaled, additional: prev.additional }
    })
  }, [employees])

  const quote = useMemo(
    () =>
      buildQuote(
        selectedIds,
        Number.isFinite(employees) ? employees : 0,
        platformConfig,
        dppUsageConfig,
      ),
    [selectedIds, employees, platformConfig, dppUsageConfig],
  )

  const platformSelected = selectedIds.includes(PLATFORM_ID)
  const dppSelected = selectedIds.includes(DESIGN_PARTNER_ID)
  const platformListPrice = getPlatformListPrice(
    Number.isFinite(employees) ? employees : 0,
  )
  const dppAnnualFee = getDppAnnualFee(
    Number.isFinite(employees) ? employees : 0,
  )
  const usageScale = platformListPrice / PLATFORM_USAGE_REFERENCE_ANNUAL
  const dppUsageScale =
    dppAnnualFee > 0 ? dppAnnualFee / DPP_USAGE_REFERENCE_ANNUAL : 0
  const selfHostedSelected = hasSelfHostedDeployment(selectedIds)

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
      const isProgram = isProgramId(id)
      const already = prev.includes(id)

      if (already) {
        return prev.filter((x) => x !== id)
      }

      if (isProgramExclusiveGated(id, prev)) {
        return prev
      }

      if (isDeploymentExclusiveGated(id, prev)) {
        return prev
      }

      if (isGatedBySelfHosted(id) && hasSelfHostedDeployment(prev)) {
        return prev
      }

      if (isSupport) {
        return withoutSelfHostedGatedItems([
          ...prev.filter((x) => !SUPPORT_IDS.has(x)),
          id,
        ])
      }

      if (isProgram) {
        return withoutSelfHostedGatedItems([
          ...prev.filter((x) => !isProgramId(x)),
          id,
        ])
      }

      if (isDeploymentId(id)) {
        return withoutSelfHostedGatedItems([
          ...prev.filter((x) => !isDeploymentId(x)),
          id,
        ])
      }

      const next = [...prev, id]
      return withoutSelfHostedGatedItems(next)
    })
  }

  function removeItem(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  function setUsageAmount(metricId: string, value: string) {
    const parsed = Number(value.replace(/,/g, ''))
    setPlatformConfig((prev) => ({
      ...prev,
      additional: {
        ...prev.additional,
        [metricId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
      },
    }))
  }

  function setIncludeAmount(metricId: string, value: string) {
    const parsed = Number(value.replace(/,/g, ''))
    setPlatformConfig((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [metricId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
      },
    }))
  }

  function setDppUsageAmount(metricId: string, value: string) {
    const parsed = Number(value.replace(/,/g, ''))
    setDppUsageConfig((prev) => ({
      ...prev,
      additional: {
        ...prev.additional,
        [metricId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
      },
    }))
  }

  function setDppIncludeAmount(metricId: string, value: string) {
    const parsed = Number(value.replace(/,/g, ''))
    setDppUsageConfig((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [metricId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
      },
    }))
  }

  function selectPlatformPackage(packageId: PlatformPackageId) {
    setPlatformConfig(platformConfigFromPackage(packageId, employees))
  }

  function clearOrder() {
    setSelectedIds([])
    setPlatformConfig(defaultPlatformConfig(employees))
    setDppUsageConfig(defaultDppUsageConfig(employees))
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
                    const selfHostedGated =
                      isGatedBySelfHosted(item.id) && selfHostedSelected
                    const programGated =
                      isProgramExclusiveGated(item.id, selectedIds) &&
                      !selected
                    const deploymentGated =
                      isDeploymentExclusiveGated(item.id, selectedIds)
                    const unavailable =
                      dppUnavailable ||
                      selfHostedGated ||
                      programGated ||
                      deploymentGated
                    const futureFeatures = FUTURE_FEATURES[item.id] ?? []
                    const gateMessage = dppUnavailable
                      ? null
                      : selfHostedGated
                        ? 'Unavailable with Helm Chart or BYOC. Use Platform deployment instead.'
                        : programGated
                          ? isProgramId(item.id)
                            ? 'Programs cannot be combined with other purchases.'
                            : 'Other options are unavailable while a program is selected.'
                          : deploymentGated
                            ? 'Deselect the current Deployment option to choose a different one.'
                            : null

                    return (
                      <div
                        key={item.id}
                        className={`item-wrap${(isPlatform || isDpp) && selected ? ' open' : ''}`}
                      >
                        <button
                          type="button"
                          className={`item${selected ? ' selected' : ''}${isSupport || item.kind === 'program' || isDeploymentId(item.id) ? ' radio' : ''}${unavailable ? ' unavailable' : ''}`}
                          onClick={() => {
                            if (unavailable) return
                            toggleItem(item.id)
                          }}
                          aria-pressed={selected}
                          aria-disabled={unavailable}
                          disabled={unavailable}
                        >
                          <span className="check" aria-hidden="true">
                            {selected &&
                            !(
                              isSupport ||
                              item.kind === 'program' ||
                              isDeploymentId(item.id)
                            ) ? (
                              <CheckIcon />
                            ) : null}
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
                              {selfHostedGated && (
                                <span className="pill">Not with Helm/BYOC</span>
                              )}
                              {deploymentGated && (
                                <span className="pill">Pick one</span>
                              )}
                              {programGated && (
                                <span className="pill">
                                  {isProgramId(item.id)
                                    ? 'Exclusive'
                                    : 'Program selected'}
                                </span>
                              )}
                            </span>
                            {gateMessage && (
                              <p className="item-desc">{gateMessage}</p>
                            )}
                            {!gateMessage && item.description && (
                              <p className="item-desc">{item.description}</p>
                            )}
                            {item.features && !gateMessage && (
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
                            {unavailable ? (
                              '—'
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
                            {(selfHostedGated ||
                              programGated ||
                              deploymentGated) && (
                              <>
                                <br />
                                Gated
                              </>
                            )}
                          </span>
                        </button>

                        {isPlatform && selected && (
                          <div className="platform-usage">
                            <p className="platform-usage-intro">
                              Package includes are authored for a{' '}
                              {formatUsd(PLATFORM_USAGE_REFERENCE_ANNUAL)}
                              /year Platform reference and scale with headcount
                              (currently {formatUsd(platformListPrice)}
                              /year, {usageScale.toFixed(2)}×). Enter{' '}
                              <strong>additional</strong> volume beyond package
                              includes to bill at unit cost.
                            </p>

                            <div className="platform-package-toggles">
                              {PLATFORM_PACKAGES.map((pkg) => (
                                <button
                                  key={pkg.id}
                                  type="button"
                                  className={`platform-package-toggle${
                                    platformConfig.packageId === pkg.id
                                      ? ' active'
                                      : ''
                                  }`}
                                  onClick={() => selectPlatformPackage(pkg.id)}
                                >
                                  {pkg.name}
                                </button>
                              ))}
                            </div>

                            <div className="platform-base-row">
                              <span>Platform base (by headcount)</span>
                              <strong>{formatUsd(platformListPrice)}/yr</strong>
                            </div>

                            <div className="platform-usage-table package-table">
                              <div className="platform-usage-head package-head">
                                <span>Meter</span>
                                <span>Package include</span>
                                <span>Additional</span>
                                <span>Unit cost</span>
                                <span>Overage</span>
                              </div>
                              {PLATFORM_USAGE_METRICS.map((metric) => {
                                const included =
                                  platformConfig.includes[metric.id] ?? 0
                                const additional =
                                  platformConfig.additional[metric.id] ?? 0
                                const lineCost = additional * metric.unitCost
                                return (
                                  <div
                                    className="platform-usage-row package-row"
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
                                      value={included}
                                      onChange={(e) =>
                                        setIncludeAmount(
                                          metric.id,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`Package include ${metric.name}`}
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={additional}
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

                        {isDpp && selected && !unavailable && (
                          <div className="platform-usage">
                            <p className="platform-usage-intro">
                              Design Partner usage package is authored for a{' '}
                              {formatUsd(DPP_USAGE_REFERENCE_ANNUAL)}
                              /year DPP reference and scales with the DPP fee
                              (currently {formatUsd(dppAnnualFee)}
                              /year, {dppUsageScale.toFixed(2)}×). Enter{' '}
                              <strong>additional</strong> volume beyond package
                              includes to bill at unit cost.
                            </p>

                            <div className="platform-base-row">
                              <span>DPP fee (by headcount)</span>
                              <strong>{formatUsd(dppAnnualFee)}/yr</strong>
                            </div>

                            <div className="platform-usage-table package-table">
                              <div className="platform-usage-head package-head">
                                <span>Meter</span>
                                <span>Package include</span>
                                <span>Additional</span>
                                <span>Unit cost</span>
                                <span>Overage</span>
                              </div>
                              {PLATFORM_USAGE_METRICS.map((metric) => {
                                const included =
                                  dppUsageConfig.includes[metric.id] ?? 0
                                const additional =
                                  dppUsageConfig.additional[metric.id] ?? 0
                                const lineCost = additional * metric.unitCost
                                return (
                                  <div
                                    className="platform-usage-row package-row"
                                    key={metric.id}
                                  >
                                    <div className="platform-usage-label">
                                      <span>{metric.name}</span>
                                    </div>
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={included}
                                      onChange={(e) =>
                                        setDppIncludeAmount(
                                          metric.id,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`DPP package include ${metric.name}`}
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={additional}
                                      onChange={(e) =>
                                        setDppUsageAmount(
                                          metric.id,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`DPP additional ${metric.name}`}
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
                  const isDpp = item.id === DESIGN_PARTNER_ID
                  return (
                    <li className="order-line" key={item.id}>
                      <div>
                        <span className="order-line-name">{item.name}</span>
                        <span className="order-line-meta">
                          {item.category}
                          {isSupport
                            ? ' · 3-month term'
                            : isPlatform && quote.platformPackageName
                              ? ` · ${quote.platformPackageName}`
                              : isDpp
                                ? ' · usage package'
                                : ''}
                        </span>
                        {isPlatform && (
                          <ul className="usage-breakdown">
                            <li>
                              Base price: {formatUsd(quote.platformBasePrice)}
                              {quote.platformPackageName
                                ? ` · ${quote.platformPackageName}`
                                : ''}
                            </li>
                            {PLATFORM_USAGE_METRICS.map((metric) => {
                              const included =
                                quote.platformIncludes[metric.id] ?? 0
                              if (included <= 0) return null
                              return (
                                <li key={`include-${metric.id}`}>
                                  Include {metric.name}:{' '}
                                  {included.toLocaleString('en-US')}
                                </li>
                              )
                            })}
                            {quote.platformUsageLines.map((line) => (
                              <li key={line.metric.id}>
                                Additional {line.metric.name}:{' '}
                                {line.additionalAmount.toLocaleString('en-US')} ×{' '}
                                {formatUnitCost(line.metric.unitCost)} ={' '}
                                {formatUsd(line.cost)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isDpp && (
                          <ul className="usage-breakdown">
                            <li>DPP fee: {formatUsd(billedAmount)}</li>
                            {PLATFORM_USAGE_METRICS.map((metric) => {
                              const included =
                                quote.dppIncludes[metric.id] ?? 0
                              if (included <= 0) return null
                              return (
                                <li key={`dpp-include-${metric.id}`}>
                                  Include {metric.name}:{' '}
                                  {included.toLocaleString('en-US')}
                                </li>
                              )
                            })}
                            {quote.dppUsageLines.map((line) => (
                              <li key={`dpp-${line.metric.id}`}>
                                Additional {line.metric.name}:{' '}
                                {line.additionalAmount.toLocaleString('en-US')} ×{' '}
                                {formatUnitCost(line.metric.unitCost)} ={' '}
                                {formatUsd(line.cost)}
                              </li>
                            ))}
                          </ul>
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
                        ) : isDpp ? (
                          formatUsd(billedAmount + quote.dppOverageTotal)
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
                  <>
                    <div className="total-row muted">
                      <span>Platform base</span>
                      <span>{formatUsd(quote.platformBasePrice)}</span>
                    </div>
                    <div className="total-row muted">
                      <span>Platform overage</span>
                      <span>{formatUsd(quote.platformOverageTotal)}</span>
                    </div>
                    <div className="total-row muted">
                      <span>Platform total</span>
                      <span>{formatUsd(quote.platformUsageTotal)}</span>
                    </div>
                  </>
                )}

                {dppSelected && (
                  <div className="total-row muted">
                    <span>DPP usage overage</span>
                    <span>{formatUsd(quote.dppOverageTotal)}</span>
                  </div>
                )}

                {(hasProducts || platformSelected || dppSelected) && (
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

                {!hasSupport && (hasProducts || platformSelected || dppSelected) && (
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
