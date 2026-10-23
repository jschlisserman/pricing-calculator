import { useEffect, useMemo, useState } from 'react'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  DEFAULT_PATH2_MARGIN,
  PATH1_TIERS,
  PATH2_EVALS_ID,
  PATH2_MARGIN_OPTIONS,
  PATH2_PACKAGES,
  buildSupportMargin,
  buildSupportQuote,
  getAuditFee,
  getPath1ImpliedHourly,
  getPath1ListPrice,
  getPath1PeriodLabel,
  getPath2Cost,
  getPath2ListPrice,
  isPath1Id,
  isPath2Id,
  withoutOtherPath1Tiers,
  type Path1BillingPeriod,
  type Path2Hours,
  type Path2MarginRate,
  type Path2Margins,
  type Path2PackageId,
} from './concierge'
import {
  ADDONS,
  AGENCY_MODE_DISCOUNT,
  DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  PLANS,
  PLATFORM_PACKAGES,
  PROGRAMS,
  PLATFORM_USAGE_METRICS,
  TRACE_INTELLIGENCE_POOLS,
  buildPlatformMargin,
  buildQuote,
  defaultPlatformConfig,
  formatPercent,
  formatUnitCost,
  formatUsd,
  formatMultiplier,
  getAdditionalUsageUnitPrice,
  getAddonMultiplier,
  getAgentLearningAnnual,
  getAgentLearningMonthly,
  getEvalsMultiplier,
  getHeadcountBand,
  getPlan,
  getPlanMultiplier,
  getTraceIntelligenceRatePer1k,
  isAddonAvailable,
  platformConfigFromPackage,
  type AddonId,
  type PlanId,
  type ProgramId,
  type PlatformConfig,
  type PlatformPackageId,
} from './pricing'
import MatricesPage from './MatricesPage'
import ReviewPage from './ReviewPage'
import NumberField from './NumberField'
import type { OrderLineSnapshot, OrderSnapshot } from './orderSnapshot'

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

type AppPage = 'order' | 'review' | 'matrices'

export default function App() {
  const [page, setPage] = useState<AppPage>('order')
  const [reviewSnapshot, setReviewSnapshot] = useState<OrderSnapshot | null>(
    null,
  )
  const [planId, setPlanId] = useState<PlanId | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([])
  const [agentLearningPoolMonthly, setAgentLearningPoolMonthly] = useState(
    DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  )
  const [selectedPrograms, setSelectedPrograms] = useState<ProgramId[]>([])
  const [headcount, setHeadcount] = useState<number | null>(null)
  const headcountBand = getHeadcountBand(headcount)
  const evalsMultiplier = getEvalsMultiplier(headcount)
  const [agencyMode, setAgencyMode] = useState(false)
  const [supportIds, setSupportIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(0),
  )
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [path2Margins, setPath2Margins] = useState<Path2Margins>({})
  const [path1BillingPeriod, setPath1BillingPeriod] =
    useState<Path1BillingPeriod>('quarter')
  const [engineerCostPerHour] = useState(DEFAULT_ENGINEER_COST_PER_HOUR)

  const plan = planId == null ? null : getPlan(planId)

  useEffect(() => {
    if (planId == null) return
    const nextPlan = getPlan(planId)
    setSelectedAddons((prev) =>
      prev.filter((id) => {
        const addon = ADDONS.find((a) => a.id === id)
        return addon != null && isAddonAvailable(addon, nextPlan)
      }),
    )
  }, [planId])

  useEffect(() => {
    if (agencyMode) {
      setSupportIds([])
      setSelectedPrograms([])
    }
  }, [agencyMode])

  const quote = useMemo(
    () =>
      buildQuote({
        planId,
        selectedAddonIds: selectedAddons,
        selectedProgramIds: selectedPrograms,
        headcount,
        agentLearningPoolMonthly,
        agencyMode,
        platformConfig,
      }),
    [
      planId,
      selectedAddons,
      selectedPrograms,
      headcount,
      agentLearningPoolMonthly,
      agencyMode,
      platformConfig,
    ],
  )

  const usageScaleAnnual =
    quote.subscriptionListAnnual - quote.agencyDiscount - quote.bundleDiscount

  useEffect(() => {
    if (!quote.plan?.hasUsage) return
    setPlatformConfig((prev) => {
      const scaled = platformConfigFromPackage(prev.packageId, usageScaleAnnual)
      return { ...scaled, additional: prev.additional }
    })
  }, [usageScaleAnnual, quote.plan?.hasUsage])

  const support = useMemo(
    () =>
      buildSupportQuote(
        supportIds,
        path2Hours,
        path2Margins,
        engineerCostPerHour,
        path1BillingPeriod,
        evalsMultiplier,
      ),
    [
      supportIds,
      path2Hours,
      path2Margins,
      engineerCostPerHour,
      path1BillingPeriod,
      evalsMultiplier,
    ],
  )

  const margin = useMemo(
    () => buildSupportMargin(support, engineerCostPerHour),
    [support, engineerCostPerHour],
  )

  const showUsage = Boolean(quote.plan?.hasUsage)

  const platformMargin = useMemo(() => {
    if (!showUsage) return null
    return buildPlatformMargin(
      quote.annualTotal,
      quote.platformIncludes,
      platformConfig.additional,
    )
  }, [
    showUsage,
    quote.annualTotal,
    quote.platformIncludes,
    platformConfig.additional,
  ])

  const selectedPath1Id = supportIds.find(isPath1Id)
  const auditSelected = supportIds.includes(AUDIT_ID)
  const auditFee = getAuditFee()
  const hasSupport =
    !agencyMode &&
    (support.path1 != null ||
      support.path2.length > 0 ||
      support.audit != null)
  const hasProducts = quote.productLines.length > 0
  const hasOrder = hasProducts || hasSupport

  const orderSnapshot = useMemo((): OrderSnapshot | null => {
    if (!hasOrder) return null

    const productLines: OrderLineSnapshot[] = quote.productLines.map(
      (line) => ({
        name: line.name,
        meta: line.meta,
        listAmount: line.included ? null : line.annualAmount,
        billedAmount: line.included ? null : line.annualAmount,
        period: '/ yr',
        noBaseFee: line.annualAmount === 0 && line.id === 'plan',
        included: line.included,
      }),
    )

    const supportLines: OrderLineSnapshot[] = []
    if (!agencyMode) {
      if (support.path1) {
        supportLines.push({
          name: `Support Path 1 · ${support.path1.tier.name}`,
          meta: `${support.path1.tier.hoursPerWeek} hrs/wk · ${
            support.path1.billingPeriod === 'year' ? 'Annual' : 'Quarterly'
          }`,
          listAmount: support.path1.listAmount,
          billedAmount: support.path1.billedAmount,
          period: support.path1.periodLabel,
        })
      }
      for (const line of support.path2) {
        supportLines.push({
          name: `Support Path 2 · ${line.package.name}`,
          meta:
            line.flatPrice != null
              ? line.flatMultiplier !== 1 && headcountBand
                ? `${formatUsd(line.flatPrice)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(line.flatMultiplier)} · Flat one-time`
                : 'Flat one-time'
              : `${line.hours} hrs · ${formatPercent(line.targetMarginRate)} target`,
          listAmount: line.listAmount > 0 ? line.listAmount : null,
          billedAmount: line.listAmount > 0 ? line.billedAmount : null,
          period: '/ one-time',
        })
      }
      if (support.audit) {
        supportLines.push({
          name: 'Mastra Audit',
          listAmount: support.audit.listAmount,
          billedAmount: support.audit.billedAmount,
          period: '/ one-time',
        })
      }
    }

    return {
      planLabel: quote.plan?.name ?? 'No plan',
      headcountLabel:
        quote.headcountBand && quote.headcount != null
          ? `${quote.headcount.toLocaleString('en-US')} employees · ${quote.headcountBand.name} (${quote.headcountBand.rangeLabel})`
          : null,
      agencyModeLabel: agencyMode
        ? `Agency mode (${formatPercent(AGENCY_MODE_DISCOUNT)} off subscription)`
        : null,
      productLines,
      productTotal: quote.annualTotal,
      supportLines,
      supportPath1Total:
        !agencyMode && support.path1 ? support.path1Total : null,
      supportPath1Period:
        !agencyMode && support.path1 ? support.path1.periodLabel : null,
      supportOneTimeTotal:
        !agencyMode && (support.path2.length > 0 || support.audit)
          ? support.oneTimeTotal
          : null,
    }
  }, [hasOrder, quote, support, agencyMode])

  function selectPlan(id: PlanId) {
    setPlanId(id)
  }

  function toggleAddon(id: AddonId) {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleProgram(id: ProgramId) {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleSupport(id: string) {
    setSupportIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (isPath1Id(id)) return withoutOtherPath1Tiers([...prev, id], id)
      if (isPath2Id(id)) {
        // Evals does not auto-include the Mastra Audit.
        if (id === PATH2_EVALS_ID) return [...prev, id]
        return prev.includes(AUDIT_ID) ? [...prev, id] : [...prev, id, AUDIT_ID]
      }
      return [...prev, id]
    })
  }

  function removeSupport(id: string) {
    setSupportIds((prev) => prev.filter((x) => x !== id))
  }

  function setUsageAmount(metricId: string, amount: number) {
    setPlatformConfig((prev) => ({
      ...prev,
      additional: {
        ...prev.additional,
        [metricId]: Math.max(0, amount),
      },
    }))
  }

  function setIncludeAmount(metricId: string, amount: number) {
    setPlatformConfig((prev) => ({
      ...prev,
      includes: {
        ...prev.includes,
        [metricId]: Math.max(0, amount),
      },
    }))
  }

  function selectPlatformPackage(packageId: PlatformPackageId) {
    setPlatformConfig(platformConfigFromPackage(packageId, usageScaleAnnual))
  }

  function setPath2DeliveryHours(
    packageId: Path2PackageId,
    hours: number | null,
  ) {
    if (hours == null) {
      setPath2Hours((prev) => {
        const next = { ...prev }
        delete next[packageId]
        return next
      })
      return
    }
    setPath2Hours((prev) => ({
      ...prev,
      [packageId]: Math.max(0, hours),
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
    setPlanId(null)
    setSelectedAddons([])
    setSelectedPrograms([])
    setHeadcount(null)
    setAgentLearningPoolMonthly(DEFAULT_AGENT_LEARNING_POOL_MONTHLY)
    setAgencyMode(false)
    setSupportIds([])
    setPlatformConfig(defaultPlatformConfig(0))
    setPath2Hours({})
    setPath2Margins({})
    setPath1BillingPeriod('quarter')
  }

  return (
    <div className="app">
      <header className="topbar animate-in">
        <a
          className="brand"
          href="https://mastra.ai"
          target="_blank"
          rel="noreferrer"
        >
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
            className={`nav-tab${page === 'matrices' ? ' active' : ''}`}
            onClick={() => setPage('matrices')}
            aria-current={page === 'matrices' ? 'page' : undefined}
          >
            Pricing matrix
          </button>
        </nav>
      </header>

      {page === 'review' && reviewSnapshot ? (
        <ReviewPage
          order={reviewSnapshot}
          onBack={() => {
            setReviewSnapshot(null)
            setPage('order')
          }}
          onSubmitted={clearOrder}
        />
      ) : page === 'matrices' ? (
        <MatricesPage />
      ) : (
        <>
          <section className="hero animate-in delay-1">
            <h1>Build an order. Adjust as you go.</h1>
          </section>

          <div className="layout animate-in delay-2">
            <div className="panel">
              <section className="category">
                <div className="category-title">
                  <h3>Company headcount</h3>
                  <span className="category-meta">
                    {headcountBand ? headcountBand.name : 'Size multiplier'}
                  </span>
                </div>
                <div className="ti-input-row">
                  <label htmlFor="company-headcount">Employees</label>
                  <NumberField
                    id="company-headcount"
                    value={headcount}
                    min={0}
                    emptyValue={null}
                    placeholder="e.g. 500"
                    onCommit={(next) => setHeadcount(next)}
                    aria-label="Company headcount (employees)"
                  />
                </div>
                <p className="item-desc">
                  {headcountBand
                    ? `${headcountBand.name} (${headcountBand.rangeLabel} employees) — multipliers apply to the plan, Agent Builder, Compliance, Premium On-Call, and Evals.`
                    : 'Enter headcount to apply size multipliers to the plan, Agent Builder, Compliance, Premium On-Call, and Evals. Defaults to 1.0×.'}
                </p>
              </section>

              <section className="category">
                <div className="category-title">
                  <h3>Agency mode</h3>
                  <span className="category-meta">Optional</span>
                </div>
                <div className="items">
                  <button
                    type="button"
                    className={`item${agencyMode ? ' selected' : ''}`}
                    onClick={() => setAgencyMode((v) => !v)}
                    aria-pressed={agencyMode}
                  >
                    <span className="check" aria-hidden="true">
                      {agencyMode ? <CheckIcon /> : null}
                    </span>
                    <span className="item-body">
                      <span className="item-name">Agency mode</span>
                      <p className="item-desc">
                        {formatPercent(AGENCY_MODE_DISCOUNT)} off plan and
                        add-ons.
                      </p>
                    </span>
                    <span className="item-price">
                      −{formatPercent(AGENCY_MODE_DISCOUNT)}
                      <br />
                      subscription
                    </span>
                  </button>
                </div>
              </section>

              <div className="panel-head">
                <h2>Plan</h2>
              </div>
              <div className="items">
                {PLANS.map((p) => {
                  const selected = planId === p.id
                  const planMultiplier = getPlanMultiplier(p.id, headcount)
                  const planPrice = Math.round(p.annualFee * planMultiplier)
                  return (
                    <div
                      key={p.id}
                      className={`item-wrap${selected ? ' open' : ''}`}
                    >
                      <button
                        type="button"
                        className={`item radio${selected ? ' selected' : ''}`}
                        onClick={() => selectPlan(p.id)}
                        aria-pressed={selected}
                      >
                        <span className="check" aria-hidden="true" />
                        <span className="item-body">
                          <span className="item-name">{p.name}</span>
                          <p className="item-desc">{p.description}</p>
                          {p.features.length > 0 && (
                            <div className="feature-list">
                              {p.features.map((f) => (
                                <span className="feature" key={f}>
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </span>
                        <span className="item-price">
                          {formatUsd(planPrice)}
                          <br />
                          / yr
                        </span>
                      </button>

                      {selected && p.hasUsage && showUsage && (
                            <div className="platform-usage">
                              <div className="platform-usage-intro">
                                <strong>Platform usage</strong>
                                <span>Enterprise Platform meters</span>
                              </div>
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
                                    onClick={() =>
                                      selectPlatformPackage(pkg.id)
                                    }
                                  >
                                    {pkg.name}
                                  </button>
                                ))}
                              </div>
                              <div className="platform-base-row">
                                <span>
                                  Usage include scale (product total)
                                </span>
                                <strong>
                                  {formatUsd(usageScaleAnnual)}/yr
                                </strong>
                              </div>
                              <div className="platform-usage-table package-table">
                                <div className="platform-usage-head package-head">
                                  <span>Meter</span>
                                  <span>Package include (mo)</span>
                                  <span>Additional (mo)</span>
                                  <span>Unit / overage</span>
                                  <span>Additional @ 50% / mo</span>
                                </div>
                                {PLATFORM_USAGE_METRICS.map((metric) => {
                                  const included =
                                    platformConfig.includes[metric.id] ?? 0
                                  const additional =
                                    platformConfig.additional[metric.id] ?? 0
                                  const billedUnit =
                                    getAdditionalUsageUnitPrice(
                                      metric.unitCost,
                                    )
                                  const monthlyCost = additional * billedUnit
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
                                      <NumberField
                                        value={included}
                                        min={0}
                                        onCommit={(next) =>
                                          setIncludeAmount(
                                            metric.id,
                                            next ?? 0,
                                          )
                                        }
                                        aria-label={`Package include ${metric.name}`}
                                      />
                                      <NumberField
                                        value={additional}
                                        min={0}
                                        onCommit={(next) =>
                                          setUsageAmount(
                                            metric.id,
                                            next ?? 0,
                                          )
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
                                        {formatUsd(monthlyCost)}
                                        <span className="platform-usage-note">
                                          @ {formatUnitCost(billedUnit)} ·{' '}
                                          {formatUsd(monthlyCost * 12)}/yr
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

              <section className="category">
                <div className="category-title">
                  <h3>Add-ons</h3>
                  <span className="category-meta">Optional</span>
                </div>
                <div className="items">
                  {ADDONS.map((addon) => {
                    const allowed = isAddonAvailable(addon, plan)
                    const selected = selectedAddons.includes(addon.id)
                    const priced = quote.addonPricing.lines.find(
                      (l) => l.addon.id === addon.id,
                    )
                    const addonMultiplier = getAddonMultiplier(
                      addon.id,
                      headcount,
                    )
                    const displayedFlat =
                      addon.flatAnnual != null
                        ? Math.round(addon.flatAnnual * addonMultiplier)
                        : null
                    return (
                      <div
                        key={addon.id}
                        className={`item-wrap${selected ? ' open' : ''}`}
                      >
                      <button
                        type="button"
                        className={`item${selected ? ' selected' : ''}${!allowed ? ' unavailable' : ''}`}
                        onClick={() => {
                          if (!allowed) return
                          toggleAddon(addon.id)
                        }}
                        aria-pressed={selected}
                        disabled={!allowed}
                      >
                        <span className="check" aria-hidden="true">
                          {selected ? <CheckIcon /> : null}
                        </span>
                        <span className="item-body">
                          <span className="item-name">
                            {addon.name}
                            {!allowed && (
                              <span className="pill">
                                {addon.id === 'compliance'
                                  ? 'Enterprise Platform only'
                                  : 'Enterprise only'}
                              </span>
                            )}
                          </span>
                          <p className="item-desc">{addon.description}</p>
                        </span>
                        <span className="item-price">
                          {!allowed ? (
                            '—'
                          ) : priced ? (
                            <>
                              {formatUsd(priced.billedAmount)}
                              <br />
                              / year
                            </>
                          ) : addon.id === 'agent-learning' ? (
                            <>
                              $7.50
                              <br />
                              / 1k traces
                            </>
                          ) : displayedFlat != null ? (
                            <>
                              {formatUsd(displayedFlat)}
                              <br />
                              / year
                            </>
                          ) : (
                            <>
                              {formatPercent(addon.rate ?? 0)}
                              <br />
                              {addon.annualMinimum > 0
                                ? `${formatUsd(addon.annualMinimum)} min`
                                : 'of contract'}
                            </>
                          )}
                        </span>
                      </button>

                      {selected && addon.id === 'agent-learning' && (
                        <div className="ti-panel">
                          <div className="platform-usage-intro">
                            <strong>Trace Intelligence</strong>
                            <span>Analyzed traces / month</span>
                          </div>
                          <div className="ti-input-row">
                            <label htmlFor="agent-learning-pool">
                              Add-on pool (analyzed traces/mo)
                            </label>
                            <NumberField
                              id="agent-learning-pool"
                              value={agentLearningPoolMonthly}
                              min={0}
                              onCommit={(next) =>
                                setAgentLearningPoolMonthly(next ?? 0)
                              }
                              aria-label="Agent Learning add-on pool, analyzed traces per month"
                            />
                          </div>
                          <div className="ti-computed">
                            <span>
                              Rate{' '}
                              {formatUsd(
                                getTraceIntelligenceRatePer1k(
                                  agentLearningPoolMonthly,
                                ),
                              )}
                              /1k
                            </span>
                            <span>
                              {formatUsd(
                                getAgentLearningMonthly(
                                  agentLearningPoolMonthly,
                                ),
                              )}
                              /mo
                            </span>
                            <span>
                              {formatUsd(
                                getAgentLearningAnnual(
                                  agentLearningPoolMonthly,
                                ),
                              )}
                              /yr
                            </span>
                          </div>
                          <div className="ti-table">
                            <div className="ti-row ti-head">
                              <span>Monthly pool</span>
                              <span>Rate / 1k</span>
                              <span>Price</span>
                            </div>
                            {TRACE_INTELLIGENCE_POOLS.map((pool) => (
                              <div className="ti-row" key={pool.monthlyPool}>
                                <span>{pool.monthlyPool}</span>
                                <span>{pool.ratePer1k}</span>
                                <span>{pool.price}</span>
                              </div>
                            ))}
                          </div>
                          <p className="ti-note">
                            Pool resets monthly. Enterprise pools are committed
                            annually; overage true-up at 1.25×. TI pauses when
                            the pool runs out. Bring-your-own model: same price.
                            Self-hosted / air-gapped: +50%.
                          </p>
                        </div>
                      )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {!agencyMode && (
                <section className="category">
                  <div className="category-title">
                    <h3>Programs</h3>
                    <span className="category-meta">Annual</span>
                  </div>
                  <div className="items">
                    {PROGRAMS.map((program) => {
                      const selected = selectedPrograms.includes(program.id)
                      return (
                        <button
                          key={program.id}
                          type="button"
                          className={`item${selected ? ' selected' : ''}`}
                          onClick={() => toggleProgram(program.id)}
                          aria-pressed={selected}
                        >
                          <span className="check" aria-hidden="true">
                            {selected ? <CheckIcon /> : null}
                          </span>
                          <span className="item-body">
                            <span className="item-name">{program.name}</span>
                            <p className="item-desc">{program.description}</p>
                          </span>
                          <span className="item-price">
                            {formatUsd(program.annualFee)}
                            <br />
                            / year
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {!agencyMode && (
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
                    onClick={() => setPath1BillingPeriod('quarter')}
                  >
                    <strong>Quarterly</strong>
                    <span>Billed each quarter</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-option${path1BillingPeriod === 'year' ? ' active' : ''}`}
                    role="radio"
                    aria-checked={path1BillingPeriod === 'year'}
                    onClick={() => setPath1BillingPeriod('year')}
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
                        onClick={() => toggleSupport(tier.id)}
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
                          onClick={() => toggleSupport(pkg.id)}
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
                                  setPath2DeliveryHours(pkg.id, next)
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
                                    setPath2TargetMargin(pkg.id, rate)
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
                    onClick={() => toggleSupport(AUDIT_ID)}
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
              )}
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
                        {quote.productLines.map((line) => {
                          const addonLine = quote.addonPricing.lines.find(
                            (l) => l.addon.name === line.name,
                          )
                          const showStrike =
                            addonLine != null &&
                            addonLine.listAmount > addonLine.billedAmount
                          return (
                            <li className="order-line" key={line.id}>
                              <div>
                                <span className="order-line-name">
                                  {line.name}
                                </span>
                                {line.meta && (
                                  <span className="order-line-meta">
                                    {line.meta}
                                  </span>
                                )}
                              </div>
                              <span className="order-line-price">
                                {showStrike && (
                                  <span className="strike">
                                    {formatUsd(addonLine!.listAmount)}
                                  </span>
                                )}
                                {line.included ? (
                                  <span className="order-line-meta">Included</span>
                                ) : line.id === 'plan' && line.annualAmount === 0 ? (
                                  <span className="order-line-meta">—</span>
                                ) : (
                                  <>
                                    {formatUsd(line.annualAmount)}
                                    <span className="order-line-meta">/ yr</span>
                                  </>
                                )}
                              </span>
                              {(line.id === 'agent-learning' ||
                                line.id === 'agent-builder' ||
                                line.id === 'compliance' ||
                                line.id === 'premium-on-call') && (
                                <button
                                  type="button"
                                  className="remove"
                                  onClick={() =>
                                    toggleAddon(line.id as AddonId)
                                  }
                                  aria-label={`Remove ${line.name}`}
                                >
                                  <CloseIcon />
                                </button>
                              )}
                              {(line.id === 'agency-program' ||
                                line.id === 'design-partner-program') && (
                                <button
                                  type="button"
                                  className="remove"
                                  onClick={() =>
                                    toggleProgram(line.id as ProgramId)
                                  }
                                  aria-label={`Remove ${line.name}`}
                                >
                                  <CloseIcon />
                                </button>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                      <div className="totals">
                        <div className="total-row grand">
                          <span>Product total / year</span>
                          <span>{formatUsd(quote.annualTotal)}</span>
                        </div>
                        {platformMargin && (
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
                      </div>
                    </div>
                  )}

                  {hasSupport && (
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
                                removeSupport(support.path1!.tier.id)
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
                              onClick={() => removeSupport(line.package.id)}
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
                              onClick={() => removeSupport(AUDIT_ID)}
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
                  )}

                  <button
                    type="button"
                    className="clear-btn confirm-btn"
                    onClick={() => {
                      if (!orderSnapshot) return
                      setReviewSnapshot(orderSnapshot)
                      setPage('review')
                    }}
                  >
                    Submit order
                  </button>
                </>
              ) : (
                <p className="summary-empty">
                  Select a plan to build an order.
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
