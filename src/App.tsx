import { useEffect, useMemo, useState } from 'react'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  DEFAULT_PATH2_MARGIN,
  getForwardEmbeddedAmount,
  getForwardPeriodShortLabel,
  roundForwardListPrice,
  PATH1_TIERS,
  type ForwardHoursCommitment,
  PATH2_EVALS_ID,
  PATH2_PACKAGES,
  buildSupportQuote,
  getPath1ListPrice,
  getPath1PeriodLabel,
  getPath2ListPrice,
  isPath1Id,
  isPath2Id,
  withoutOtherPath1Tiers,
  type Path1BillingPeriod,
  type Path2Hours,
  type Path2Margins,
  type Path2PackageId,
} from './concierge'
import {
  ENTERPRISE_FEATURES,
  FORWARD_PLANS,
  buildForwardQuote,
  formatForwardPriceRange,
  getForwardPlan,
  getForwardPlanHoursOptions,
  getForwardTraceIncludedMonthly,
  type EnterpriseFeatureId,
  type ForwardPlanId,
} from './forwardPlans'
import {
  ADDONS,
  DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  DEFAULT_KNOWLEDGE_CONFIG,
  SOFTWARE_ADDON_IDS,
  TRACE_COST_PER_TRACE,
  TRACE_INCLUDED_MONTHLY,
  TRACE_PLAN_UPLIFT_ANNUAL,
  getTraceIntelligenceCostAnnual,
  PLANS,
  PLATFORM_PACKAGES,
  PLATFORM_USAGE_METRICS,
  TRACE_INTELLIGENCE_POOLS,
  buildPlatformMargin,
  buildQuote,
  defaultPlatformConfig,
  formatPercent,
  formatTraceUnitRate,
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
  isForwardMappedAddon,
  platformConfigFromPackage,
  type AddonId,
  type KnowledgeConfig,
  type PlanId,
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
type PricingSection = 'software' | 'services' | 'software-services'

const SOFTWARE_ADDONS = SOFTWARE_ADDON_IDS.map(
  (id) => ADDONS.find((addon) => addon.id === id)!,
)

export default function App() {
  const [page, setPage] = useState<AppPage>('order')
  const [pricingSection, setPricingSection] =
    useState<PricingSection>('software')
  const [reviewSnapshot, setReviewSnapshot] = useState<OrderSnapshot | null>(
    null,
  )
  const [planId, setPlanId] = useState<PlanId | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([])
  const [agentLearningPoolMonthly, setAgentLearningPoolMonthly] = useState(
    DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  )
  const [knowledgeConfig, setKnowledgeConfig] = useState<KnowledgeConfig>(
    DEFAULT_KNOWLEDGE_CONFIG,
  )
  const [headcount, setHeadcount] = useState<number | null>(null)
  const headcountBand = getHeadcountBand(headcount)
  const evalsMultiplier = getEvalsMultiplier(headcount)
  const [mastraForwardSelected, setMastraForwardSelected] = useState(false)
  const [forwardPlanId, setForwardPlanId] = useState<ForwardPlanId>('startup')
  const [forwardHoursPerWeek, setForwardHoursPerWeek] = useState(2)
  const [forwardHoursCommitment, setForwardHoursCommitment] =
    useState<ForwardHoursCommitment>('year')
  /** When set, annual Forward price is locked to this value (not hours × $300). */
  const [forwardAnnualOverride, setForwardAnnualOverride] = useState<
    number | null
  >(null)
  const [forwardFeaturePicks, setForwardFeaturePicks] = useState<
    EnterpriseFeatureId[]
  >([])
  const [supportIds, setSupportIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(0),
  )
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [path2Margins, setPath2Margins] = useState<Path2Margins>({})
  const [path1BillingPeriod, setPath1BillingPeriod] =
    useState<Path1BillingPeriod>('year')
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

  const forwardPlan = getForwardPlan(forwardPlanId)
  const forwardCommitment: ForwardHoursCommitment =
    forwardPlan.allowsQuarterlyHours && forwardHoursCommitment === 'quarter'
      ? 'quarter'
      : 'year'
  const forwardListAmount = getForwardEmbeddedAmount(
    forwardHoursPerWeek,
    forwardCommitment,
  )
  const forwardPlanAmount =
    forwardAnnualOverride != null
      ? Math.max(0, Math.round(forwardAnnualOverride))
      : forwardListAmount
  const forwardPeriodShort = getForwardPeriodShortLabel(forwardCommitment)

  const mastraForward = useMemo(
    () =>
      !mastraForwardSelected
        ? null
        : buildForwardQuote({
            planId: forwardPlanId,
            planAmount: forwardPlanAmount,
            hoursPerWeek: forwardHoursPerWeek,
            hoursCommitment: forwardCommitment,
            featurePicks: forwardFeaturePicks,
          }),
    [
      mastraForwardSelected,
      forwardPlanId,
      forwardPlanAmount,
      forwardHoursPerWeek,
      forwardCommitment,
      forwardFeaturePicks,
    ],
  )

  const forwardIncludedAddonIds = useMemo((): AddonId[] => {
    if (!mastraForward) return []
    return mastraForward.includedFeatureIds.filter(isForwardMappedAddon)
  }, [mastraForward])

  const forwardTraceIncludedMonthly = useMemo(() => {
    if (!forwardIncludedAddonIds.includes('trace-intelligence')) {
      return TRACE_INCLUDED_MONTHLY
    }
    return getForwardTraceIncludedMonthly(forwardPlan)
  }, [forwardIncludedAddonIds, forwardPlan])

  const traceIncludedMonthly = forwardIncludedAddonIds.includes(
    'trace-intelligence',
  )
    ? forwardTraceIncludedMonthly
    : TRACE_INCLUDED_MONTHLY

  const traceIntelligenceSelected =
    selectedAddons.includes('trace-intelligence') ||
    forwardIncludedAddonIds.includes('trace-intelligence')

  const traceIntelligenceRevenueAnnual = useMemo(() => {
    if (!traceIntelligenceSelected) return 0
    const poolOverage = getAgentLearningAnnual(
      agentLearningPoolMonthly,
      traceIncludedMonthly,
    )
    const planUplift =
      selectedAddons.includes('trace-intelligence') &&
      !forwardIncludedAddonIds.includes('trace-intelligence') &&
      planId != null
        ? TRACE_PLAN_UPLIFT_ANNUAL
        : 0
    return poolOverage + planUplift
  }, [
    traceIntelligenceSelected,
    agentLearningPoolMonthly,
    traceIncludedMonthly,
    selectedAddons,
    forwardIncludedAddonIds,
    planId,
  ])

  const traceIntelligenceCostAnnual = useMemo(() => {
    if (!traceIntelligenceSelected) return 0
    return getTraceIntelligenceCostAnnual(agentLearningPoolMonthly)
  }, [traceIntelligenceSelected, agentLearningPoolMonthly])

  const traceIntelligenceMargin = useMemo(() => {
    if (!traceIntelligenceSelected) return null
    const margin =
      traceIntelligenceRevenueAnnual - traceIntelligenceCostAnnual
    return {
      revenue: traceIntelligenceRevenueAnnual,
      cost: traceIntelligenceCostAnnual,
      margin,
      marginRate:
        traceIntelligenceRevenueAnnual > 0
          ? margin / traceIntelligenceRevenueAnnual
          : null,
    }
  }, [
    traceIntelligenceSelected,
    traceIntelligenceRevenueAnnual,
    traceIntelligenceCostAnnual,
  ])

  useEffect(() => {
    if (forwardIncludedAddonIds.length === 0) return
    setSelectedAddons((prev) =>
      prev.filter((id) => !forwardIncludedAddonIds.includes(id)),
    )
  }, [forwardIncludedAddonIds])

  useEffect(() => {
    if (!forwardIncludedAddonIds.includes('trace-intelligence')) return
    setAgentLearningPoolMonthly(forwardTraceIncludedMonthly)
  }, [forwardIncludedAddonIds, forwardTraceIncludedMonthly])

  const quote = useMemo(
    () =>
      buildQuote({
        planId,
        selectedAddonIds: selectedAddons,
        headcount,
        agentLearningPoolMonthly,
        traceIncludedMonthly,
        knowledgeConfig,
        agencyMode: false,
        platformConfig,
        includedByForwardIds: forwardIncludedAddonIds,
      }),
    [
      planId,
      selectedAddons,
      headcount,
      agentLearningPoolMonthly,
      traceIncludedMonthly,
      knowledgeConfig,
      platformConfig,
      forwardIncludedAddonIds,
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
  const hasSupport =
    support.path1 != null ||
    support.path2.length > 0 ||
    support.audit != null
  const hasMastraForward = mastraForward != null
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

    const forwardLines: OrderLineSnapshot[] = []
    if (hasMastraForward && mastraForward) {
      for (const line of mastraForward.lines) {
        forwardLines.push({
          name: line.name,
          meta: line.meta,
          listAmount: line.included ? null : line.amount,
          billedAmount: line.included ? null : line.amount,
          period: line.included ? '/ yr' : mastraForward.periodLabel,
          included: line.included,
        })
      }
    }

    const supportLines: OrderLineSnapshot[] = []
    if (support.path1) {
      supportLines.push({
        name: support.path1.tier.name,
        meta: `${support.path1.tier.hoursPerWeek} hrs/wk · ${
          support.path1.billingPeriod === 'year' ? 'Annual' : '3 months'
        }`,
        listAmount: support.path1.listAmount,
        billedAmount: support.path1.billedAmount,
        period: support.path1.periodLabel,
      })
    }
    for (const line of support.path2) {
      supportLines.push({
        name: line.package.name,
        meta:
          line.flatPrice != null
            ? line.flatMultiplier !== 1 && headcountBand
              ? `${formatUsd(line.flatPrice)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(line.flatMultiplier)} · Flat one-time`
              : 'Flat one-time'
            : `${line.hours} hrs`,
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

    return {
      planLabel: quote.plan?.name ?? 'No plan',
      headcountLabel:
        quote.headcountBand && quote.headcount != null
          ? `${quote.headcount.toLocaleString('en-US')} employees · ${quote.headcountBand.name} (${quote.headcountBand.rangeLabel})`
          : null,
      agencyModeLabel: null,
      productLines,
      productTotal: quote.annualTotal,
      forwardLines,
      forwardAnnualTotal: hasMastraForward
        ? Math.round(mastraForward!.periodTotal)
        : null,
      forwardPeriod: hasMastraForward ? '/ yr' : null,
      supportLines,
      supportPath1Total: support.path1 ? support.path1Total : null,
      supportPath1Period: support.path1 ? support.path1.periodLabel : null,
      supportOneTimeTotal:
        support.path2.length > 0 || support.audit
          ? support.oneTimeTotal
          : null,
    }
  }, [hasOrder, hasMastraForward, quote, support, mastraForward, headcountBand])

  function selectPlan(id: PlanId) {
    setPlanId(id)
  }

  function toggleAddon(id: AddonId) {
    setSelectedAddons((prev) =>
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

  function selectForwardPlan(id: ForwardPlanId) {
    const next = getForwardPlan(id)
    setForwardPlanId(id)
    setForwardHoursCommitment('year')
    const hoursOptions = getForwardPlanHoursOptions(next)
    setForwardHoursPerWeek(hoursOptions[0] ?? next.hoursMin)
    setForwardAnnualOverride(null)
    setForwardFeaturePicks([])
  }

  function applyForwardHours(hours: number) {
    const allowedHere = getForwardPlanHoursOptions(forwardPlan).includes(hours)
    if (!allowedHere) {
      const nextPlan =
        FORWARD_PLANS.find((p) =>
          getForwardPlanHoursOptions(p).includes(hours),
        ) ?? null
      if (nextPlan && nextPlan.id !== forwardPlanId) {
        setForwardPlanId(nextPlan.id)
        setForwardHoursCommitment('year')
        setForwardFeaturePicks([])
      }
    }
    setForwardHoursPerWeek(hours)
  }

  function applyForwardAnnualOverride(amount: number) {
    setForwardAnnualOverride(roundForwardListPrice(amount))
  }

  function toggleForwardFeaturePick(id: EnterpriseFeatureId) {
    setForwardFeaturePicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      const max = forwardPlan.featurePickCount
      if (max <= 0) return prev
      if (prev.length >= max) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  function clearOrder() {
    setPlanId(null)
    setSelectedAddons([])
    setHeadcount(null)
    setAgentLearningPoolMonthly(DEFAULT_AGENT_LEARNING_POOL_MONTHLY)
    setKnowledgeConfig(DEFAULT_KNOWLEDGE_CONFIG)
    setMastraForwardSelected(false)
    selectForwardPlan('startup')
    setSupportIds([])
    setPlatformConfig(defaultPlatformConfig(0))
    setPath2Hours({})
    setPath2Margins({})
    setPath1BillingPeriod('year')
    setPricingSection('software')
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
              <div
                className="pricing-section-tabs"
                role="tablist"
                aria-label="Pricing sections"
              >
                {(
                  [
                    ['software', 'Software'],
                    ['services', 'Services'],
                    ['software-services', 'Software + Services'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={`pricing-section-tab${pricingSection === id ? ' active' : ''}`}
                    aria-selected={pricingSection === id}
                    onClick={() => setPricingSection(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="pricing-section-note">
                Software and Software + Services are annual contracts. Support
                Small / Medium / Large can be 3 months or annual.
              </p>

              {pricingSection === 'software' && (
                <>
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
                    ? `${headcountBand.name} (${headcountBand.rangeLabel} employees) — multipliers apply to Enterprise Plans, Compliance, and Factory when available.`
                    : 'Enter headcount to apply size multipliers to Enterprise Plans and Compliance. Defaults to 1.0×.'}
                </p>
              </section>

              <div className="panel-head">
                <h2>Enterprise Plans</h2>
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
                  <h3>Enterprise Add-Ons</h3>
                  <span className="category-meta">Optional</span>
                </div>
                <div className="items">
                  {SOFTWARE_ADDONS.map((addon) => {
                    const coveredByForward = forwardIncludedAddonIds.includes(
                      addon.id,
                    )
                    const comingSoon = Boolean(addon.comingSoon)
                    const allowed =
                      !comingSoon &&
                      (coveredByForward || isAddonAvailable(addon, plan))
                    const selected =
                      !comingSoon &&
                      (coveredByForward || selectedAddons.includes(addon.id))
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
                      <div key={addon.id} className="item-wrap">
                      <button
                        type="button"
                        className={`item${selected ? ' selected' : ''}${!allowed || coveredByForward || comingSoon ? ' unavailable' : ''}`}
                        onClick={() => {
                          if (!allowed || coveredByForward || comingSoon) return
                          toggleAddon(addon.id)
                        }}
                        aria-pressed={selected}
                        disabled={!allowed || coveredByForward || comingSoon}
                      >
                        <span className="check" aria-hidden="true">
                          {selected ? <CheckIcon /> : null}
                        </span>
                        <span className="item-body">
                          <span className="item-name">
                            {addon.name}
                            {comingSoon ? (
                              <span className="pill">Coming Soon</span>
                            ) : coveredByForward ? (
                              <span className="pill">Included with Packages</span>
                            ) : (
                              !allowed && (
                                <span className="pill">
                                  {addon.id === 'compliance'
                                    ? 'Enterprise Platform only'
                                    : 'Enterprise only'}
                                </span>
                              )
                            )}
                          </span>
                          <p className="item-desc">{addon.description}</p>
                        </span>
                        <span className="item-price">
                          {comingSoon ? (
                            '—'
                          ) : coveredByForward ? (
                            'Included'
                          ) : !allowed ? (
                            '—'
                          ) : priced ? (
                            <>
                              {formatUsd(priced.billedAmount)}
                              <br />
                              / year
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
                      </div>
                    )
                  })}
                </div>
              </section>
                </>
              )}

              {pricingSection === 'software-services' && (
                <section className="category">
                  <div className="category-title">
                    <h3>Software + Services</h3>
                    <span className="category-meta">Annual packages</span>
                  </div>
                  <div className="items">
                    {FORWARD_PLANS.map((fwdPlan) => {
                      const selected =
                        mastraForwardSelected && forwardPlanId === fwdPlan.id
                      const hoursOptions = getForwardPlanHoursOptions(fwdPlan)
                      return (
                        <div
                          key={fwdPlan.id}
                          className={`item-wrap${selected ? ' open' : ''}`}
                        >
                          <button
                            type="button"
                            className={`item radio${selected ? ' selected' : ''}`}
                            onClick={() => {
                              if (selected) {
                                setMastraForwardSelected(false)
                                return
                              }
                              selectForwardPlan(fwdPlan.id)
                              setMastraForwardSelected(true)
                            }}
                            aria-pressed={selected}
                          >
                            <span className="check" aria-hidden="true" />
                            <span className="item-body">
                              <span className="item-name">
                                Mastra {fwdPlan.name}
                              </span>
                              <p className="item-desc">
                                {fwdPlan.description}{' '}
                                {fwdPlan.featurePickCount > 0
                                  ? `Pick ${fwdPlan.featurePickCount} of ${fwdPlan.featurePool.length} enterprise features.`
                                  : 'All 3 enterprise features included.'}{' '}
                                Hours: {hoursOptions.join(' / ')} per week.
                              </p>
                            </span>
                            <span className="item-price">
                              {selected && hasMastraForward ? (
                                <>
                                  {formatUsd(
                                    Math.round(mastraForward!.periodTotal),
                                  )}
                                  <br />
                                  {forwardPeriodShort}
                                </>
                              ) : (
                                <>
                                  {formatForwardPriceRange(fwdPlan)}
                                  <br />
                                  / yr
                                </>
                              )}
                            </span>
                          </button>
                          {selected && (
                        <div className="path2-pricing forward-plan-panel">
                          <div>
                            <div className="concierge-subhead">
                              <h4>Hours / week</h4>
                              <p>
                                {forwardPlan.hoursNote}
                                {forwardAnnualOverride != null
                                  ? ' · annual price overridden'
                                  : ''}
                              </p>
                            </div>
                            <div
                              className="mode-picker forward-option-picker"
                              role="radiogroup"
                              aria-label="Software + Services hours per week"
                            >
                              {getForwardPlanHoursOptions(forwardPlan).map(
                                (hours) => (
                                  <button
                                    key={hours}
                                    type="button"
                                    className={`mode-option${
                                      forwardHoursPerWeek === hours
                                        ? ' active'
                                        : ''
                                    }`}
                                    role="radio"
                                    aria-checked={
                                      forwardHoursPerWeek === hours
                                    }
                                    onClick={() => applyForwardHours(hours)}
                                  >
                                    <strong>{hours}</strong>
                                    <span>
                                      {formatUsd(
                                        getForwardEmbeddedAmount(
                                          hours,
                                          forwardCommitment,
                                        ),
                                      )}
                                      /yr list
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                            <div className="ti-input-row">
                              <label htmlFor="forward-plan-annual">
                                Annual price
                                {forwardAnnualOverride != null
                                  ? ' (override)'
                                  : ` (list ${formatUsd(forwardListAmount)})`}
                              </label>
                              <NumberField
                                id="forward-plan-annual"
                                value={forwardPlanAmount}
                                min={0}
                                onCommit={(next) =>
                                  applyForwardAnnualOverride(next ?? 0)
                                }
                                aria-label="Software + Services annual subscription price"
                              />
                            </div>
                            {forwardAnnualOverride != null && (
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => setForwardAnnualOverride(null)}
                              >
                                Reset to list (
                                {formatUsd(forwardListAmount)}
                                /yr)
                              </button>
                            )}
                          </div>

                          {(forwardPlan.featurePickCount > 0 ||
                            forwardPlan.includedFeatures.length > 0) && (
                            <div>
                              <div className="concierge-subhead">
                                <h4>Enterprise features</h4>
                                <p>
                                  {forwardPlan.featurePickCount > 0
                                    ? `Pick ${forwardPlan.featurePickCount} of ${forwardPlan.featurePool.length}`
                                    : 'All features included'}
                                </p>
                              </div>
                              <div className="items">
                                {ENTERPRISE_FEATURES.map((feature) => {
                                  const alwaysIncluded =
                                    forwardPlan.includedFeatures.includes(
                                      feature.id,
                                    )
                                  const inPool =
                                    forwardPlan.featurePool.includes(feature.id)
                                  if (!alwaysIncluded && !inPool) return null
                                  const picked =
                                    alwaysIncluded ||
                                    forwardFeaturePicks.includes(feature.id)
                                  const showForwardTi =
                                    feature.id === 'trace-intelligence' &&
                                    picked
                                  return (
                                    <div
                                      key={feature.id}
                                      className={`item-wrap${showForwardTi ? ' open' : ''}`}
                                    >
                                      <button
                                        type="button"
                                        className={`item${picked ? ' selected' : ''}${alwaysIncluded ? ' unavailable' : ''}`}
                                        onClick={() => {
                                          if (alwaysIncluded) return
                                          toggleForwardFeaturePick(feature.id)
                                        }}
                                        aria-pressed={picked}
                                        disabled={alwaysIncluded}
                                      >
                                        <span
                                          className="check"
                                          aria-hidden="true"
                                        >
                                          {picked ? <CheckIcon /> : null}
                                        </span>
                                        <span className="item-body">
                                          <span className="item-name">
                                            {feature.name}
                                            {alwaysIncluded && (
                                              <span className="pill">
                                                Included
                                              </span>
                                            )}
                                          </span>
                                          <p className="item-desc">
                                            {feature.description}
                                          </p>
                                        </span>
                                        <span className="item-price">
                                          {alwaysIncluded || picked
                                            ? 'Included'
                                            : 'Pick'}
                                        </span>
                                      </button>
                                      {showForwardTi && (
                                        <div className="ti-panel">
                                          <div className="platform-usage-intro">
                                            <strong>Volume pricing</strong>
                                            <span>
                                              Analyzed traces / month ·{' '}
                                              {forwardTraceIncludedMonthly.toLocaleString(
                                                'en-US',
                                              )}{' '}
                                              included
                                            </span>
                                          </div>
                                          <div className="ti-input-row">
                                            <label htmlFor="forward-trace-intelligence-pool">
                                              Monthly pool (analyzed traces)
                                            </label>
                                            <NumberField
                                              id="forward-trace-intelligence-pool"
                                              value={agentLearningPoolMonthly}
                                              min={forwardTraceIncludedMonthly}
                                              onCommit={(next) =>
                                                setAgentLearningPoolMonthly(
                                                  Math.max(
                                                    forwardTraceIncludedMonthly,
                                                    next ??
                                                      forwardTraceIncludedMonthly,
                                                  ),
                                                )
                                              }
                                              aria-label="Agent Learning monthly pool, analyzed traces"
                                            />
                                          </div>
                                          <div className="ti-computed">
                                            <span>
                                              {agentLearningPoolMonthly <=
                                              forwardTraceIncludedMonthly
                                                ? `${forwardTraceIncludedMonthly.toLocaleString('en-US')}/mo included`
                                                : `Blended ${formatUsd(getTraceIntelligenceRatePer1k(agentLearningPoolMonthly, forwardTraceIncludedMonthly))}/1k`}
                                            </span>
                                            <span>
                                              {formatUsd(
                                                getAgentLearningMonthly(
                                                  agentLearningPoolMonthly,
                                                  forwardTraceIncludedMonthly,
                                                ),
                                              )}
                                              /mo
                                            </span>
                                            <span>
                                              {formatUsd(
                                                getAgentLearningAnnual(
                                                  agentLearningPoolMonthly,
                                                  forwardTraceIncludedMonthly,
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
                                            {TRACE_INTELLIGENCE_POOLS.map(
                                              (pool) => (
                                                <div
                                                  className="ti-row"
                                                  key={`${pool.fromLabel}-${pool.toLabel}`}
                                                >
                                                  <span>{pool.fromLabel}</span>
                                                  <span>{pool.toLabel}</span>
                                                  <span>
                                                    {pool.ratePerTrace}
                                                  </span>
                                                  <span>
                                                    {pool.overagePerTrace}
                                                  </span>
                                                  <span>{pool.price}</span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                          <p className="ti-note">
                                            {forwardPlan.name} includes{' '}
                                            {forwardTraceIncludedMonthly.toLocaleString(
                                              'en-US',
                                            )}{' '}
                                            traces/mo at $0. Plan uplift of{' '}
                                            {formatUsd(TRACE_PLAN_UPLIFT_ANNUAL)}
                                            /yr is waived. Pool overage above
                                            the include still bills on the
                                            progressive bands.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {forwardPlan.allowsPrivateDeployment && (
                            <p className="item-desc">
                              Enterprise includes BYO VPC / BYOC / private cloud
                              deployment options (priced via Enterprise Plans on
                              the Software tab).
                            </p>
                          )}
                        </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}


              {pricingSection === 'services' && (
              <section className="category concierge-section">
                <div className="category-title">
                  <h3>Services</h3>
                  <span className="category-meta">Support packages</span>
                </div>

                <div className="items">
                  {PATH1_TIERS.map((tier) => {
                    const selected = selectedPath1Id === tier.id
                    const price = getPath1ListPrice(tier, path1BillingPeriod)
                    const periodLabel = getPath1PeriodLabel(path1BillingPeriod)
                    return (
                      <div
                        key={tier.id}
                        className={`item-wrap${selected ? ' open' : ''}`}
                      >
                        <button
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
                              Ongoing engineering support
                              {path1BillingPeriod === 'quarter'
                                ? ` · ${formatUsd(tier.annualPrice)} annual`
                                : ` · ${formatUsd(tier.quarterlyPrice)}/qtr`}
                            </p>
                          </span>
                          <span className="item-price">
                            {formatUsd(price)}
                            <br />
                            {periodLabel}
                          </span>
                        </button>
                        {selected && (
                          <div className="path2-pricing">
                            <div className="concierge-subhead">
                              <h4>Contract length</h4>
                            </div>
                            <div
                              className="mode-picker path1-billing-picker"
                              role="radiogroup"
                              aria-label={`${tier.name} contract length`}
                            >
                              <button
                                type="button"
                                className={`mode-option${path1BillingPeriod === 'quarter' ? ' active' : ''}`}
                                role="radio"
                                aria-checked={path1BillingPeriod === 'quarter'}
                                onClick={() => setPath1BillingPeriod('quarter')}
                              >
                                <strong>3 months</strong>
                                <span>
                                  {formatUsd(tier.quarterlyPrice)}/qtr
                                </span>
                              </button>
                              <button
                                type="button"
                                className={`mode-option${path1BillingPeriod === 'year' ? ' active' : ''}`}
                                role="radio"
                                aria-checked={path1BillingPeriod === 'year'}
                                onClick={() => setPath1BillingPeriod('year')}
                              >
                                <strong>Annual</strong>
                                <span>
                                  {formatUsd(tier.annualPrice)}/yr
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {PATH2_PACKAGES.filter((pkg) => pkg.id !== PATH2_EVALS_ID).map(
                    (pkg) => {
                    const selected = supportIds.includes(pkg.id)
                    const hours = path2Hours[pkg.id] ?? 0
                    const targetMargin =
                      path2Margins[pkg.id] ?? DEFAULT_PATH2_MARGIN
                    const listPrice = getPath2ListPrice(
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
                            <span className="item-name">{pkg.name}</span>
                            <p className="item-desc">
                              Fixed-scope delivery. Set project hours to price.
                            </p>
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
                        {selected && (
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
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                              {(line.id === 'trace-intelligence' ||
                                line.id === 'agent-builder' ||
                                line.id === 'mastra-knowledge' ||
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
                        {traceIntelligenceMargin &&
                          !forwardIncludedAddonIds.includes(
                            'trace-intelligence',
                          ) && (
                            <div className="total-row muted">
                              <span>
                                Agent Learning margin (COGS{' '}
                                {formatTraceUnitRate(TRACE_COST_PER_TRACE)}
                                /trace)
                              </span>
                              <span>
                                {formatUsd(
                                  Math.round(traceIntelligenceMargin.margin),
                                )}
                                {traceIntelligenceMargin.marginRate != null
                                  ? ` (${formatPercent(traceIntelligenceMargin.marginRate)})`
                                  : ''}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {hasMastraForward && mastraForward && (
                    <div className="summary-group">
                      <h3 className="summary-group-title">Software + Services</h3>
                      <ul className="order-lines">
                        {mastraForward.lines.map((line, index) => (
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
                              {line.included ? (
                                <span className="order-line-meta">
                                  Included
                                </span>
                              ) : (
                                <>
                                  {formatUsd(line.amount)}
                                  <span className="order-line-meta">
                                    {mastraForward.periodLabel}
                                  </span>
                                </>
                              )}
                            </span>
                            {index === 0 && (
                              <button
                                type="button"
                                className="remove"
                                onClick={() => setMastraForwardSelected(false)}
                                aria-label="Remove Software + Services"
                              >
                                <CloseIcon />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="totals">
                        <div className="total-row grand">
                          <span>Software + Services / year</span>
                          <span>
                            {formatUsd(Math.round(mastraForward.periodTotal))}
                          </span>
                        </div>
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
                                {support.path1.tier.name}
                              </span>
                              <span className="order-line-meta">
                                {support.path1.tier.hoursPerWeek} hrs/wk ·{' '}
                                {support.path1.billingPeriod === 'year'
                                  ? 'Annual'
                                  : '3 months'}
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
                              aria-label={`Remove ${support.path1.tier.name}`}
                            >
                              <CloseIcon />
                            </button>
                          </li>
                        )}
                        {support.path2.map((line) => (
                          <li className="order-line" key={line.package.id}>
                            <div>
                              <span className="order-line-name">
                                {line.package.name}
                              </span>
                              <span className="order-line-meta">
                                {line.flatPrice != null
                                  ? line.flatMultiplier !== 1 && headcountBand
                                    ? `${formatUsd(line.flatPrice)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(line.flatMultiplier)} · Flat one-time`
                                    : 'Flat one-time'
                                  : `${line.hours} hrs`}
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
