import { useEffect, useMemo, useState } from 'react'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  DEFAULT_PATH2_MARGIN,
  PATH1_TIERS,
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
  BUILDER_SEAT_MONTHLY,
  DPP_ALLOWED_PLANS,
  PLANS,
  PLATFORM_PACKAGES,
  PLATFORM_USAGE_METRICS,
  buildPlatformMargin,
  buildQuote,
  clampSeats,
  defaultPlatformConfig,
  formatPercent,
  formatUnitCost,
  formatUsd,
  getAdditionalUsageUnitPrice,
  getPlan,
  isAddonAvailable,
  platformConfigFromPackage,
  type AddonId,
  type PlanId,
  type PlatformConfig,
  type PlatformPackageId,
  type SeatCounts,
} from './pricing'
import TablesPage from './TablesPage'
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

type AppPage = 'order' | 'tables' | 'review'

export default function App() {
  const [page, setPage] = useState<AppPage>('order')
  const [reviewSnapshot, setReviewSnapshot] = useState<OrderSnapshot | null>(
    null,
  )
  const [planId, setPlanId] = useState<PlanId>('teams')
  const [seats, setSeats] = useState<SeatCounts>({
    developer: 5,
    builder: 0,
    viewer: 0,
  })
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([])
  const [designPartner, setDesignPartner] = useState(false)
  const [agency, setAgency] = useState(false)
  const [supportIds, setSupportIds] = useState<string[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    defaultPlatformConfig(0),
  )
  const [path2Hours, setPath2Hours] = useState<Path2Hours>({})
  const [path2Margins, setPath2Margins] = useState<Path2Margins>({})
  const [path1BillingPeriod, setPath1BillingPeriod] =
    useState<Path1BillingPeriod>('quarter')
  const [engineerCostPerHour] = useState(DEFAULT_ENGINEER_COST_PER_HOUR)

  const plan = getPlan(planId)

  useEffect(() => {
    setSeats((prev) => clampSeats(getPlan(planId), prev))
    setSelectedAddons((prev) =>
      prev.filter((id) => {
        const addon = ADDONS.find((a) => a.id === id)
        return addon != null && isAddonAvailable(addon, getPlan(planId))
      }),
    )
    if (designPartner && !DPP_ALLOWED_PLANS.includes(planId)) {
      setDesignPartner(false)
    }
  }, [planId, designPartner])

  const quote = useMemo(
    () =>
      buildQuote({
        planId,
        seats,
        selectedAddonIds: selectedAddons,
        designPartner,
        agency,
        platformConfig,
      }),
    [planId, seats, selectedAddons, designPartner, agency, platformConfig],
  )

  const usageScaleAnnual = quote.seatPricing.seatContract

  useEffect(() => {
    if (!quote.plan.hasUsage || designPartner) return
    setPlatformConfig((prev) => {
      const scaled = platformConfigFromPackage(prev.packageId, usageScaleAnnual)
      return { ...scaled, additional: prev.additional }
    })
  }, [usageScaleAnnual, quote.plan.hasUsage, designPartner])

  const support = useMemo(
    () =>
      buildSupportQuote(
        supportIds,
        path2Hours,
        path2Margins,
        engineerCostPerHour,
        path1BillingPeriod,
      ),
    [
      supportIds,
      path2Hours,
      path2Margins,
      engineerCostPerHour,
      path1BillingPeriod,
    ],
  )

  const margin = useMemo(
    () => buildSupportMargin(support, engineerCostPerHour),
    [support, engineerCostPerHour],
  )

  const showUsage = quote.plan.hasUsage && !designPartner

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
    support.path1 != null || support.path2.length > 0 || support.audit != null
  const hasProducts = quote.productLines.length > 0
  const hasOrder = hasProducts || hasSupport

  const orderSnapshot = useMemo((): OrderSnapshot | null => {
    if (!hasOrder) return null

    const productLines: OrderLineSnapshot[] = quote.productLines.map(
      (line) => ({
        name: line.name,
        meta: line.meta,
        listAmount: line.annualAmount,
        billedAmount: line.annualAmount,
        period: '/ yr',
        noBaseFee: line.annualAmount === 0 && line.id === 'plan',
      }),
    )

    // Restore list amount when DPP Agent Learning credit applies
    for (const addonLine of quote.addonPricing.lines) {
      if (
        !(designPartner && addonLine.addon.id === 'agent-learning') ||
        addonLine.listAmount === addonLine.billedAmount
      ) {
        continue
      }
      const snap = productLines.find((l) => l.name === addonLine.addon.name)
      if (snap) {
        snap.listAmount = addonLine.listAmount
        snap.billedAmount = addonLine.billedAmount
      }
    }

    const supportLines: OrderLineSnapshot[] = []
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
        meta: `${line.hours} hrs · ${formatPercent(line.targetMarginRate)} target`,
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
      planLabel: quote.plan.name,
      seatsLabel: `${quote.seats.developer} developer · ${quote.seats.builder} builder · ${quote.seats.viewer} viewer`,
      programLabel: designPartner
        ? 'Design Partner'
        : agency
          ? 'Agency Partner'
          : null,
      productLines,
      productTotal: quote.annualTotal,
      supportLines,
      supportPath1Total: support.path1 ? support.path1Total : null,
      supportPath1Period: support.path1 ? support.path1.periodLabel : null,
      supportOneTimeTotal:
        support.path2.length > 0 || support.audit
          ? support.oneTimeTotal
          : null,
    }
  }, [hasOrder, quote, support, designPartner, agency])

  function setSeatCount(key: keyof SeatCounts, count: number) {
    setSeats(
      clampSeats(plan, {
        ...seats,
        [key]: Math.max(0, Math.floor(count)),
      }),
    )
  }

  function selectPlan(id: PlanId) {
    setPlanId(id)
    const nextPlan = getPlan(id)
    setSeats(
      clampSeats(nextPlan, {
        developer: nextPlan.includedDeveloperSeats,
        builder: seats.builder,
        viewer: seats.viewer,
      }),
    )
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
    setPlanId('teams')
    setSeats({ developer: 5, builder: 0, viewer: 0 })
    setSelectedAddons([])
    setDesignPartner(false)
    setAgency(false)
    setSupportIds([])
    setPlatformConfig(defaultPlatformConfig(0))
    setPath2Hours({})
    setPath2Margins({})
    setPath1BillingPeriod('quarter')
  }

  const maxDev = designPartner
    ? 25
    : plan.maxDeveloperSeats
  const maxBuilder = designPartner ? 25 : null
  const dppPlanOk = DPP_ALLOWED_PLANS.includes(planId)

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
            className={`nav-tab${page === 'tables' ? ' active' : ''}`}
            onClick={() => setPage('tables')}
            aria-current={page === 'tables' ? 'page' : undefined}
          >
            Tables
          </button>
        </nav>
      </header>

      {page === 'tables' ? (
        <TablesPage />
      ) : page === 'review' && reviewSnapshot ? (
        <ReviewPage
          order={reviewSnapshot}
          onBack={() => {
            setReviewSnapshot(null)
            setPage('order')
          }}
          onSubmitted={clearOrder}
        />
      ) : (
        <>
          <section className="hero animate-in delay-1">
            <h1>Build an order. Adjust as you go.</h1>
          </section>

          <div className="layout animate-in delay-2">
            <div className="panel">
              <div className="panel-head">
                <h2>Plan</h2>
              </div>
              <div className="items">
                {PLANS.map((p) => {
                  const selected = planId === p.id
                  const dppBlocked =
                    designPartner && !DPP_ALLOWED_PLANS.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      className={`item-wrap${selected ? ' open' : ''}`}
                    >
                      <button
                        type="button"
                        className={`item radio${selected ? ' selected' : ''}${dppBlocked ? ' unavailable' : ''}`}
                        onClick={() => {
                          if (dppBlocked) return
                          selectPlan(p.id)
                        }}
                        aria-pressed={selected}
                        disabled={dppBlocked}
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
                          {p.id === 'free' ? (
                            <>
                              $0
                              <br />
                              / forever
                            </>
                          ) : p.flatMonthly != null ? (
                            <>
                              {formatUsd(p.flatMonthly)}
                              <br />
                              / month
                            </>
                          ) : (
                            <>
                              {formatUsd(p.annualMinimum)}
                              <br />
                              / yr min
                            </>
                          )}
                        </span>
                      </button>

                      {selected && (
                        <>
                          <div className="plan-seats">
                            <div className="size-row seats-row">
                              <div className="field">
                                <label htmlFor="developer-seats">
                                  Developer
                                </label>
                                <NumberField
                                  id="developer-seats"
                                  value={seats.developer}
                                  min={
                                    plan.id === 'free'
                                      ? 1
                                      : plan.isEnterprise
                                        ? plan.includedDeveloperSeats
                                        : 1
                                  }
                                  max={maxDev ?? undefined}
                                  disabled={plan.id === 'free'}
                                  onCommit={(next) =>
                                    setSeatCount('developer', next ?? 0)
                                  }
                                />
                                {maxDev != null && (
                                  <span className="field-hint">
                                    Max {maxDev}
                                  </span>
                                )}
                                {plan.isEnterprise && !designPartner && (
                                  <span className="field-hint">
                                    Min {plan.includedDeveloperSeats} included
                                  </span>
                                )}
                                {quote.seatPricing.developerMonthlyRate >
                                  0 && (
                                  <span className="field-hint seat-rate-hint">
                                    Developer rate:{' '}
                                    <strong>
                                      {formatUsd(
                                        quote.seatPricing.developerMonthlyRate,
                                      )}
                                      /seat/mo
                                    </strong>{' '}
                                    at {quote.seats.developer} seats
                                    {quote.seatPricing.minimumApplied
                                      ? ` · ${formatUsd(quote.plan.annualMinimum)}/yr min binds`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              <div className="field">
                                <label htmlFor="builder-seats">
                                  Builder ({formatUsd(BUILDER_SEAT_MONTHLY)}
                                  /mo)
                                </label>
                                <NumberField
                                  id="builder-seats"
                                  value={seats.builder}
                                  min={0}
                                  max={maxBuilder ?? undefined}
                                  disabled={plan.id === 'free'}
                                  onCommit={(next) =>
                                    setSeatCount('builder', next ?? 0)
                                  }
                                />
                                {maxBuilder != null && (
                                  <span className="field-hint">
                                    Max {maxBuilder}
                                  </span>
                                )}
                              </div>
                              <div className="field">
                                <label htmlFor="viewer-seats">
                                  Viewer ($0)
                                </label>
                                <NumberField
                                  id="viewer-seats"
                                  value={seats.viewer}
                                  min={0}
                                  onCommit={(next) =>
                                    setSeatCount('viewer', next ?? 0)
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {p.hasUsage && showUsage && (
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
                                  Usage include scale (seat contract)
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
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <section className="category">
                <div className="category-title">
                  <h3>Add-ons</h3>
                  <span className="category-meta">
                    % of seat contract
                  </span>
                </div>
                <div className="items">
                  {ADDONS.map((addon) => {
                    const allowed = isAddonAvailable(addon, plan)
                    const selected = selectedAddons.includes(addon.id)
                    const priced = quote.addonPricing.lines.find(
                      (l) => l.addon.id === addon.id,
                    )
                    return (
                      <button
                        key={addon.id}
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
                                {plan.id === 'free'
                                  ? 'Not on Free'
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
                          ) : (
                            <>
                              {formatPercent(addon.rate)}
                              <br />
                              {addon.annualMinimum > 0
                                ? `${formatUsd(addon.annualMinimum)} min`
                                : 'of contract'}
                            </>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="category">
                <div className="category-title">
                  <h3>Programs</h3>
                  <span className="category-meta">Optional</span>
                </div>
                <div className="items">
                  <button
                    type="button"
                    className={`item${agency ? ' selected' : ''}${designPartner ? ' unavailable' : ''}`}
                    onClick={() => {
                      if (designPartner) return
                      setAgency((v) => !v)
                    }}
                    aria-pressed={agency}
                    disabled={designPartner}
                  >
                    <span className="check" aria-hidden="true">
                      {agency ? <CheckIcon /> : null}
                    </span>
                    <span className="item-body">
                      <span className="item-name">
                        Mastra Agency Partner Program
                      </span>
                      <p className="item-desc">
                        Program fee. Agency client pass-through pricing is
                        unpublished.
                      </p>
                    </span>
                    <span className="item-price">
                      {formatUsd(10_000)}
                      <br />
                      / year
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`item${designPartner ? ' selected' : ''}${
                      !dppPlanOk && !designPartner ? ' unavailable' : ''
                    }`}
                    onClick={() => {
                      if (!dppPlanOk && !designPartner) return
                      setDesignPartner((v) => {
                        const next = !v
                        if (next) setAgency(false)
                        return next
                      })
                    }}
                    aria-pressed={designPartner}
                    disabled={!dppPlanOk && !designPartner}
                  >
                    <span className="check" aria-hidden="true">
                      {designPartner ? <CheckIcon /> : null}
                    </span>
                    <span className="item-body">
                      <span className="item-name">
                        Design Partner Program
                        {!dppPlanOk && !designPartner && (
                          <span className="pill">Platform or Self-Hosted</span>
                        )}
                      </span>
                      <p className="item-desc">
                        Up to 25 developer + 25 builder seats, $250/mo Agent
                        Learning credit, one quarter Small support. Not
                        available with BYOC, BYO VPC, or Private Cloud.
                      </p>
                    </span>
                    <span className="item-price">
                      {formatUsd(12_000)}
                      <br />
                      / year
                    </span>
                  </button>
                </div>
              </section>

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
                                {formatUsd(line.annualAmount)}
                                <span className="order-line-meta">/ yr</span>
                              </span>
                              {(line.id === 'agent-learning' ||
                                line.id === 'compliance' ||
                                line.id === 'premium-on-call' ||
                                line.id === 'program-agency' ||
                                line.id === 'program-design-partner') && (
                                <button
                                  type="button"
                                  className="remove"
                                  onClick={() => {
                                    if (line.id === 'program-agency') {
                                      setAgency(false)
                                    } else if (
                                      line.id === 'program-design-partner'
                                    ) {
                                      setDesignPartner(false)
                                    } else {
                                      toggleAddon(line.id as AddonId)
                                    }
                                  }}
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
                                {line.hours} hrs ·{' '}
                                {formatPercent(line.targetMarginRate)} target
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
                  Select a plan and seats to build an order.
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
