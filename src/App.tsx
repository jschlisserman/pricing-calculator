import { useEffect, useMemo, useState } from 'react'
import {
  AUDIT_ID,
  CONCIERGE_AUDIT_BANDS,
  CONCIERGE_PATH1_ADVISORY_BANDS,
  CONCIERGE_PATH1_HANDS_ON_BANDS,
  CONCIERGE_PATH2_BANDS,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  PATH1_TIERS,
  PATH1_WEEKS_PER_QUARTER,
  PATH2_PACKAGES,
  buildConciergeMargin,
  buildConciergeQuote,
  getAuditFee,
  getPath1ImpliedHourly,
  getPath1QuarterlyList,
  getPath2Floor,
  isConciergeId,
  isPath1Id,
  isPath2Id,
  withoutOtherPath1Tiers,
  type Path1Mode,
  type Path2Hours,
  type Path2PackageId,
  type Path2ScopedPrices,
} from './concierge'
import {
  AGENCY_PASS_THROUGH_BANDS,
  BYOC_ID,
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
  buildPlatformMargin,
  hasSelfHostedDeployment,
  isDeploymentExclusiveGated,
  isDeploymentId,
  isDeploymentRequiredGated,
  isDppEligible,
  isGatedBySelfHosted,
  isProgramExclusiveGated,
  isProgramId,
  platformConfigFromPackage,
  withoutDeploymentRequiredItems,
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
  if (category === 'Deployment') return 'Pick one · required for packages'
  if (category === 'Collaboration') {
    return 'Requires Deployment'
  }
  if (category === 'Security and Controls' || category === 'Agent Learning') {
    return 'Bundle · requires Deployment'
  }
  if (category === 'Programs') return 'Pick one · gated by Deployment'
  return 'Exclusive'
}

function path1ModeLabel(mode: Path1Mode): string {
  return mode === 'hands-on' ? 'Hands-On' : 'Advisory'
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
  const [path1Mode, setPath1Mode] = useState<Path1Mode>('advisory')
  const [path2ScopedPrices, setPath2ScopedPrices] = useState<Path2ScopedPrices>(
    {},
  )
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [engineerCostPerHour, setEngineerCostPerHour] = useState(
    DEFAULT_ENGINEER_COST_PER_HOUR,
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

  const concierge = useMemo(
    () =>
      buildConciergeQuote(
        selectedIds,
        Number.isFinite(employees) ? employees : 0,
        path1Mode,
        path2ScopedPrices,
        quote.productPurchaseCount,
      ),
    [
      selectedIds,
      employees,
      path1Mode,
      path2ScopedPrices,
      quote.productPurchaseCount,
    ],
  )

  const margin = useMemo(
    () => buildConciergeMargin(concierge, engineerCostPerHour, path2Hours),
    [concierge, engineerCostPerHour, path2Hours],
  )

  const platformSelected = selectedIds.includes(PLATFORM_ID)
  const platformMargin = useMemo(() => {
    if (!platformSelected) return null
    return buildPlatformMargin(
      quote.platformBasePrice,
      quote.platformIncludes,
      platformConfig.additional,
    )
  }, [
    platformSelected,
    quote.platformBasePrice,
    quote.platformIncludes,
    platformConfig.additional,
  ])

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
  const headcount = Number.isFinite(employees) ? employees : 0
  const selectedPath1Id = selectedIds.find(isPath1Id)
  const hasPath2Selected = selectedIds.some(isPath2Id)
  const auditSelected = selectedIds.includes(AUDIT_ID)
  const hasConcierge =
    concierge.path1 != null ||
    concierge.path2.length > 0 ||
    concierge.audit != null
  const hasProducts = quote.productLineItems.length > 0
  const hasOrder = quote.lineItems.length > 0 || hasConcierge

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
      const already = prev.includes(id)

      if (already) {
        const next = prev.filter((x) => x !== id)
        if (isDeploymentId(id)) {
          return withoutDeploymentRequiredItems(next)
        }
        return next
      }

      if (isProgramExclusiveGated(id, prev)) {
        return prev
      }

      if (isDeploymentExclusiveGated(id, prev)) {
        return prev
      }

      if (isDeploymentRequiredGated(id, prev)) {
        return prev
      }

      if (isGatedBySelfHosted(id) && hasSelfHostedDeployment(prev)) {
        return prev
      }

      if (isConciergeId(id)) {
        if (isPath1Id(id)) {
          return withoutSelfHostedGatedItems(
            withoutOtherPath1Tiers([...prev, id], id),
          )
        }

        if (isPath2Id(id)) {
          const next = prev.includes(AUDIT_ID)
            ? [...prev, id]
            : [...prev, id, AUDIT_ID]
          return withoutSelfHostedGatedItems(next)
        }

        return withoutSelfHostedGatedItems([...prev, id])
      }

      if (isProgramId(id)) {
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

      return withoutSelfHostedGatedItems([...prev, id])
    })
  }

  function removeItem(id: string) {
    setSelectedIds((prev) => {
      const next = prev.filter((x) => x !== id)
      if (isDeploymentId(id)) {
        return withoutDeploymentRequiredItems(next)
      }
      return next
    })
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

  function setScopedPrice(packageId: Path2PackageId, value: string) {
    const trimmed = value.trim()
    if (trimmed === '') {
      setPath2ScopedPrices((prev) => {
        const next = { ...prev }
        delete next[packageId]
        return next
      })
      return
    }
    const parsed = Number(trimmed.replace(/,/g, ''))
    setPath2ScopedPrices((prev) => ({
      ...prev,
      [packageId]: Number.isFinite(parsed) ? Math.max(0, parsed) : null,
    }))
  }

  function setPath2DeliveryHours(packageId: Path2PackageId, value: string) {
    const trimmed = value.trim()
    if (trimmed === '') {
      setPath2Hours((prev) => {
        const next = { ...prev }
        delete next[packageId]
        return next
      })
      return
    }
    const parsed = Number(trimmed.replace(/,/g, ''))
    setPath2Hours((prev) => ({
      ...prev,
      [packageId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }))
  }

  function clearOrder() {
    setSelectedIds([])
    setPlatformConfig(defaultPlatformConfig(employees))
    setDppUsageConfig(defaultDppUsageConfig(employees))
    setPath1Mode('advisory')
    setPath2ScopedPrices({})
    setPath2Hours({})
    setEngineerCostPerHour(DEFAULT_ENGINEER_COST_PER_HOUR)
  }

  const auditFee = getAuditFee(headcount)

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
          headcount band. Package volume discounts and Concierge discounts run
          on parallel ladders — packages keep their volume rate; Concierge
          discounts when sold alongside packages.
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
                    const needsDeploymentGated =
                      isDeploymentRequiredGated(item.id, selectedIds)
                    const unavailable =
                      dppUnavailable ||
                      selfHostedGated ||
                      programGated ||
                      deploymentGated ||
                      needsDeploymentGated
                    const futureFeatures = FUTURE_FEATURES[item.id] ?? []
                    const gateMessage = dppUnavailable
                      ? null
                      : selfHostedGated
                        ? 'Unavailable with Helm Chart, Self-Hosted, or BYOC. Use Platform deployment instead.'
                        : needsDeploymentGated
                          ? 'Select a Deployment option first.'
                          : programGated
                            ? isProgramId(item.id)
                              ? selectedIds.includes(BYOC_ID)
                                ? 'Unavailable with BYOC unless explicit permission is given. Agency and Design Partner are otherwise deployment-agnostic.'
                                : 'Unavailable while a Deployment is selected. Agency and Design Partner are deployment-agnostic, but BYOC is not offered with either unless explicit permission is given.'
                              : isDeploymentId(item.id)
                                ? item.id === BYOC_ID
                                  ? 'BYOC is not offered with Agency or Design Partner unless explicit permission is given.'
                                  : 'Unavailable while a Program is selected.'
                                : 'Unavailable while a Program is selected.'
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
                          className={`item${selected ? ' selected' : ''}${item.kind === 'program' || isDeploymentId(item.id) ? ' radio' : ''}${unavailable ? ' unavailable' : ''}`}
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
                                <span className="pill">
                                  Not with Helm/Self-Hosted/BYOC
                                </span>
                              )}
                              {needsDeploymentGated && (
                                <span className="pill">Needs Deployment</span>
                              )}
                              {deploymentGated && (
                                <span className="pill">Pick one</span>
                              )}
                              {programGated && (
                                <span className="pill">
                                  {isProgramId(item.id)
                                    ? 'Not with Deployment'
                                    : item.id === BYOC_ID
                                      ? 'Needs permission'
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
                              deploymentGated ||
                              needsDeploymentGated) && (
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

          <section className="category concierge-section">
            <div className="category-title">
              <h3>Concierge</h3>
              <span className="category-meta">Services</span>
            </div>

            <div className="concierge-subhead">
              <h4>Path 1 — Hours-based</h4>
              <p>Customer owns the outcome</p>
            </div>
            <div className="items">
              {PATH1_TIERS.map((tier) => {
                const selected = selectedPath1Id === tier.id
                const advisoryList = getPath1QuarterlyList(
                  tier,
                  'advisory',
                  headcount,
                )
                const advisoryHourly = getPath1ImpliedHourly(
                  advisoryList,
                  tier,
                )
                return (
                  <div
                    key={tier.id}
                    className={`item-wrap${selected ? ' open' : ''}`}
                  >
                    <button
                      type="button"
                      className={`item radio${selected ? ' selected' : ''}`}
                      onClick={() => {
                        toggleItem(tier.id)
                      }}
                      aria-pressed={selected}
                    >
                      <span className="check" aria-hidden="true" />
                      <span className="item-body">
                        <span className="item-name">
                          {tier.name}
                          <span className="pill">{tier.hoursPerWeek} hrs/wk</span>
                        </span>
                        <p className="item-desc">
                          Advisory {formatUsd(advisoryList)}/qtr ·{' '}
                          {formatUsd(Math.round(advisoryHourly))}/hr ·{' '}
                          {formatUsd(advisoryList * 4)}/yr annualized
                        </p>
                      </span>
                      <span className="item-price">
                        {formatUsd(advisoryList)}
                        <br />
                        / qtr
                      </span>
                    </button>

                    {selected && (
                      <div className="mode-picker" role="radiogroup" aria-label="Path 1 mode">
                        <button
                          type="button"
                          className={`mode-option${path1Mode === 'advisory' ? ' active' : ''}`}
                          role="radio"
                          aria-checked={path1Mode === 'advisory'}
                          onClick={() => setPath1Mode('advisory')}
                        >
                          <strong>Advisory</strong>
                          <span>
                            {formatUsd(advisoryList)}/qtr ·{' '}
                            {formatUsd(Math.round(advisoryHourly))}/hr
                          </span>
                          <span className="item-price-note">
                            {formatUsd(advisoryList * 4)} annualized
                          </span>
                        </button>
                        {(() => {
                          const handsOnList = getPath1QuarterlyList(
                            tier,
                            'hands-on',
                            headcount,
                          )
                          const handsOnHourly = getPath1ImpliedHourly(
                            handsOnList,
                            tier,
                          )
                          return (
                            <button
                              type="button"
                              className={`mode-option${path1Mode === 'hands-on' ? ' active' : ''}`}
                              role="radio"
                              aria-checked={path1Mode === 'hands-on'}
                              onClick={() => setPath1Mode('hands-on')}
                            >
                              <strong>Hands-On</strong>
                              <span>
                                {formatUsd(handsOnList)}/qtr ·{' '}
                                {formatUsd(Math.round(handsOnHourly))}/hr
                              </span>
                              <span className="item-price-note">
                                {formatUsd(handsOnList * 4)} annualized
                              </span>
                            </button>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="concierge-subhead">
              <h4>Path 2 — Outcome-based</h4>
              <p>Mastra owns the outcome</p>
            </div>
            <div className="items">
              {PATH2_PACKAGES.map((pkg) => {
                const selected = selectedIds.includes(pkg.id)
                const floor = getPath2Floor(pkg, headcount)
                const scoped = path2ScopedPrices[pkg.id]
                const isOverridden =
                  scoped != null && Number.isFinite(scoped) && scoped > 0
                return (
                  <div
                    key={pkg.id}
                    className={`item-wrap${selected ? ' open' : ''}`}
                  >
                    <button
                      type="button"
                      className={`item${selected ? ' selected' : ''}`}
                      onClick={() => {
                        toggleItem(pkg.id)
                      }}
                      aria-pressed={selected}
                    >
                      <span className="check" aria-hidden="true">
                        {selected ? <CheckIcon /> : null}
                      </span>
                      <span className="item-body">
                        <span className="item-name">
                          {pkg.name}
                          <span className="pill">Indicative floor</span>
                        </span>
                        <p className="item-desc">
                          Scaled floor for current headcount:{' '}
                          {formatUsd(floor)} one-time
                        </p>
                      </span>
                      <span className="item-price">
                        {formatUsd(floor)}
                        <br />
                        / one-time
                      </span>
                    </button>
                    {selected && (
                      <div className="scoped-price">
                        <label htmlFor={`scoped-${pkg.id}`}>
                          Scoped price (from Mastra Audit)
                        </label>
                        <input
                          id={`scoped-${pkg.id}`}
                          type="number"
                          min={0}
                          step={1000}
                          placeholder={String(floor)}
                          value={
                            path2ScopedPrices[pkg.id] != null
                              ? String(path2ScopedPrices[pkg.id])
                              : ''
                          }
                          onChange={(e) =>
                            setScopedPrice(pkg.id, e.target.value)
                          }
                        />
                        {isOverridden ? (
                          <span className="item-price-note">
                            Indicative floor: {formatUsd(floor)}
                          </span>
                        ) : (
                          <span className="item-price-note">
                            Outcome pricing is set by the Mastra Audit.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="concierge-subhead">
              <h4>Mastra Audit</h4>
              <p>One-time scoping fee</p>
            </div>
            <div className="items">
              <div className="item-wrap">
                <button
                  type="button"
                  className={`item${auditSelected ? ' selected' : ''}`}
                  onClick={() => {
                    toggleItem(AUDIT_ID)
                  }}
                  aria-pressed={auditSelected}
                >
                  <span className="check" aria-hidden="true">
                    {auditSelected ? <CheckIcon /> : null}
                  </span>
                  <span className="item-body">
                    <span className="item-name">Mastra Audit</span>
                    {hasPath2Selected && auditSelected && (
                      <p className="item-desc">
                        Audit scopes Path 2 outcome pricing for this engagement.
                      </p>
                    )}
                    {hasPath2Selected && !auditSelected && (
                      <p className="item-desc">
                        Audit can be deselected when already completed.
                      </p>
                    )}
                    {!hasPath2Selected && (
                      <p className="item-desc">
                        Fee for the current headcount band.
                      </p>
                    )}
                  </span>
                  <span className="item-price">
                    {formatUsd(auditFee)}
                    <br />
                    / one-time
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="panel summary">
          <div className="panel-head">
            <h2>Order summary</h2>
            <span className="category-meta">
              {quote.purchaseCount} purchase
              {quote.purchaseCount === 1 ? '' : 's'}
              {hasConcierge ? ' + Concierge' : ''}
            </span>
          </div>

          {hasOrder ? (
            <>
              {quote.lineItems.length > 0 && (
                <ul className="order-lines">
                  {quote.lineItems.map(({ item, billedAmount }) => {
                    const isPlatform = item.id === PLATFORM_ID
                    const isDpp = item.id === DESIGN_PARTNER_ID
                    return (
                      <li className="order-line" key={item.id}>
                        <div>
                          <span className="order-line-name">{item.name}</span>
                          <span className="order-line-meta">
                            {item.category}
                            {isPlatform && quote.platformPackageName
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
                                  {line.additionalAmount.toLocaleString('en-US')}{' '}
                                  × {formatUnitCost(line.metric.unitCost)} ={' '}
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
                                  {line.additionalAmount.toLocaleString('en-US')}{' '}
                                  × {formatUnitCost(line.metric.unitCost)} ={' '}
                                  {formatUsd(line.cost)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className="order-line-price">
                          {isPlatform
                            ? formatUsd(quote.platformUsageTotal)
                            : isDpp
                              ? formatUsd(billedAmount + quote.dppOverageTotal)
                              : formatUsd(billedAmount)}
                          <span className="order-line-meta">/ yr</span>
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
              )}

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
                  <div
                    className={`total-row${hasConcierge ? '' : ' grand'}`}
                  >
                    <span>Annual package total</span>
                    <span>{formatUsd(quote.annualTotal)}</span>
                  </div>
                )}

                {(hasProducts || platformSelected || dppSelected) &&
                  !hasConcierge && (
                    <div className="total-row muted">
                      <span>Effective / quarter</span>
                      <span>{formatUsd(quote.annualTotal / 4)}</span>
                    </div>
                  )}

                {hasConcierge && (
                  <>
                    {(hasProducts || platformSelected || dppSelected) && (
                      <div className="totals-divider" />
                    )}

                    {concierge.path1 && (
                      <ul className="order-lines">
                        <li className="order-line">
                          <div>
                            <span className="order-line-name">
                              Path 1 · {concierge.path1.tier.name}
                            </span>
                            <span className="order-line-meta">
                              {path1ModeLabel(concierge.path1.mode)} ·{' '}
                              {concierge.path1.tier.hoursPerWeek} hrs/wk
                            </span>
                            <span className="order-line-meta">
                              {formatUsd(
                                Math.round(concierge.path1.impliedHourly),
                              )}
                              /hr · {formatUsd(concierge.path1.annualized)}{' '}
                              annualized
                            </span>
                          </div>
                          <span className="order-line-price">
                            {concierge.discountRate > 0 &&
                            concierge.path1.billedAmount !==
                              concierge.path1.listAmount ? (
                              <>
                                <span className="strike">
                                  {formatUsd(concierge.path1.listAmount)}
                                </span>
                                {formatUsd(concierge.path1.billedAmount)}
                              </>
                            ) : (
                              formatUsd(concierge.path1.billedAmount)
                            )}
                            <span className="order-line-meta">/ qtr</span>
                          </span>
                          <button
                            type="button"
                            className="remove"
                            onClick={() => removeItem(concierge.path1!.tier.id)}
                            aria-label={`Remove Path 1 ${concierge.path1.tier.name}`}
                          >
                            <CloseIcon />
                          </button>
                        </li>
                      </ul>
                    )}

                    {concierge.path2.length > 0 && (
                      <ul className="order-lines">
                        {concierge.path2.map((line) => (
                          <li className="order-line" key={line.package.id}>
                            <div>
                              <span className="order-line-name">
                                Path 2 · {line.package.name}
                              </span>
                              <span className="order-line-meta">
                                {line.isOverridden
                                  ? `Scoped · floor ${formatUsd(line.floor)}`
                                  : 'Indicative floor'}
                              </span>
                            </div>
                            <span className="order-line-price">
                              {concierge.discountRate > 0 &&
                              line.billedAmount !== line.listAmount ? (
                                <>
                                  <span className="strike">
                                    {formatUsd(line.listAmount)}
                                  </span>
                                  {formatUsd(line.billedAmount)}
                                </>
                              ) : (
                                formatUsd(line.billedAmount)
                              )}
                              <span className="order-line-meta">
                                / one-time
                              </span>
                            </span>
                            <button
                              type="button"
                              className="remove"
                              onClick={() => removeItem(line.package.id)}
                              aria-label={`Remove ${line.package.name}`}
                            >
                              <CloseIcon />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {concierge.audit && (
                      <ul className="order-lines">
                        <li className="order-line">
                          <div>
                            <span className="order-line-name">Mastra Audit</span>
                            <span className="order-line-meta">One-time</span>
                          </div>
                          <span className="order-line-price">
                            {concierge.discountRate > 0 &&
                            concierge.audit.billedAmount !==
                              concierge.audit.listAmount ? (
                              <>
                                <span className="strike">
                                  {formatUsd(concierge.audit.listAmount)}
                                </span>
                                {formatUsd(concierge.audit.billedAmount)}
                              </>
                            ) : (
                              formatUsd(concierge.audit.billedAmount)
                            )}
                            <span className="order-line-meta">/ one-time</span>
                          </span>
                          <button
                            type="button"
                            className="remove"
                            onClick={() => removeItem(AUDIT_ID)}
                            aria-label="Remove Mastra Audit"
                          >
                            <CloseIcon />
                          </button>
                        </li>
                      </ul>
                    )}

                    {concierge.discountRate > 0 && (
                      <div className="total-row discount">
                        <span>
                          Concierge discount (
                          {formatPercent(concierge.discountRate)})
                        </span>
                        <span>−{formatUsd(concierge.discountAmount)}</span>
                      </div>
                    )}

                    {concierge.path1 && (
                      <div className="total-row grand">
                        <span>Concierge / quarter</span>
                        <span>{formatUsd(concierge.path1TotalQuarterly)}</span>
                      </div>
                    )}

                    {(concierge.path2.length > 0 || concierge.audit) && (
                      <div
                        className={`total-row${concierge.path1 ? '' : ' grand'}`}
                      >
                        <span>Concierge one-time</span>
                        <span>{formatUsd(concierge.oneTimeTotal)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="footnote">
                Concierge Path 1 is billed quarterly; Path 2 and Mastra Audit are
                one-time. Concierge discount (15% with 1 package, 20% with 2+)
                runs parallel to package volume discount — packages always keep
                their volume rate. Platform usage is metered separately and is
                not volume-discounted.
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
              Select products or Concierge from the catalog. You can add or
              remove anything after the order is started.
            </p>
          )}

          {platformSelected && platformMargin && (
            <div className="margin-panel">
              <div className="panel-head">
                <h2>Platform margin</h2>
              </div>
              <p className="item-desc">
                Base list price vs unit-cost value of package includes plus
                additional usage.
              </p>
              <div className="margin-row">
                <strong>Revenue</strong>
                <span>Platform base {formatUsd(platformMargin.revenue)}</span>
              </div>
              <div className="margin-row">
                <strong>Include cost</strong>
                <span>{formatUsd(platformMargin.includeCost)}</span>
                {platformMargin.includeLines.map((line) => (
                  <span key={`include-${line.metric.id}`}>
                    {line.metric.name}: {line.amount.toLocaleString('en-US')} ×{' '}
                    {formatUnitCost(line.metric.unitCost)} ={' '}
                    {formatUsd(line.cost)}
                  </span>
                ))}
                {platformMargin.includeLines.length === 0 && (
                  <span>No package includes</span>
                )}
              </div>
              <div className="margin-row">
                <strong>Additional usage cost</strong>
                <span>{formatUsd(platformMargin.additionalCost)}</span>
                {platformMargin.additionalLines.map((line) => (
                  <span key={`add-${line.metric.id}`}>
                    {line.metric.name}: {line.amount.toLocaleString('en-US')} ×{' '}
                    {formatUnitCost(line.metric.unitCost)} ={' '}
                    {formatUsd(line.cost)}
                  </span>
                ))}
                {platformMargin.additionalLines.length === 0 && (
                  <span>No additional usage</span>
                )}
              </div>
              <div className="margin-row">
                <strong>Total delivery cost</strong>
                <span>{formatUsd(platformMargin.totalCost)}</span>
              </div>
              <div className="margin-row">
                <strong>Margin</strong>
                <span>{formatUsd(platformMargin.margin)}</span>
                <span>
                  {platformMargin.marginRate != null
                    ? formatPercent(platformMargin.marginRate)
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {hasConcierge && (
            <div className="margin-panel">
              <div className="panel-head">
                <h2>Concierge margin</h2>
              </div>
              <div className="field">
                <label htmlFor="engineer-cost">
                  Fully loaded engineer $/hr
                </label>
                <input
                  id="engineer-cost"
                  type="number"
                  min={0}
                  step={1}
                  value={engineerCostPerHour}
                  onChange={(e) => {
                    const next = Number(e.target.value)
                    setEngineerCostPerHour(
                      Number.isFinite(next) ? Math.max(0, next) : 0,
                    )
                  }}
                />
              </div>
              <p className="item-desc">
                Path 1: quarterly revenue vs rate × hours/week ×{' '}
                {PATH1_WEEKS_PER_QUARTER} weeks. Path 2: one-time revenue vs rate
                × entered hours.
              </p>

              {concierge.path1 && (
                <div className="margin-row">
                  <strong>Path 1</strong>
                  <span>
                    {margin.path1HoursPerWeek} hrs/wk × {PATH1_WEEKS_PER_QUARTER}{' '}
                    wks = {margin.path1HoursPerQuarter} hrs/qtr
                  </span>
                  <span>
                    {margin.path1HoursPerQuarter} hrs ×{' '}
                    {formatUsd(margin.engineerCostPerHour)}/hr ={' '}
                    {formatUsd(margin.path1Cost)}
                  </span>
                  <span>Revenue {formatUsd(margin.path1Revenue)}/qtr</span>
                  <span>Margin {formatUsd(margin.path1Margin)}</span>
                  <span>
                    {margin.path1MarginRate != null
                      ? formatPercent(margin.path1MarginRate)
                      : '—'}
                  </span>
                </div>
              )}

              {margin.path2.map((row) => (
                <div className="margin-row" key={row.id}>
                  <strong>Path 2 · {row.name}</strong>
                  <label className="scoped-price">
                    Hours
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={path2Hours[row.id] ?? ''}
                      onChange={(e) =>
                        setPath2DeliveryHours(row.id, e.target.value)
                      }
                    />
                  </label>
                  <span>
                    {row.hours.toLocaleString('en-US')} hrs ×{' '}
                    {formatUsd(margin.engineerCostPerHour)}/hr ={' '}
                    {formatUsd(row.cost)}
                  </span>
                  <span>Revenue {formatUsd(row.revenue)}</span>
                  <span>Margin {formatUsd(row.margin)}</span>
                  <span>
                    {row.marginRate != null
                      ? formatPercent(row.marginRate)
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
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
                    band.id === quote.companyBandId ? 'active-band' : undefined
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
                    band.id === quote.companyBandId ? 'active-band' : undefined
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
          <h2>Concierge Path 2 — Indicative floors</h2>
        </div>
        <p className="band-table-intro">
          Indicative one-time floors by headcount band. Final Path 2 pricing is
          set by the Mastra Audit.
        </p>
        <div className="band-table-wrap">
          <table className="band-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Headcount</th>
                <th>Multiplier</th>
                <th>Evals</th>
                <th>Integrations</th>
                <th>Infrastructure</th>
              </tr>
            </thead>
            <tbody>
              {CONCIERGE_PATH2_BANDS.map((band) => (
                <tr
                  key={band.id}
                  className={
                    band.id === quote.companyBandId ? 'active-band' : undefined
                  }
                >
                  <td>{band.name}</td>
                  <td>{band.headcount}</td>
                  <td>{formatMultiplier(band.multiplier, band.custom)}</td>
                  <td>{band.evals}</td>
                  <td>{band.integrations}</td>
                  <td>{band.infrastructure}</td>
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
                    band.id === quote.companyBandId ? 'active-band' : undefined
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
