import { useEffect, useMemo, useState } from 'react'
import {
  ADDONS,
  AGENCY_MODE_DISCOUNT,
  DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  TRACE_INCLUDED_MONTHLY,
  TRACE_PLAN_UPLIFT_ANNUAL,
  PLANS,
  PLATFORM_PACKAGES,
  PLATFORM_USAGE_METRICS,
  TRACE_INTELLIGENCE_POOLS,
  buildQuote,
  defaultPlatformConfig,
  formatPercent,
  formatUnitCost,
  formatUsd,
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
// Type-only: erased from the agency bundle.
import type {
  Path1BillingPeriod,
  Path2Hours,
  Path2MarginRate,
  Path2Margins,
  Path2PackageId,
} from './internal/concierge'
import AccessPage from './AccessPage'
import MatricesPage from './MatricesPage'
import ReviewPage from './ReviewPage'
import NumberField from './NumberField'
import { useInternalEdition } from './edition'
import { CheckIcon, CloseIcon } from './icons'
import { useSession } from './session'
import type { OrderLineSnapshot, OrderSnapshot } from './orderSnapshot'

type AppPage = 'order' | 'review' | 'matrices' | 'access'

export default function App() {
  const user = useSession()
  // Internal-only pricing; null in the agency app.
  const internal = useInternalEdition()
  const programs = internal?.programs ?? []
  // Agency users always price with the agency discount and never see the toggle.
  const isAgency = user.role === 'agency'
  const isInternal = user.role === 'internal'
  // The access-request email links to /#access.
  const [page, setPage] = useState<AppPage>(() =>
    isInternal && window.location.hash === '#access' ? 'access' : 'order',
  )
  const [pendingAccessCount, setPendingAccessCount] = useState(0)

  useEffect(() => {
    if (!isInternal) return
    fetch('/api/access')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pending?: unknown[] } | null) => {
        if (data?.pending) setPendingAccessCount(data.pending.length)
      })
      .catch(() => {})
  }, [isInternal])
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
  const [agencyMode, setAgencyMode] = useState(isAgency)
  const [mastraForwardSelected, setMastraForwardSelected] = useState(false)
  const [forwardSellRatePerHour, setForwardSellRatePerHour] = useState<
    number | null
  >(null)
  const [forwardHoursPerWeek, setForwardHoursPerWeek] = useState<number | null>(
    null,
  )
  const [supportIds, setSupportIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(0),
  )
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [path2Margins, setPath2Margins] = useState<Path2Margins>({})
  const [path1BillingPeriod, setPath1BillingPeriod] =
    useState<Path1BillingPeriod>('quarter')

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
      setMastraForwardSelected(false)
    }
  }, [agencyMode])

  const quote = useMemo(
    () =>
      buildQuote({
        planId,
        selectedAddonIds: selectedAddons,
        programs: programs.filter((p) => selectedPrograms.includes(p.id)),
        headcount,
        agentLearningPoolMonthly,
        agencyMode,
        platformConfig,
      }),
    [
      planId,
      selectedAddons,
      selectedPrograms,
      programs,
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
      internal && !agencyMode
        ? internal.buildSupportQuote(
            supportIds,
            path2Hours,
            path2Margins,
            path1BillingPeriod,
            evalsMultiplier,
          )
        : null,
    [
      internal,
      agencyMode,
      supportIds,
      path2Hours,
      path2Margins,
      path1BillingPeriod,
      evalsMultiplier,
    ],
  )

  const mastraForward = useMemo(
    () =>
      internal && !agencyMode
        ? internal.buildMastraForwardQuote(
            mastraForwardSelected,
            forwardSellRatePerHour,
            forwardHoursPerWeek,
          )
        : null,
    [
      internal,
      agencyMode,
      mastraForwardSelected,
      forwardSellRatePerHour,
      forwardHoursPerWeek,
    ],
  )

  const multipliedProducts = internal
    ? 'the plan, Agent Builder, Compliance, Premium On-Call, and Evals'
    : 'the plan, Agent Builder, Compliance, and Premium On-Call'

  const showUsage = Boolean(quote.plan?.hasUsage)

  const platformMargin = useMemo(() => {
    if (!showUsage || !internal || isAgency) return null
    return internal.buildPlatformMargin(
      quote.annualTotal,
      quote.platformIncludes,
      platformConfig.additional,
    )
  }, [
    showUsage,
    internal,
    isAgency,
    quote.annualTotal,
    quote.platformIncludes,
    platformConfig.additional,
  ])

  const hasSupport =
    support != null &&
    (support.path1 != null ||
      support.path2.length > 0 ||
      support.audit != null)
  const hasMastraForward =
    mastraForward != null &&
    mastraForward.hoursPerWeek > 0 &&
    mastraForward.sellRatePerHour > 0
  const hasProducts = quote.productLines.length > 0
  const hasOrder = hasProducts || hasSupport || hasMastraForward

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

    const forwardSnapshot = internal
      ? internal.forwardOrderSnapshot(mastraForward)
      : { forwardLines: [], forwardAnnualTotal: null }

    const supportSnapshot =
      internal && support
        ? internal.supportOrderSnapshot(support, headcountBand)
        : {
            supportLines: [],
            supportPath1Total: null,
            supportPath1Period: null,
            supportOneTimeTotal: null,
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
      ...forwardSnapshot,
      ...supportSnapshot,
    }
  }, [
    hasOrder,
    quote,
    support,
    mastraForward,
    agencyMode,
    internal,
    headcountBand,
  ])

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
    if (!internal) return
    setSupportIds((prev) => internal.toggleSupportId(prev, id))
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
    setAgencyMode(isAgency)
    setMastraForwardSelected(false)
    setForwardSellRatePerHour(null)
    setForwardHoursPerWeek(null)
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
          {isInternal && (
            <button
              type="button"
              className={`nav-tab${page === 'access' ? ' active' : ''}`}
              onClick={() => setPage('access')}
              aria-current={page === 'access' ? 'page' : undefined}
            >
              Access
              {pendingAccessCount > 0 && (
                <span className="nav-badge">{pendingAccessCount}</span>
              )}
            </button>
          )}
          <span className="nav-user" title={user.email}>
            {user.email}
          </span>
          <a className="nav-tab" href="/auth/logout">
            Sign out
          </a>
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
      ) : page === 'access' && isInternal ? (
        <AccessPage onPendingCount={setPendingAccessCount} />
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
                    ? `${headcountBand.name} (${headcountBand.rangeLabel} employees) — multipliers apply to ${multipliedProducts}.`
                    : `Enter headcount to apply size multipliers to ${multipliedProducts}. Defaults to 1.0×.`}
                </p>
              </section>

              {!isAgency && (
              <section className="category">
                <div className="category-title">
                  <h3>Agency mode</h3>
                  <span className="category-meta">
                    Optional
                  </span>
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
              )}

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
                          ) : addon.id === 'trace-intelligence' ? (
                            <>
                              +{formatUsd(TRACE_PLAN_UPLIFT_ANNUAL)}
                              <br />
                              on plan
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

                      {selected && addon.id === 'trace-intelligence' && (
                        <div className="ti-panel">
                          <div className="platform-usage-intro">
                            <strong>Volume pricing</strong>
                            <span>Analyzed traces / month</span>
                          </div>
                          <div className="ti-input-row">
                            <label htmlFor="trace-intelligence-pool">
                              Monthly pool (analyzed traces)
                            </label>
                            <NumberField
                              id="trace-intelligence-pool"
                              value={agentLearningPoolMonthly}
                              min={0}
                              onCommit={(next) =>
                                setAgentLearningPoolMonthly(next ?? 0)
                              }
                              aria-label="Trace Intelligence monthly pool, analyzed traces"
                            />
                          </div>
                          <div className="ti-computed">
                            <span>
                              {agentLearningPoolMonthly <=
                              TRACE_INCLUDED_MONTHLY
                                ? `${TRACE_INCLUDED_MONTHLY.toLocaleString('en-US')}/mo included`
                                : `Blended ${formatUsd(getTraceIntelligenceRatePer1k(agentLearningPoolMonthly))}/1k`}
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
                              <span>From</span>
                              <span>To</span>
                              <span>Pre-commit</span>
                              <span>Overage</span>
                              <span>At top of band</span>
                            </div>
                            {TRACE_INTELLIGENCE_POOLS.map((pool) => (
                              <div
                                className="ti-row"
                                key={`${pool.fromLabel}-${pool.toLabel}`}
                              >
                                <span>{pool.fromLabel}</span>
                                <span>{pool.toLabel}</span>
                                <span>{pool.ratePerTrace}</span>
                                <span>{pool.overagePerTrace}</span>
                                <span>{pool.price}</span>
                              </div>
                            ))}
                          </div>
                          <p className="ti-note">
                            Progressive per-trace bands (first{' '}
                            {TRACE_INCLUDED_MONTHLY.toLocaleString('en-US')}
                            /mo at $0). Selecting Trace Intelligence adds{' '}
                            {formatUsd(TRACE_PLAN_UPLIFT_ANNUAL)}/yr to the
                            selected plan. Pool cost stacks each band up to the
                            committed monthly volume. Pool resets monthly;
                            overage bills at the overage rate. Bring-your-own
                            model: same price. Self-hosted / air-gapped: +50%.
                          </p>
                        </div>
                      )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {programs.length > 0 && !agencyMode && (
                <section className="category">
                  <div className="category-title">
                    <h3>Programs</h3>
                    <span className="category-meta">Annual</span>
                  </div>
                  <div className="items">
                    {programs.map((program) => {
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

              {internal && !agencyMode && (
                <internal.ForwardSection
                  selected={mastraForwardSelected}
                  sellRatePerHour={forwardSellRatePerHour}
                  hoursPerWeek={forwardHoursPerWeek}
                  quote={mastraForward}
                  onToggle={() => setMastraForwardSelected((v) => !v)}
                  onSellRateChange={setForwardSellRatePerHour}
                  onHoursChange={setForwardHoursPerWeek}
                />
              )}

              {internal && !agencyMode && (
                <internal.SupportSection
                  supportIds={supportIds}
                  path1BillingPeriod={path1BillingPeriod}
                  path2Hours={path2Hours}
                  path2Margins={path2Margins}
                  evalsMultiplier={evalsMultiplier}
                  onToggle={toggleSupport}
                  onBillingPeriodChange={setPath1BillingPeriod}
                  onHoursChange={setPath2DeliveryHours}
                  onMarginChange={setPath2TargetMargin}
                />
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
                              {(line.id === 'trace-intelligence' ||
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
                              {programs.some((p) => p.id === line.id) && (
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
                        {platformMargin && !isAgency && (
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

                  {internal && hasMastraForward && mastraForward && (
                    <internal.ForwardSummary
                      quote={mastraForward}
                      onRemove={() => setMastraForwardSelected(false)}
                    />
                  )}

                  {internal && hasSupport && support && (
                    <internal.SupportSummary
                      support={support}
                      headcountBand={headcountBand}
                      onRemove={removeSupport}
                    />
                  )}

                  {/* Agencies can price deals but not submit orders. */}
                  {!isAgency && (
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
                  )}
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
