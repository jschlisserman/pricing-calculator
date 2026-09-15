import { useEffect, useMemo, useState } from 'react'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  DEFAULT_PATH2_MARGIN,
  PATH1_TIERS,
  PATH2_MARGIN_OPTIONS,
  PATH2_PACKAGES,
  buildConciergeMargin,
  buildConciergeQuote,
  getAuditFee,
  getPath1ImpliedHourly,
  getPath1QuarterlyList,
  getPath2Cost,
  getPath2ListPrice,
  isConciergeId,
  isPath1Id,
  isPath2Id,
  withoutConciergeItems,
  withoutOtherPath1Tiers,
  type Path1Mode,
  type Path2Hours,
  type Path2MarginRate,
  type Path2Margins,
  type Path2PackageId,
} from './concierge'
import {
  BYOC_ID,
  CATALOG,
  CATEGORY_ORDER,
  DESIGN_PARTNER_ID,
  PLATFORM_ID,
  PLATFORM_PACKAGES,
  PLATFORM_USAGE_METRICS,
  SELF_HOSTED_ID,
  buildPlatformMargin,
  buildQuote,
  defaultDppUsageConfig,
  defaultPlatformConfig,
  dppUsageConfigFromEmployees,
  formatMultiplier,
  formatPercent,
  formatUnitCost,
  formatUsd,
  getAdditionalUsageUnitPrice,
  getCatalogListAmount,
  getDppAnnualFee,
  getPlatformUsageScaleAnnual,
  hasProgramSelected,
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
import TablesPage from './TablesPage'

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

type AppPage = 'order' | 'tables'

export default function App() {
  const [page, setPage] = useState<AppPage>('order')
  const [employees, setEmployees] = useState(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(50),
  )
  const [dppUsageConfig, setDppUsageConfig] = useState<DppUsageConfig>(() =>
    defaultDppUsageConfig(50),
  )
  const [path1Mode, setPath1Mode] = useState<Path1Mode>('advisory')
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [path2Margins, setPath2Margins] = useState<Path2Margins>({})
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
        path2Hours,
        path2Margins,
        quote.productPurchaseCount,
        engineerCostPerHour,
      ),
    [
      selectedIds,
      employees,
      path1Mode,
      path2Hours,
      path2Margins,
      quote.productPurchaseCount,
      engineerCostPerHour,
    ],
  )

  const margin = useMemo(
    () => buildConciergeMargin(concierge, engineerCostPerHour),
    [concierge, engineerCostPerHour],
  )

  const platformSelected = selectedIds.includes(PLATFORM_ID)
  const platformMargin = useMemo(() => {
    if (!platformSelected) return null
    return buildPlatformMargin(
      quote.annualTotal,
      quote.platformIncludes,
      platformConfig.additional,
    )
  }, [
    platformSelected,
    quote.annualTotal,
    quote.platformIncludes,
    platformConfig.additional,
  ])

  const dppSelected = selectedIds.includes(DESIGN_PARTNER_ID)
  const dppAnnualFee = getDppAnnualFee(
    Number.isFinite(employees) ? employees : 0,
  )
  const dppMargin = useMemo(() => {
    if (!dppSelected) return null
    return buildPlatformMargin(
      quote.annualTotal,
      quote.dppIncludes,
      dppUsageConfig.additional,
    )
  }, [
    dppSelected,
    quote.annualTotal,
    quote.dppIncludes,
    dppUsageConfig.additional,
  ])

  const platformListPrice = getPlatformUsageScaleAnnual(
    Number.isFinite(employees) ? employees : 0,
  )
  const selfHostedSelected = hasSelfHostedDeployment(selectedIds)
  const programSelected = hasProgramSelected(selectedIds)
  const headcount = Number.isFinite(employees) ? employees : 0
  const selectedPath1Id = selectedIds.find(isPath1Id)
  const auditSelected = selectedIds.includes(AUDIT_ID)
  const auditFee = getAuditFee(headcount)
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
        if (hasProgramSelected(prev)) {
          return prev
        }

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
        return withoutSelfHostedGatedItems(
          withoutConciergeItems([
            ...prev.filter((x) => !isProgramId(x)),
            id,
          ]),
        )
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

  function setPath2TargetMargin(
    packageId: Path2PackageId,
    marginRate: Path2MarginRate,
  ) {
    setPath2Margins((prev) => ({
      ...prev,
      [packageId]: marginRate,
    }))
  }

  function clearOrder() {
    setSelectedIds([])
    setPlatformConfig(defaultPlatformConfig(employees))
    setDppUsageConfig(defaultDppUsageConfig(employees))
    setPath1Mode('advisory')
    setPath2Hours({})
    setPath2Margins({})
    setEngineerCostPerHour(DEFAULT_ENGINEER_COST_PER_HOUR)
  }

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
        <nav className="app-nav" aria-label="Primary">
          <button
            type="button"
            className={`nav-tab${page === 'order' ? ' active' : ''}`}
            onClick={() => setPage('order')}
            aria-current={page === 'order' ? 'page' : undefined}
          >
            Order builder
          </button>
          <button
            type="button"
            className={`nav-tab${page === 'tables' ? ' active' : ''}`}
            onClick={() => setPage('tables')}
            aria-current={page === 'tables' ? 'page' : undefined}
          >
            Tables
          </button>
        </nav>
      </header>

      {page === 'tables' ? (
        <TablesPage
          activeBandId={quote.companyBandId}
          dppBandId={quote.dppBandId}
        />
      ) : (
        <>
      <section className="hero animate-in delay-1">
        <h1>Build an order. Adjust as you go.</h1>
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
                                ? 'Unavailable with BYOC unless explicit permission is given.'
                                : 'Unavailable while a Deployment is selected. BYOC is not offered with Agency or Design Partner unless explicit permission is given.'
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
                            ) : item.id === PLATFORM_ID ||
                              item.id === SELF_HOSTED_ID ? (
                              <>
                                No base fee
                                <br />
                                {periodLabel(item)}
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
                              <span>Base subscription</span>
                              <strong>None — add products/bundles</strong>
                            </div>
                            <div className="platform-base-row">
                              <span>Usage include scale (by headcount)</span>
                              <strong>
                                {formatUsd(platformListPrice)}/yr ref
                              </strong>
                            </div>

                            <div className="platform-usage-table package-table">
                              <div className="platform-usage-head package-head">
                                <span>Meter</span>
                                <span>Package include</span>
                                <span>Additional</span>
                                <span>Unit / overage</span>
                                <span>Additional @ 50%</span>
                              </div>
                              {PLATFORM_USAGE_METRICS.map((metric) => {
                                const included =
                                  platformConfig.includes[metric.id] ?? 0
                                const additional =
                                  platformConfig.additional[metric.id] ?? 0
                                const billedUnit = getAdditionalUsageUnitPrice(
                                  metric.unitCost,
                                )
                                const lineCost = additional * billedUnit
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
                                        fixed / {metric.unitLabel}
                                      </span>
                                    </span>
                                    <span className="platform-usage-cost">
                                      {formatUsd(lineCost)}
                                      <span className="platform-usage-note">
                                        @ {formatUnitCost(billedUnit)}
                                      </span>
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {isDpp && selected && !unavailable && (
                          <div className="platform-usage">
                            <div className="platform-base-row">
                              <span>DPP fee (by headcount)</span>
                              <strong>{formatUsd(dppAnnualFee)}/yr</strong>
                            </div>

                            <div className="platform-usage-table package-table">
                              <div className="platform-usage-head package-head">
                                <span>Meter</span>
                                <span>Package include</span>
                                <span>Additional</span>
                                <span>Unit / overage</span>
                                <span>Additional @ 50%</span>
                              </div>
                              {PLATFORM_USAGE_METRICS.map((metric) => {
                                const included =
                                  dppUsageConfig.includes[metric.id] ?? 0
                                const additional =
                                  dppUsageConfig.additional[metric.id] ?? 0
                                const billedUnit = getAdditionalUsageUnitPrice(
                                  metric.unitCost,
                                )
                                const lineCost = additional * billedUnit
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
                                        fixed / {metric.unitLabel}
                                      </span>
                                    </span>
                                    <span className="platform-usage-cost">
                                      {formatUsd(lineCost)}
                                      <span className="platform-usage-note">
                                        @ {formatUnitCost(billedUnit)}
                                      </span>
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
              <span className="category-meta">
                {programSelected
                  ? 'Unavailable with Programs'
                  : 'Services'}
              </span>
            </div>

            <div className="concierge-subhead">
              <h4>Path 1 — Hours-based</h4>
              <p>
                {programSelected
                  ? 'Unavailable while a Program is selected.'
                  : 'Customer owns the outcome'}
              </p>
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
                    className={`item-wrap${selected && !programSelected ? ' open' : ''}`}
                  >
                    <button
                      type="button"
                      className={`item radio${selected ? ' selected' : ''}${programSelected ? ' unavailable' : ''}`}
                      onClick={() => {
                        if (programSelected) return
                        toggleItem(tier.id)
                      }}
                      aria-pressed={selected}
                      aria-disabled={programSelected}
                      disabled={programSelected}
                    >
                      <span className="check" aria-hidden="true" />
                      <span className="item-body">
                        <span className="item-name">
                          {tier.name}
                          <span className="pill">{tier.hoursPerWeek} hrs/wk</span>
                          {programSelected && (
                            <span className="pill">Program selected</span>
                          )}
                        </span>
                      </span>
                      <span className="item-price">
                        {programSelected ? (
                          <>
                            —
                            <br />
                            Gated
                          </>
                        ) : (
                          <>
                            {formatUsd(advisoryList)}
                            <br />
                            / qtr
                          </>
                        )}
                      </span>
                    </button>

                    {selected && !programSelected && (
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
              <p>
                {programSelected
                  ? 'Unavailable while a Program is selected.'
                  : `Price = $${engineerCostPerHour}/hr × hours ÷ (1 − margin)`}
              </p>
            </div>
            <div className="items">
              {PATH2_PACKAGES.map((pkg) => {
                const selected = selectedIds.includes(pkg.id)
                const hours = path2Hours[pkg.id] ?? 0
                const targetMargin =
                  path2Margins[pkg.id] ?? DEFAULT_PATH2_MARGIN
                const cost = getPath2Cost(hours, engineerCostPerHour)
                const listPrice = getPath2ListPrice(
                  hours,
                  targetMargin,
                  engineerCostPerHour,
                )
                return (
                  <div
                    key={pkg.id}
                    className={`item-wrap${selected && !programSelected ? ' open' : ''}`}
                  >
                    <button
                      type="button"
                      className={`item${selected ? ' selected' : ''}${programSelected ? ' unavailable' : ''}`}
                      onClick={() => {
                        if (programSelected) return
                        toggleItem(pkg.id)
                      }}
                      aria-pressed={selected}
                      aria-disabled={programSelected}
                      disabled={programSelected}
                    >
                      <span className="check" aria-hidden="true">
                        {selected && !programSelected ? <CheckIcon /> : null}
                      </span>
                      <span className="item-body">
                        <span className="item-name">
                          {pkg.name}
                          <span className="pill">Outcome</span>
                          {programSelected && (
                            <span className="pill">Program selected</span>
                          )}
                        </span>
                      </span>
                      <span className="item-price">
                        {programSelected ? (
                          <>
                            —
                            <br />
                            Gated
                          </>
                        ) : listPrice > 0 ? (
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
                    {selected && !programSelected && (
                      <div className="path2-pricing">
                        <label
                          className="scoped-price"
                          htmlFor={`hours-${pkg.id}`}
                        >
                          Project hours
                          <input
                            id={`hours-${pkg.id}`}
                            type="number"
                            min={0}
                            step={1}
                            placeholder="0"
                            value={
                              path2Hours[pkg.id] != null
                                ? String(path2Hours[pkg.id])
                                : ''
                            }
                            onChange={(e) =>
                              setPath2DeliveryHours(pkg.id, e.target.value)
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
                              onClick={() => setPath2TargetMargin(pkg.id, rate)}
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
                {programSelected
                  ? 'Unavailable while a Program is selected.'
                  : 'One-time scoping fee'}
              </p>
            </div>
            <div className="items">
              <div className="item-wrap">
                <button
                  type="button"
                  className={`item${auditSelected ? ' selected' : ''}${programSelected ? ' unavailable' : ''}`}
                  onClick={() => {
                    if (programSelected) return
                    toggleItem(AUDIT_ID)
                  }}
                  aria-pressed={auditSelected}
                  aria-disabled={programSelected}
                  disabled={programSelected}
                >
                  <span className="check" aria-hidden="true">
                    {auditSelected && !programSelected ? <CheckIcon /> : null}
                  </span>
                  <span className="item-body">
                    <span className="item-name">
                      Mastra Audit
                      {programSelected && (
                        <span className="pill">Program selected</span>
                      )}
                    </span>
                  </span>
                  <span className="item-price">
                    {programSelected ? (
                      <>
                        —
                        <br />
                        Gated
                      </>
                    ) : (
                      <>
                        {formatUsd(auditFee)}
                        <br />
                        / one-time
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="panel summary">
          <div className="panel-head">
            <h2>Order summary</h2>
          </div>

          {hasOrder ? (
            <>
              {hasProducts && (
                <div className="summary-group">
                  <h3 className="summary-group-title">Products</h3>
                  <ul className="order-lines">
                    {quote.lineItems.map(({ item, listAmount, billedAmount }) => {
                      const isPlatform = item.id === PLATFORM_ID
                      const isSelfHosted = item.id === SELF_HOSTED_ID
                      const isDpp = item.id === DESIGN_PARTNER_ID
                      const listPrice = isPlatform
                        ? quote.platformBasePrice + quote.platformOverageTotal
                        : isDpp
                          ? listAmount + quote.dppOverageTotal
                          : listAmount
                      const price = isPlatform
                        ? billedAmount + quote.platformOverageTotal
                        : isDpp
                          ? billedAmount + quote.dppOverageTotal
                          : billedAmount
                      const noBaseFee =
                        (isPlatform || isSelfHosted) && price === 0
                      const showDiscount =
                        !noBaseFee &&
                        listPrice > price &&
                        quote.discountRate > 0
                      return (
                        <li className="order-line" key={item.id}>
                          <div>
                            <span className="order-line-name">{item.name}</span>
                            {noBaseFee && (
                              <span className="order-line-meta">
                                No base subscription
                              </span>
                            )}
                            {showDiscount && (
                              <span className="order-line-meta">
                                {formatPercent(quote.discountRate)} off
                              </span>
                            )}
                          </div>
                          <span className="order-line-price">
                            {noBaseFee ? (
                              <span className="order-line-meta">—</span>
                            ) : (
                              <>
                                {showDiscount && (
                                  <span className="strike">
                                    {formatUsd(listPrice)}
                                  </span>
                                )}
                                {formatUsd(price)}
                                <span className="order-line-meta">/ yr</span>
                              </>
                            )}
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
                    {quote.discountRate > 0 && quote.discountAmount > 0 && (
                      <div className="total-row discount">
                        <span>
                          Volume discount ({formatPercent(quote.discountRate)})
                        </span>
                        <span>−{formatUsd(quote.discountAmount)}</span>
                      </div>
                    )}

                    <div className="total-row grand">
                      <span>Product total / year</span>
                      <span>{formatUsd(quote.annualTotal)}</span>
                    </div>

                    {platformSelected && platformMargin && (
                      <div className="total-row muted">
                        <span>Platform margin</span>
                        <span>
                          {formatUsd(platformMargin.margin)}
                          {platformMargin.marginRate != null
                            ? ` (${formatPercent(platformMargin.marginRate)})`
                            : ''}
                        </span>
                      </div>
                    )}

                    {dppSelected && dppMargin && (
                      <div className="total-row muted">
                        <span>Design Partner margin</span>
                        <span>
                          {formatUsd(dppMargin.margin)}
                          {dppMargin.marginRate != null
                            ? ` (${formatPercent(dppMargin.marginRate)})`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasConcierge && (
                <div className="summary-group">
                  <h3 className="summary-group-title">Concierge</h3>
                  <ul className="order-lines">
                    {concierge.path1 && (
                      <li className="order-line">
                        <div>
                          <span className="order-line-name">
                            Path 1 · {concierge.path1.tier.name}
                          </span>
                          <span className="order-line-meta">
                            {path1ModeLabel(concierge.path1.mode)}
                            {concierge.discountRate > 0
                              ? ` · ${formatPercent(concierge.discountRate)} off`
                              : ''}
                          </span>
                        </div>
                        <span className="order-line-price">
                          {concierge.discountRate > 0 && (
                            <span className="strike">
                              {formatUsd(concierge.path1.listAmount)}
                            </span>
                          )}
                          {formatUsd(concierge.path1.billedAmount)}
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
                    )}

                    {concierge.path2.map((line) => (
                      <li className="order-line" key={line.package.id}>
                        <div>
                          <span className="order-line-name">
                            Path 2 · {line.package.name}
                          </span>
                          <span className="order-line-meta">
                            {line.hours} hrs ·{' '}
                            {formatPercent(line.targetMarginRate)} target
                            {concierge.discountRate > 0
                              ? ` · ${formatPercent(concierge.discountRate)} off`
                              : ''}
                          </span>
                        </div>
                        <span className="order-line-price">
                          {line.listAmount > 0 ? (
                            <>
                              {concierge.discountRate > 0 && (
                                <span className="strike">
                                  {formatUsd(Math.round(line.listAmount))}
                                </span>
                              )}
                              {formatUsd(line.billedAmount)}
                            </>
                          ) : (
                            '—'
                          )}
                          <span className="order-line-meta">/ one-time</span>
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

                    {concierge.audit && (
                      <li className="order-line">
                        <div>
                          <span className="order-line-name">Mastra Audit</span>
                          {concierge.discountRate > 0 && (
                            <span className="order-line-meta">
                              {formatPercent(concierge.discountRate)} off
                            </span>
                          )}
                        </div>
                        <span className="order-line-price">
                          {concierge.discountRate > 0 && (
                            <span className="strike">
                              {formatUsd(concierge.audit.listAmount)}
                            </span>
                          )}
                          {formatUsd(concierge.audit.billedAmount)}
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
                    )}
                  </ul>

                  <div className="totals">
                    {concierge.discountRate > 0 &&
                      concierge.discountAmount > 0 && (
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

                    {concierge.path1 && (
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
                      <div className="total-row muted" key={`margin-${row.id}`}>
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
              )}

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
              Select items from the catalog to build an order.
            </p>
          )}
        </aside>
      </div>
        </>
      )}
    </div>
  )
}
