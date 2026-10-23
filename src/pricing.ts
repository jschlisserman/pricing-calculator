/** Deployment plans — fixed annual subscription fee per plan. */

export type PlanId =
  | 'enterprise-platform'
  | 'enterprise-self-hosted'
  | 'byovpc'
  | 'private-cloud'
  | 'byoc'

export interface Plan {
  id: PlanId
  name: string
  description: string
  features: string[]
  /** Fixed annual subscription fee. */
  annualFee: number
  /** Hosted Platform — usage packages apply. */
  hasUsage: boolean
  future?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'enterprise-platform',
    name: 'Enterprise (Platform)',
    description:
      'Auth, SSO, RBAC, FGA, SLA, SOC 2 report, data residency. Annual invoice, usage drawn from a commit.',
    features: [],
    annualFee: 10_000,
    hasUsage: true,
  },
  {
    id: 'enterprise-self-hosted',
    name: 'Enterprise Self-Hosted (Helm Chart)',
    description:
      'Same as Enterprise. The uplift covers usage that cannot be metered.',
    features: [],
    annualFee: 15_000,
    hasUsage: false,
  },
  {
    id: 'byovpc',
    name: 'BYO VPC',
    description: 'Customer data plane; Mastra control plane.',
    features: [],
    annualFee: 40_000,
    hasUsage: false,
  },
  {
    id: 'private-cloud',
    name: 'Private Cloud',
    description: 'Mastra-operated, dedicated environment.',
    features: [],
    annualFee: 60_000,
    hasUsage: false,
  },
  {
    id: 'byoc',
    name: 'BYOC',
    description: "Mastra-operated in the customer's cloud account.",
    features: [],
    annualFee: 120_000,
    hasUsage: false,
  },
]

export function getPlan(planId: PlanId): Plan {
  return PLANS.find((p) => p.id === planId) ?? PLANS[0]
}

// —— Headcount multipliers ——

export type HeadcountBandId =
  | 'startup'
  | 'smb'
  | 'growth'
  | 'venture'
  | 'enterprise'
  | 'enterprise-plus'
  | 'global'
  | 'global-plus'

export interface HeadcountBand {
  id: HeadcountBandId
  name: string
  min: number
  max: number | null
  /** Display range, e.g. "100–249" or "10,000+". */
  rangeLabel: string
}

export const HEADCOUNT_BANDS: HeadcountBand[] = [
  { id: 'startup', name: 'Startup', min: 1, max: 24, rangeLabel: '1–24' },
  { id: 'smb', name: 'SMB', min: 25, max: 99, rangeLabel: '25–99' },
  { id: 'growth', name: 'Growth', min: 100, max: 249, rangeLabel: '100–249' },
  { id: 'venture', name: 'Venture', min: 250, max: 499, rangeLabel: '250–499' },
  { id: 'enterprise', name: 'Enterprise', min: 500, max: 999, rangeLabel: '500–999' },
  { id: 'enterprise-plus', name: 'Enterprise+', min: 1000, max: 4999, rangeLabel: '1,000–4,999' },
  { id: 'global', name: 'Global', min: 5000, max: 9999, rangeLabel: '5,000–9,999' },
  { id: 'global-plus', name: 'Global+', min: 10000, max: null, rangeLabel: '10,000+' },
]

/** Band for a company headcount; null when no headcount is entered. */
export function getHeadcountBand(
  headcount: number | null | undefined,
): HeadcountBand | null {
  if (headcount == null || !Number.isFinite(headcount) || headcount < 1) {
    return null
  }
  return (
    HEADCOUNT_BANDS.find(
      (band) =>
        headcount >= band.min && (band.max == null || headcount <= band.max),
    ) ?? null
  )
}

export function formatMultiplier(multiplier: number): string {
  return Number.isInteger(multiplier)
    ? `${multiplier}.0×`
    : `${multiplier}×`
}

type BandMultipliers = Record<HeadcountBandId, number>

const STANDARD_PLAN_MULTIPLIERS: BandMultipliers = {
  startup: 0.6,
  smb: 1,
  growth: 1.5,
  venture: 2,
  enterprise: 2.5,
  'enterprise-plus': 3,
  global: 4,
  'global-plus': 5,
}

const VPC_PLAN_MULTIPLIERS: BandMultipliers = {
  startup: 0.6,
  smb: 1,
  growth: 1.5,
  venture: 2,
  enterprise: 2.5,
  'enterprise-plus': 3,
  global: 3.5,
  'global-plus': 4,
}

const BYOC_MULTIPLIERS: BandMultipliers = {
  startup: 0.6,
  smb: 1,
  growth: 1.25,
  venture: 1.5,
  enterprise: 1.75,
  'enterprise-plus': 2,
  global: 2.25,
  'global-plus': 2.5,
}

/** Headcount multiplier applied to each plan's annual subscription fee. */
export const PLAN_HEADCOUNT_MULTIPLIERS: Record<PlanId, BandMultipliers> = {
  'enterprise-platform': STANDARD_PLAN_MULTIPLIERS,
  'enterprise-self-hosted': STANDARD_PLAN_MULTIPLIERS,
  byovpc: VPC_PLAN_MULTIPLIERS,
  'private-cloud': VPC_PLAN_MULTIPLIERS,
  byoc: BYOC_MULTIPLIERS,
}

/** Headcount multiplier applied to flat-fee add-ons (Agent Learning excluded). */
export const ADDON_HEADCOUNT_MULTIPLIERS: Partial<
  Record<AddonId, BandMultipliers>
> = {
  'agent-builder': VPC_PLAN_MULTIPLIERS,
  compliance: BYOC_MULTIPLIERS,
  'premium-on-call': BYOC_MULTIPLIERS,
}

export function getPlanMultiplier(
  planId: PlanId,
  headcount: number | null | undefined,
): number {
  const band = getHeadcountBand(headcount)
  return band ? PLAN_HEADCOUNT_MULTIPLIERS[planId][band.id] : 1
}

export function getAddonMultiplier(
  addonId: AddonId,
  headcount: number | null | undefined,
): number {
  const band = getHeadcountBand(headcount)
  if (!band) return 1
  return ADDON_HEADCOUNT_MULTIPLIERS[addonId]?.[band.id] ?? 1
}

/** Headcount multipliers for Path 2 Evals — same curve as Compliance / Premium On-Call. */
export const EVALS_HEADCOUNT_MULTIPLIERS: BandMultipliers = BYOC_MULTIPLIERS

export function getEvalsMultiplier(
  headcount: number | null | undefined,
): number {
  const band = getHeadcountBand(headcount)
  return band ? EVALS_HEADCOUNT_MULTIPLIERS[band.id] : 1
}

export type AddonId =
  | 'agent-learning'
  | 'agent-builder'
  | 'compliance'
  | 'premium-on-call'

export interface Addon {
  id: AddonId
  name: string
  description: string
  /** Fraction of the plan subscription; null when flat-priced. */
  rate: number | null
  /** Annual floor; 0 = no floor. */
  annualMinimum: number
  /** Flat annual subscription fee; when set, rate/minimum do not apply. */
  flatAnnual?: number
  /** Plans this add-on can be purchased with; undefined = all plans. */
  allowedPlanIds?: PlanId[]
  /** Enterprise only. */
  enterpriseOnly: boolean
}

export const ADDONS: Addon[] = [
  {
    id: 'agent-learning',
    name: 'Agent Learning',
    description:
      'Trace Intelligence, Custom Signals · 10k analyzed traces/mo included',
    rate: null,
    annualMinimum: 0,
    enterpriseOnly: true,
  },
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    description: 'Agent Builder add-on. Fixed annual subscription.',
    rate: null,
    annualMinimum: 0,
    flatAnnual: 6_000,
    enterpriseOnly: true,
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'BAA, HIPAA, and audit logging.',
    rate: null,
    annualMinimum: 0,
    flatAnnual: 5_000,
    allowedPlanIds: ['enterprise-platform'],
    enterpriseOnly: true,
  },
  {
    id: 'premium-on-call',
    name: 'Premium on-call support',
    description:
      'Slack escalation and response commitments beyond the standard SLA.',
    rate: null,
    annualMinimum: 0,
    flatAnnual: 10_000,
    allowedPlanIds: ['enterprise-platform', 'enterprise-self-hosted'],
    enterpriseOnly: true,
  },
]

export interface TraceIntelligencePool {
  monthlyPool: string
  ratePer1k: string
  price: string
}

/** Trace Intelligence pools shown on Agent Learning (Enterprise terms). */
export const TRACE_INTELLIGENCE_POOLS: TraceIntelligencePool[] = [
  { monthlyPool: '1M', ratePer1k: '$5.00', price: '$5,000/mo · $60,000/yr' },
  { monthlyPool: '5M', ratePer1k: 'Custom', price: 'Annual commit' },
  { monthlyPool: '10M+', ratePer1k: '~$2.10', price: 'Annual commit' },
]

/** Analyzed traces included each month before an add-on pool is purchased. */
export const TRACE_INCLUDED_MONTHLY = 10_000

/** Default add-on pool (analyzed traces/mo) when Agent Learning is selected. */
export const DEFAULT_AGENT_LEARNING_POOL_MONTHLY = 1_000_000

/**
 * Add-on pool rate per 1k analyzed traces: $5.00 at 1M/mo, declining
 * linearly to ~$2.10 at 10M/mo and flat above that.
 */
export function getTraceIntelligenceRatePer1k(poolMonthly: number): number {
  const pool = Math.max(0, poolMonthly)
  if (pool <= 1_000_000) return 5
  if (pool >= 10_000_000) return 2.1
  const fraction = (pool - 1_000_000) / 9_000_000
  return 5 - fraction * (5 - 2.1)
}

/** Monthly cost of an Agent Learning add-on pool (analyzed traces/mo). */
export function getAgentLearningMonthly(poolMonthly: number): number {
  const pool = Math.max(0, poolMonthly)
  return (pool / 1_000) * getTraceIntelligenceRatePer1k(pool)
}

/** Annual cost of an Agent Learning add-on pool (monthly pool × 12). */
export function getAgentLearningAnnual(poolMonthly: number): number {
  return Math.round(getAgentLearningMonthly(poolMonthly) * 12)
}

// —— Programs (annual, not discounted, hidden in agency mode) ——

export type ProgramId = 'agency-program' | 'design-partner-program'

export interface Program {
  id: ProgramId
  name: string
  description: string
  /** Fixed annual program fee. */
  annualFee: number
}

export const PROGRAMS: Program[] = [
  {
    id: 'agency-program',
    name: 'Mastra Agency Program',
    description: 'Annual program for agency partners building on Mastra.',
    annualFee: 10_000,
  },
  {
    id: 'design-partner-program',
    name: 'Design Partner Program',
    description: 'Annual design partner program with the Mastra team.',
    annualFee: 12_000,
  },
]

/** Agency mode: 30% off plan and add-ons (not usage overage). */
export const AGENCY_MODE_DISCOUNT = 0.3

/**
 * Plan bundled with any add-on: 20% off plan + add-ons (not usage overage).
 * Does not stack with the agency discount — agency mode supersedes it.
 */
export const BUNDLE_DISCOUNT = 0.2

export function isAddonAvailable(addon: Addon, plan: Plan | null): boolean {
  // Premium on-call support can also be purchased without a plan selected.
  if (!plan) return addon.id === 'premium-on-call'
  if (addon.allowedPlanIds) return addon.allowedPlanIds.includes(plan.id)
  return addon.enterpriseOnly
}

export interface AddonLine {
  addon: Addon
  listAmount: number
  billedAmount: number
}

export interface AddonPricing {
  lines: AddonLine[]
  total: number
}

/**
 * Each add-on bills independently: flat fee, or max(rate × plan fee, annual
 * minimum). Flat fees for Compliance / Premium On-Call are scaled by the
 * headcount multiplier for their add-on.
 */
export function priceAddons(
  plan: Plan | null,
  subscriptionAnnual: number,
  selectedAddonIds: AddonId[],
  headcount?: number | null,
): AddonPricing {
  const available = ADDONS.filter(
    (addon) =>
      selectedAddonIds.includes(addon.id) && isAddonAvailable(addon, plan),
  )

  const lines: AddonLine[] = available.map((addon) => {
    const listAmount =
      addon.flatAnnual != null
        ? Math.round(addon.flatAnnual * getAddonMultiplier(addon.id, headcount))
        : Math.max(addon.annualMinimum, subscriptionAnnual * (addon.rate ?? 0))
    return {
      addon,
      listAmount,
      billedAmount: listAmount,
    }
  })

  const total = lines.reduce((sum, line) => sum + line.billedAmount, 0)
  return { lines, total }
}

// —— Platform usage (Enterprise Platform only) ——

export interface PlatformUsageMetric {
  id: string
  name: string
  unitCost: number
  deliveryUnitCost: number
  unitLabel: string
  includedNote?: string
}

export const PLATFORM_USAGE_METRICS: PlatformUsageMetric[] = [
  {
    id: 'observability-events',
    name: 'Observability Events',
    unitCost: 0.00008,
    deliveryUnitCost: 0.0000023,
    unitLabel: 'event',
    includedNote: 'First 1,000,000 events free outside package includes',
  },
  {
    id: 'data-egress',
    name: 'Data Egress (GB)',
    unitCost: 0.8,
    deliveryUnitCost: 0.05,
    unitLabel: 'GB',
    includedNote: 'First 100 GB free outside package includes',
  },
  {
    id: 'cpu-time',
    name: 'CPU Time (Hour)',
    unitCost: 0.25,
    deliveryUnitCost: 0.027792,
    unitLabel: 'hour',
    includedNote: 'First 250 hours free outside package includes',
  },
  {
    id: 'rows-written',
    name: 'Rows Written (LibSQL)',
    unitCost: 0.000002,
    deliveryUnitCost: 0.000001,
    unitLabel: 'row',
  },
  {
    id: 'compute-hours',
    name: 'Compute Hours (Postgres)',
    unitCost: 0.4,
    deliveryUnitCost: 0.22,
    unitLabel: 'hour',
  },
  {
    id: 'data-storage',
    name: 'Data Storage GB',
    unitCost: 0.75,
    deliveryUnitCost: 0.35,
    unitLabel: 'GB',
  },
]

export type PlatformUsageAmounts = Record<string, number>

export type PlatformPackageId =
  | 'enterprise-standard'
  | 'enterprise-observability'
  | 'enterprise-obs-studio'

export interface PlatformPackagePreset {
  id: PlatformPackageId
  name: string
  includes: PlatformUsageAmounts
}

export const PLATFORM_USAGE_REFERENCE_ANNUAL = 30_000

export function emptyPlatformUsage(): PlatformUsageAmounts {
  return Object.fromEntries(
    PLATFORM_USAGE_METRICS.map((metric) => [metric.id, 0]),
  )
}

export const PLATFORM_PACKAGES: PlatformPackagePreset[] = [
  {
    id: 'enterprise-standard',
    name: 'Enterprise (Standard)',
    includes: {
      'observability-events': 10_000_000,
      'data-egress': 1_000,
      'cpu-time': 2_500,
      'rows-written': 100_000_000,
      'compute-hours': 500,
      'data-storage': 100,
    },
  },
  {
    id: 'enterprise-observability',
    name: 'Enterprise (Observability Package)',
    includes: {
      'observability-events': 100_000_000,
      'data-egress': 0,
      'cpu-time': 0,
      'rows-written': 0,
      'compute-hours': 0,
      'data-storage': 0,
    },
  },
  {
    id: 'enterprise-obs-studio',
    name: 'Enterprise (Obs + Studio Package)',
    includes: {
      'observability-events': 50_000_000,
      'data-egress': 500,
      'cpu-time': 250,
      'rows-written': 50_000_000,
      'compute-hours': 250,
      'data-storage': 50,
    },
  },
]

export function roundUpUsageQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  const exp = Math.floor(Math.log10(value))
  const magnitude = 10 ** exp
  const fraction = value / magnitude
  const candidates = [1, 2, 2.5, 3, 4, 5, 7.5, 10]
  for (const candidate of candidates) {
    if (fraction <= candidate + 1e-12) {
      return candidate * magnitude
    }
  }
  return 10 * magnitude
}

export function scaleUsageIncludes(
  referenceIncludes: PlatformUsageAmounts,
  annualPrice: number,
  referenceAnnual: number,
): PlatformUsageAmounts {
  const scale = annualPrice / referenceAnnual
  return Object.fromEntries(
    PLATFORM_USAGE_METRICS.map((metric) => [
      metric.id,
      roundUpUsageQuantity((referenceIncludes[metric.id] ?? 0) * scale),
    ]),
  )
}

export function scalePlatformIncludes(
  referenceIncludes: PlatformUsageAmounts,
  platformAnnual: number,
): PlatformUsageAmounts {
  return scaleUsageIncludes(
    referenceIncludes,
    platformAnnual,
    PLATFORM_USAGE_REFERENCE_ANNUAL,
  )
}

export interface PlatformConfig {
  packageId: PlatformPackageId
  includes: PlatformUsageAmounts
  additional: PlatformUsageAmounts
}

export function platformConfigFromPackage(
  packageId: PlatformPackageId,
  productTotalAnnual: number,
): PlatformConfig {
  const preset =
    PLATFORM_PACKAGES.find((pkg) => pkg.id === packageId) ?? PLATFORM_PACKAGES[0]
  return {
    packageId: preset.id,
    includes: scalePlatformIncludes(
      preset.includes,
      Math.max(0, productTotalAnnual),
    ),
    additional: emptyPlatformUsage(),
  }
}

export function defaultPlatformConfig(productTotalAnnual = 0): PlatformConfig {
  return platformConfigFromPackage('enterprise-standard', productTotalAnnual)
}

export function getPlatformPackageName(packageId: PlatformPackageId): string {
  return (
    PLATFORM_PACKAGES.find((pkg) => pkg.id === packageId)?.name ??
    PLATFORM_PACKAGES[0].name
  )
}

export interface PlatformUsageLine {
  metric: PlatformUsageMetric
  additionalAmount: number
  listUnitCost: number
  billedUnitCost: number
  monthlyCost: number
  cost: number
}

export const ADDITIONAL_USAGE_DISCOUNT = 0.5
export const USAGE_MONTHS_PER_YEAR = 12

export function getAdditionalUsageUnitPrice(listUnitCost: number): number {
  return listUnitCost * (1 - ADDITIONAL_USAGE_DISCOUNT)
}

export function buildPlatformUsageLines(
  amounts: PlatformUsageAmounts,
): PlatformUsageLine[] {
  return PLATFORM_USAGE_METRICS.map((metric) => {
    const additionalAmount = Math.max(0, amounts[metric.id] ?? 0)
    const billedUnitCost = getAdditionalUsageUnitPrice(metric.unitCost)
    const monthlyCost = additionalAmount * billedUnitCost
    return {
      metric,
      additionalAmount,
      listUnitCost: metric.unitCost,
      billedUnitCost,
      monthlyCost,
      cost: monthlyCost * USAGE_MONTHS_PER_YEAR,
    }
  }).filter((line) => line.additionalAmount > 0)
}

export function costOfUsageAmounts(amounts: PlatformUsageAmounts): number {
  return PLATFORM_USAGE_METRICS.reduce((sum, metric) => {
    const qty = Math.max(0, amounts[metric.id] ?? 0)
    return sum + qty * metric.deliveryUnitCost
  }, 0)
}

export interface PlatformUsageCostLine {
  metric: PlatformUsageMetric
  amount: number
  deliveryUnitCost: number
  cost: number
}

export function buildUsageCostLines(
  amounts: PlatformUsageAmounts,
): PlatformUsageCostLine[] {
  return PLATFORM_USAGE_METRICS.map((metric) => {
    const amount = Math.max(0, amounts[metric.id] ?? 0)
    return {
      metric,
      amount,
      deliveryUnitCost: metric.deliveryUnitCost,
      cost: amount * metric.deliveryUnitCost,
    }
  }).filter((line) => line.amount > 0)
}

export interface PlatformMargin {
  revenue: number
  additionalRevenue: number
  includeCost: number
  additionalCost: number
  totalCost: number
  margin: number
  marginRate: number | null
  includeLines: PlatformUsageCostLine[]
  additionalCostLines: PlatformUsageCostLine[]
  additionalRevenueLines: PlatformUsageLine[]
}

export function buildPlatformMargin(
  productAnnualTotal: number,
  includes: PlatformUsageAmounts,
  additional: PlatformUsageAmounts,
): PlatformMargin {
  const includeLines = buildUsageCostLines(includes).map((line) => ({
    ...line,
    cost: line.cost * USAGE_MONTHS_PER_YEAR,
  }))
  const additionalCostLines = buildUsageCostLines(additional).map((line) => ({
    ...line,
    cost: line.cost * USAGE_MONTHS_PER_YEAR,
  }))
  const additionalRevenueLines = buildPlatformUsageLines(additional)
  const includeCost = includeLines.reduce((sum, line) => sum + line.cost, 0)
  const additionalCost = additionalCostLines.reduce(
    (sum, line) => sum + line.cost,
    0,
  )
  const additionalRevenue = additionalRevenueLines.reduce(
    (sum, line) => sum + line.cost,
    0,
  )
  const totalCost = includeCost + additionalCost
  const revenue = productAnnualTotal
  const margin = revenue - totalCost
  return {
    revenue,
    additionalRevenue,
    includeCost,
    additionalCost,
    totalCost,
    margin,
    marginRate: revenue > 0 ? margin / revenue : null,
    includeLines,
    additionalCostLines,
    additionalRevenueLines,
  }
}

// —— Quote ——

export interface QuoteLine {
  id: string
  name: string
  meta?: string
  annualAmount: number
  period: '/ yr' | '/ mo'
  /** Covered by the plan floor; shown as included rather than a charge. */
  included?: boolean
}

export interface Quote {
  plan: Plan | null
  /** Company headcount entered for size multipliers; null when not set. */
  headcount: number | null
  /** Headcount band for the entered headcount; null when not set. */
  headcountBand: HeadcountBand | null
  /** Multiplier applied to the plan's base annual fee (1 when no band). */
  planMultiplier: number
  /** Plan annual fee before the headcount multiplier (0 if no plan). */
  planBaseAnnual: number
  /** Plan annual fee after the headcount multiplier (0 if no plan). */
  planAnnual: number
  /** Agent Learning add-on pool (analyzed traces/mo) used for pool pricing. */
  agentLearningPoolMonthly: number
  addonPricing: AddonPricing
  agencyMode: boolean
  /** Pre-discount subscription annual (plan fee + add-ons). */
  subscriptionListAnnual: number
  /** Agency 30% off subscription; 0 when agency mode is off. */
  agencyDiscount: number
  /** Plan + any add-on bundled: 20% off subscription; 0 when not bundled. */
  bundleDiscount: number
  /** Selected annual programs (excluded in agency mode). */
  programs: Program[]
  /** Total annual program fees. */
  programTotal: number
  platformPackageId: PlatformPackageId | null
  platformPackageName: string | null
  platformIncludes: PlatformUsageAmounts
  platformUsageLines: PlatformUsageLine[]
  platformOverageTotal: number
  productLines: QuoteLine[]
  annualTotal: number
}

export interface BuildQuoteInput {
  planId: PlanId | null
  selectedAddonIds: AddonId[]
  selectedProgramIds?: ProgramId[]
  /** Company headcount for size multipliers; null/undefined = 1.0×. */
  headcount?: number | null
  /** Agent Learning add-on pool (analyzed traces/mo). */
  agentLearningPoolMonthly?: number
  agencyMode?: boolean
  platformConfig?: PlatformConfig
}

export function buildQuote(input: BuildQuoteInput): Quote {
  const plan = input.planId == null ? null : getPlan(input.planId)
  const agencyMode = Boolean(input.agencyMode)

  const headcount = input.headcount ?? null
  const headcountBand = getHeadcountBand(headcount)
  const planMultiplier = plan ? getPlanMultiplier(plan.id, headcount) : 1
  const planBaseAnnual = plan ? plan.annualFee : 0
  const planAnnual = Math.round(planBaseAnnual * planMultiplier)
  const agentLearningPoolMonthly = Math.max(
    0,
    input.agentLearningPoolMonthly ?? DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  )

  const addonIds = input.selectedAddonIds.filter((id) => {
    const addon = ADDONS.find((a) => a.id === id)
    return addon != null && isAddonAvailable(addon, plan)
  })

  const baseAddonPricing = priceAddons(
    plan,
    planAnnual,
    addonIds.filter((id) => id !== 'agent-learning'),
    headcount,
  )

  const agentLearningAddon = ADDONS.find((a) => a.id === 'agent-learning')!
  const agentLearningLines: AddonLine[] =
    addonIds.includes('agent-learning')
      ? [
          {
            addon: agentLearningAddon,
            listAmount: getAgentLearningAnnual(agentLearningPoolMonthly),
            billedAmount: getAgentLearningAnnual(agentLearningPoolMonthly),
          },
        ]
      : []

  const addonPricing: AddonPricing = {
    lines: [...baseAddonPricing.lines, ...agentLearningLines],
    total:
      baseAddonPricing.total +
      agentLearningLines.reduce((sum, line) => sum + line.billedAmount, 0),
  }

  const platformSelected = Boolean(plan?.hasUsage)
  const platformConfig = input.platformConfig ?? defaultPlatformConfig(0)
  const platformUsageLines = platformSelected
    ? buildPlatformUsageLines(platformConfig.additional)
    : []
  const platformOverageTotal = platformUsageLines.reduce(
    (sum, line) => sum + line.cost,
    0,
  )
  const platformIncludes = platformSelected
    ? platformConfig.includes
    : emptyPlatformUsage()

  const productLines: QuoteLine[] = []

  if (plan) {
    productLines.push({
      id: 'plan',
      name: plan.name,
      meta: headcountBand
        ? `${formatUsd(planBaseAnnual)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(planMultiplier)}`
        : 'Fixed annual subscription',
      annualAmount: planAnnual,
      period: '/ yr',
    })
  }

  for (const line of addonPricing.lines) {
    const addonMultiplier = getAddonMultiplier(line.addon.id, headcount)
    productLines.push({
      id: line.addon.id,
      name: line.addon.name,
      meta:
        line.addon.id === 'agent-learning'
          ? `${agentLearningPoolMonthly.toLocaleString('en-US')} analyzed traces/mo add-on · ${formatUsd(getTraceIntelligenceRatePer1k(agentLearningPoolMonthly))}/1k · ${TRACE_INCLUDED_MONTHLY.toLocaleString('en-US')}/mo included`
          : [
              line.addon.flatAnnual != null
                ? headcountBand && addonMultiplier !== 1
                  ? `${formatUsd(line.addon.flatAnnual)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(addonMultiplier)}`
                  : 'Fixed annual subscription'
                : `${formatPercent(line.addon.rate ?? 0)} of subscription`,
              line.addon.annualMinimum > 0
                ? `${formatUsd(line.addon.annualMinimum)} min`
                : null,
            ]
              .filter(Boolean)
              .join(' · '),
      annualAmount: line.billedAmount,
      period: '/ yr',
    })
  }

  const subscriptionListAnnual = planAnnual + addonPricing.total
  const agencyDiscount =
    agencyMode && subscriptionListAnnual > 0
      ? Math.round(subscriptionListAnnual * AGENCY_MODE_DISCOUNT)
      : 0

  if (agencyDiscount > 0) {
    productLines.push({
      id: 'agency-discount',
      name: 'Agency discount',
      meta: `${formatPercent(AGENCY_MODE_DISCOUNT)} off plan and add-ons`,
      annualAmount: -agencyDiscount,
      period: '/ yr',
    })
  }

  // Bundle and agency discounts do not stack: agency mode supersedes.
  const bundleDiscount =
    !agencyMode &&
    plan &&
    addonPricing.lines.length > 0 &&
    subscriptionListAnnual > 0
      ? Math.round(subscriptionListAnnual * BUNDLE_DISCOUNT)
      : 0

  if (bundleDiscount > 0) {
    productLines.push({
      id: 'bundle-discount',
      name: 'Bundle discount',
      meta: `${formatPercent(BUNDLE_DISCOUNT)} off plan and add-ons when bundled`,
      annualAmount: -bundleDiscount,
      period: '/ yr',
    })
  }

  const programs = agencyMode
    ? []
    : PROGRAMS.filter((p) => input.selectedProgramIds?.includes(p.id))
  const programTotal = programs.reduce((sum, p) => sum + p.annualFee, 0)

  for (const program of programs) {
    productLines.push({
      id: program.id,
      name: program.name,
      meta: 'Program · Fixed annual subscription',
      annualAmount: program.annualFee,
      period: '/ yr',
    })
  }

  if (platformOverageTotal > 0) {
    productLines.push({
      id: 'platform-usage',
      name: 'Platform usage (additional)',
      meta: getPlatformPackageName(platformConfig.packageId),
      annualAmount: platformOverageTotal,
      period: '/ yr',
    })
  }

  const annualTotal =
    subscriptionListAnnual -
    agencyDiscount -
    bundleDiscount +
    platformOverageTotal +
    programTotal

  return {
    plan,
    headcount,
    headcountBand,
    planMultiplier,
    planBaseAnnual,
    planAnnual,
    agentLearningPoolMonthly,
    addonPricing,
    agencyMode,
    subscriptionListAnnual,
    agencyDiscount,
    bundleDiscount,
    programs,
    programTotal,
    platformPackageId: platformSelected ? platformConfig.packageId : null,
    platformPackageName: platformSelected
      ? getPlatformPackageName(platformConfig.packageId)
      : null,
    platformIncludes,
    platformUsageLines,
    platformOverageTotal,
    productLines,
    annualTotal,
  }
}

export function formatUsd(amount: number): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatUnitCost(amount: number): string {
  const digits = amount > 0 && amount < 0.01 ? 6 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
