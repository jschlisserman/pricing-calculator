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

/** Headcount multiplier applied to flat-fee add-ons (Trace Intelligence excluded). */
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
  | 'trace-intelligence'
  | 'agent-builder'
  | 'mastra-knowledge'
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
    id: 'trace-intelligence',
    name: 'Trace Intelligence',
    description:
      'Custom Signals · 10k analyzed traces/mo included; +$3,000/yr on plan',
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
    id: 'mastra-knowledge',
    name: 'Mastra Knowledge',
    description:
      '$6K/KB/yr · 3 sources + 10GB included per KB; extra sources + data overage',
    rate: null,
    annualMinimum: 0,
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

export interface TraceIntelligenceBand {
  /** Inclusive start of the monthly analyzed-traces band. */
  from: number
  /** Inclusive end of the band; null = open-ended. */
  to: number | null
  /** Pre-commitment / pay-as-you-go rate per analyzed trace. */
  ratePerTrace: number
  /** Overage rate per analyzed trace above the committed pool. */
  overagePerTrace: number
}

export interface TraceIntelligencePool {
  fromLabel: string
  toLabel: string
  ratePerTrace: string
  overagePerTrace: string
  price: string
}

/**
 * Progressive Trace Intelligence volume bands (per analyzed trace / month).
 * First 10k are $0; rates from the pricing sheet, extended through 10M.
 */
export const TRACE_VOLUME_BANDS: ReadonlyArray<TraceIntelligenceBand> = [
  { from: 1, to: 10_000, ratePerTrace: 0, overagePerTrace: 0.025 },
  { from: 10_001, to: 25_000, ratePerTrace: 0.016, overagePerTrace: 0.02 },
  { from: 25_001, to: 100_000, ratePerTrace: 0.0075, overagePerTrace: 0.01 },
  { from: 100_001, to: 250_000, ratePerTrace: 0.006, overagePerTrace: 0.008 },
  { from: 250_001, to: 500_000, ratePerTrace: 0.005, overagePerTrace: 0.006 },
  { from: 500_001, to: 1_000_000, ratePerTrace: 0.004, overagePerTrace: 0.005 },
  { from: 1_000_001, to: 5_000_000, ratePerTrace: 0.003, overagePerTrace: 0.004 },
  { from: 5_000_001, to: 10_000_000, ratePerTrace: 0.002, overagePerTrace: 0.0025 },
  { from: 10_000_001, to: null, ratePerTrace: 0.002, overagePerTrace: 0.0025 },
]

/**
 * When Trace Intelligence is selected with a plan, this amount is added to
 * the plan's annual fee. The TI pool itself starts at $0 for the first 10k
 * analyzed traces/mo.
 */
export const TRACE_PLAN_UPLIFT_ANNUAL = 3_000
export const TRACE_INCLUDED_MONTHLY = 10_000
/** Internal COGS per analyzed trace (used in margin). */
export const TRACE_COST_PER_TRACE = 0.005

/** @deprecated Use TRACE_PLAN_UPLIFT_ANNUAL */
export const TRACE_STARTING_ANNUAL = TRACE_PLAN_UPLIFT_ANNUAL

/** Default pool when Trace Intelligence is selected (included package). */
export const DEFAULT_AGENT_LEARNING_POOL_MONTHLY = TRACE_INCLUDED_MONTHLY

/** Annual Trace Intelligence COGS: analyzed traces/mo × $0.005 × 12. */
export function getTraceIntelligenceCostAnnual(poolMonthly: number): number {
  const pool = Math.max(0, poolMonthly)
  return Math.round(pool * TRACE_COST_PER_TRACE * 12)
}

function formatTraceVolume(n: number): string {
  return n.toLocaleString('en-US')
}

function formatTraceUnitRate(rate: number): string {
  if (rate === 0) return '$0.00'
  const digits = rate < 0.01 ? 4 : 3
  return `$${rate.toFixed(digits)}`
}

/**
 * Raw progressive monthly cost for a committed analyzed-traces pool
 * (band rates as listed; first 10k band is $0).
 */
export function getTraceProgressiveMonthly(poolMonthly: number): number {
  const pool = Math.max(0, Math.floor(poolMonthly))
  if (pool <= 0) return 0

  let cost = 0
  for (const band of TRACE_VOLUME_BANDS) {
    if (pool < band.from) break
    const bandEnd = band.to ?? pool
    const units = Math.min(pool, bandEnd) - band.from + 1
    if (units > 0) cost += units * band.ratePerTrace
  }
  return cost
}

/**
 * Progressive monthly cost for a committed analyzed-traces pool, after the
 * included monthly allotment (default 10k; Forward Growth/Enterprise raise this).
 */
export function getAgentLearningMonthly(
  poolMonthly: number,
  includedMonthly: number = TRACE_INCLUDED_MONTHLY,
): number {
  const pool = Math.max(0, Math.floor(poolMonthly))
  const included = Math.max(0, Math.floor(includedMonthly))
  if (pool <= 0 || pool <= included) return 0
  return Math.max(
    0,
    getTraceProgressiveMonthly(pool) - getTraceProgressiveMonthly(included),
  )
}

/** Annual Trace Intelligence pool cost (monthly progressive cost × 12). */
export function getAgentLearningAnnual(
  poolMonthly: number,
  includedMonthly: number = TRACE_INCLUDED_MONTHLY,
): number {
  return Math.round(getAgentLearningMonthly(poolMonthly, includedMonthly) * 12)
}

/** Marginal pre-commitment rate ($/trace) for the band the pool sits in. */
export function getTraceIntelligenceMarginalRatePerTrace(
  poolMonthly: number,
): number {
  const pool = Math.max(0, Math.floor(poolMonthly))
  if (pool <= 0) return 0
  for (let i = TRACE_VOLUME_BANDS.length - 1; i >= 0; i--) {
    const band = TRACE_VOLUME_BANDS[i]
    if (pool >= band.from) return band.ratePerTrace
  }
  return 0
}

/**
 * Blended effective rate per 1k analyzed traces for the committed pool.
 * Used in summary meta; 0 when the pool is fully within the included band.
 */
export function getTraceIntelligenceRatePer1k(
  poolMonthly: number,
  includedMonthly: number = TRACE_INCLUDED_MONTHLY,
): number {
  const pool = Math.max(0, poolMonthly)
  if (pool <= 0) return 0
  const monthly = getAgentLearningMonthly(pool, includedMonthly)
  if (monthly <= 0) return 0
  return (monthly / pool) * 1_000
}

function formatTracePoolPrice(poolMonthly: number): string {
  const annual = getAgentLearningAnnual(poolMonthly)
  if (annual === 0) {
    return `Included · +${formatUsd(TRACE_PLAN_UPLIFT_ANNUAL)}/yr on plan`
  }
  const monthly = getAgentLearningMonthly(poolMonthly)
  return `${formatUsd(monthly)}/mo · ${formatUsd(annual)}/yr`
}

/** Trace Intelligence volume bands shown in the calculator. */
export const TRACE_INTELLIGENCE_POOLS: TraceIntelligencePool[] =
  TRACE_VOLUME_BANDS.map((band) => {
    const examplePool = band.to ?? band.from
    return {
      fromLabel: formatTraceVolume(band.from),
      toLabel: band.to == null ? 'and up' : formatTraceVolume(band.to),
      ratePerTrace: formatTraceUnitRate(band.ratePerTrace),
      overagePerTrace: formatTraceUnitRate(band.overagePerTrace),
      price: formatTracePoolPrice(examplePool),
    }
  })

// —— Mastra Knowledge (legacy add-on volume pricing) ——

/** Annual fee per knowledge base. */
export const KNOWLEDGE_KB_ANNUAL = 6_000
/** Sources included with each KB. */
export const KNOWLEDGE_SOURCES_INCLUDED_PER_KB = 3
/** Data included with each KB (GB). */
export const KNOWLEDGE_DATA_INCLUDED_GB_PER_KB = 10
/** Annual fee per source beyond the included allotment. */
export const KNOWLEDGE_SOURCE_ANNUAL = 1_000
/** Data is billed in 100 GB blocks. */
export const KNOWLEDGE_DATA_BLOCK_GB = 100

/** Progressive annual price per 100 GB block of billable data. */
export const KNOWLEDGE_DATA_BANDS: ReadonlyArray<{
  /** Inclusive end of this band in GB of billable data (null = open-ended). */
  toGb: number | null
  annualPerBlock: number
}> = [
  { toGb: 1_000, annualPerBlock: 2_500 }, // up to 1 TB
  { toGb: 10_000, annualPerBlock: 1_500 }, // 1–10 TB
  { toGb: null, annualPerBlock: 750 }, // beyond 10 TB
]

export interface KnowledgeConfig {
  /** Number of knowledge bases. */
  kbCount: number
  /** Total sources across all KBs. */
  sources: number
  /** Total data commitment in GB. */
  dataGb: number
}

export const DEFAULT_KNOWLEDGE_CONFIG: KnowledgeConfig = {
  kbCount: 1,
  sources: KNOWLEDGE_SOURCES_INCLUDED_PER_KB,
  dataGb: KNOWLEDGE_DATA_INCLUDED_GB_PER_KB,
}

export function normalizeKnowledgeConfig(
  config: KnowledgeConfig | null | undefined,
): KnowledgeConfig {
  const kbCount = Math.max(1, Math.floor(config?.kbCount ?? 1))
  const includedSources = kbCount * KNOWLEDGE_SOURCES_INCLUDED_PER_KB
  const includedDataGb = kbCount * KNOWLEDGE_DATA_INCLUDED_GB_PER_KB
  return {
    kbCount,
    sources: Math.max(includedSources, Math.floor(config?.sources ?? includedSources)),
    dataGb: Math.max(includedDataGb, Math.floor(config?.dataGb ?? includedDataGb)),
  }
}

export function getKnowledgeIncludedSources(kbCount: number): number {
  return Math.max(0, Math.floor(kbCount)) * KNOWLEDGE_SOURCES_INCLUDED_PER_KB
}

export function getKnowledgeIncludedDataGb(kbCount: number): number {
  return Math.max(0, Math.floor(kbCount)) * KNOWLEDGE_DATA_INCLUDED_GB_PER_KB
}

export function getKnowledgeExtraSources(config: KnowledgeConfig): number {
  const normalized = normalizeKnowledgeConfig(config)
  return Math.max(
    0,
    normalized.sources - getKnowledgeIncludedSources(normalized.kbCount),
  )
}

export function getKnowledgeBillableDataGb(config: KnowledgeConfig): number {
  const normalized = normalizeKnowledgeConfig(config)
  return Math.max(
    0,
    normalized.dataGb - getKnowledgeIncludedDataGb(normalized.kbCount),
  )
}

/** Annual cost for billable data (GB beyond KB includes), in 100 GB blocks. */
export function getKnowledgeDataAnnual(billableGb: number): number {
  const blocks = Math.ceil(Math.max(0, billableGb) / KNOWLEDGE_DATA_BLOCK_GB)
  if (blocks <= 0) return 0

  let cost = 0
  for (let i = 1; i <= blocks; i++) {
    const blockEndGb = i * KNOWLEDGE_DATA_BLOCK_GB
    let rate = KNOWLEDGE_DATA_BANDS[KNOWLEDGE_DATA_BANDS.length - 1].annualPerBlock
    for (const band of KNOWLEDGE_DATA_BANDS) {
      if (band.toGb == null || blockEndGb <= band.toGb) {
        rate = band.annualPerBlock
        break
      }
    }
    cost += rate
  }
  return cost
}

export function getKnowledgeAnnual(config: KnowledgeConfig): number {
  const normalized = normalizeKnowledgeConfig(config)
  const kbFee = normalized.kbCount * KNOWLEDGE_KB_ANNUAL
  const sourcesFee = getKnowledgeExtraSources(normalized) * KNOWLEDGE_SOURCE_ANNUAL
  const dataFee = getKnowledgeDataAnnual(getKnowledgeBillableDataGb(normalized))
  return kbFee + sourcesFee + dataFee
}

export function formatKnowledgeMeta(config: KnowledgeConfig): string {
  const normalized = normalizeKnowledgeConfig(config)
  const includedSources = getKnowledgeIncludedSources(normalized.kbCount)
  const extraSources = getKnowledgeExtraSources(normalized)
  const billableData = getKnowledgeBillableDataGb(normalized)
  const parts = [
    `${normalized.kbCount} KB × ${formatUsd(KNOWLEDGE_KB_ANNUAL)}`,
    extraSources > 0
      ? `${extraSources} extra sources × ${formatUsd(KNOWLEDGE_SOURCE_ANNUAL)}`
      : `${normalized.sources}/${includedSources} sources included`,
    billableData > 0
      ? `${billableData.toLocaleString('en-US')} GB billable data`
      : `${normalized.dataGb.toLocaleString('en-US')} GB included`,
  ]
  return parts.join(' · ')
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
 * Plan bundled with any add-on: 15% off the plan fee only (add-ons and
 * usage overage are not discounted). Does not stack with the agency
 * discount — agency mode supersedes it.
 */
export const BUNDLE_DISCOUNT = 0.15

export function isAddonAvailable(addon: Addon, plan: Plan | null): boolean {
  // Trace Intelligence and Premium on-call can also be purchased without a plan.
  if (!plan) {
    return addon.id === 'trace-intelligence' || addon.id === 'premium-on-call'
  }
  if (addon.allowedPlanIds) return addon.allowedPlanIds.includes(plan.id)
  return addon.enterpriseOnly
}

/** Enterprise features that Forward plans include / pick — also exist as add-ons. */
export const FORWARD_MAPPED_ADDON_IDS: ReadonlyArray<AddonId> = [
  'agent-builder',
  'mastra-knowledge',
  'trace-intelligence',
]

export function isForwardMappedAddon(id: string): id is AddonId {
  return (FORWARD_MAPPED_ADDON_IDS as ReadonlyArray<string>).includes(id)
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
  /**
   * $3,000 Trace Intelligence uplift added to the plan when TI is selected
   * with a plan; 0 otherwise.
   */
  planTraceUplift: number
  /** Plan annual fee after headcount multiplier and TI uplift (0 if no plan). */
  planAnnual: number
  /** Trace Intelligence pool (analyzed traces/mo) used for pool pricing. */
  agentLearningPoolMonthly: number
  addonPricing: AddonPricing
  agencyMode: boolean
  /** Pre-discount subscription annual (plan fee + add-ons). */
  subscriptionListAnnual: number
  /** Agency 30% off subscription; 0 when agency mode is off. */
  agencyDiscount: number
  /** Plan bundled with any add-on: 15% off plan fee; 0 when not bundled. */
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
  /** Trace Intelligence pool (analyzed traces/mo). */
  agentLearningPoolMonthly?: number
  /**
   * Traces/mo included at $0 before progressive overage.
   * Defaults to TRACE_INCLUDED_MONTHLY (10k); Forward Growth/Enterprise raise this.
   */
  traceIncludedMonthly?: number
  /** Mastra Knowledge volume config (legacy add-on). */
  knowledgeConfig?: KnowledgeConfig
  agencyMode?: boolean
  platformConfig?: PlatformConfig
  /**
   * Features already included by a Mastra Forward plan. Those add-ons are not
   * charged again; Trace Intelligence still bills progressive pool overage.
   */
  includedByForwardIds?: ReadonlyArray<AddonId>
}

export function buildQuote(input: BuildQuoteInput): Quote {
  const plan = input.planId == null ? null : getPlan(input.planId)
  const agencyMode = Boolean(input.agencyMode)
  const includedByForward = new Set(input.includedByForwardIds ?? [])

  const headcount = input.headcount ?? null
  const headcountBand = getHeadcountBand(headcount)
  const planMultiplier = plan ? getPlanMultiplier(plan.id, headcount) : 1
  const planBaseAnnual = plan ? plan.annualFee : 0
  const agentLearningPoolMonthly = Math.max(
    0,
    input.agentLearningPoolMonthly ?? DEFAULT_AGENT_LEARNING_POOL_MONTHLY,
  )
  const traceIncludedMonthly = Math.max(
    0,
    input.traceIncludedMonthly ?? TRACE_INCLUDED_MONTHLY,
  )
  const knowledgeConfig = normalizeKnowledgeConfig(input.knowledgeConfig)

  const addonIds = input.selectedAddonIds.filter((id) => {
    const addon = ADDONS.find((a) => a.id === id)
    return addon != null && isAddonAvailable(addon, plan)
  })

  const agentLearningPurchased = addonIds.includes('trace-intelligence')
  const agentLearningFromForward = includedByForward.has('trace-intelligence')
  const agentLearningSelected =
    agentLearningPurchased || agentLearningFromForward
  // $3k plan uplift only when TI is purchased as an add-on (not Forward-included).
  const planTraceUplift =
    plan && agentLearningPurchased && !agentLearningFromForward
      ? TRACE_PLAN_UPLIFT_ANNUAL
      : 0
  const planAnnual =
    Math.round(planBaseAnnual * planMultiplier) + planTraceUplift

  const baseAddonPricing = priceAddons(
    plan,
    planAnnual,
    addonIds.filter(
      (id) =>
        id !== 'trace-intelligence' &&
        id !== 'mastra-knowledge' &&
        !includedByForward.has(id),
    ),
    headcount,
  )

  const agentLearningAddon = ADDONS.find((a) => a.id === 'trace-intelligence')!
  const agentLearningAmount = agentLearningSelected
    ? getAgentLearningAnnual(agentLearningPoolMonthly, traceIncludedMonthly)
    : 0
  // Forward covers TI access; only surface a product line for pool overage.
  // Standalone TI purchase always surfaces a line (even at the $0 included pool).
  const showAgentLearningLine = agentLearningFromForward
    ? agentLearningAmount > 0
    : agentLearningPurchased
  const agentLearningLines: AddonLine[] = showAgentLearningLine
    ? [
        {
          addon: agentLearningAddon,
          listAmount: agentLearningAmount,
          billedAmount: agentLearningAmount,
        },
      ]
    : []

  const knowledgeAddon = ADDONS.find((a) => a.id === 'mastra-knowledge')!
  const knowledgePurchased =
    addonIds.includes('mastra-knowledge') &&
    !includedByForward.has('mastra-knowledge')
  const knowledgeAmount = knowledgePurchased
    ? getKnowledgeAnnual(knowledgeConfig)
    : 0
  const knowledgeLines: AddonLine[] = knowledgePurchased
    ? [
        {
          addon: knowledgeAddon,
          listAmount: knowledgeAmount,
          billedAmount: knowledgeAmount,
        },
      ]
    : []

  const addonPricing: AddonPricing = {
    lines: [
      ...baseAddonPricing.lines,
      ...agentLearningLines,
      ...knowledgeLines,
    ],
    total:
      baseAddonPricing.total +
      agentLearningLines.reduce((sum, line) => sum + line.billedAmount, 0) +
      knowledgeLines.reduce((sum, line) => sum + line.billedAmount, 0),
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
    const planMetaParts = [
      headcountBand
        ? `${formatUsd(planBaseAnnual)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(planMultiplier)}`
        : 'Fixed annual subscription',
      planTraceUplift > 0
        ? `+${formatUsd(planTraceUplift)} Trace Intelligence`
        : null,
    ].filter(Boolean)
    productLines.push({
      id: 'plan',
      name: plan.name,
      meta: planMetaParts.join(' · '),
      annualAmount: planAnnual,
      period: '/ yr',
    })
  }

  for (const line of addonPricing.lines) {
    const addonMultiplier = getAddonMultiplier(line.addon.id, headcount)
    const isAgentLearning = line.addon.id === 'trace-intelligence'
    const isKnowledge = line.addon.id === 'mastra-knowledge'
    productLines.push({
      id: line.addon.id,
      name: line.addon.name,
      meta: isAgentLearning
        ? agentLearningPoolMonthly <= traceIncludedMonthly
          ? `${traceIncludedMonthly.toLocaleString('en-US')} traces/mo included${planTraceUplift > 0 ? ` · +${formatUsd(planTraceUplift)}/yr on plan` : ''}`
          : `${agentLearningPoolMonthly.toLocaleString('en-US')} traces/mo progressive · blended ${formatUsd(getTraceIntelligenceRatePer1k(agentLearningPoolMonthly))}/1k · first ${traceIncludedMonthly.toLocaleString('en-US')}/mo included${planTraceUplift > 0 ? ` · +${formatUsd(planTraceUplift)}/yr on plan` : ''}`
        : isKnowledge
          ? formatKnowledgeMeta(knowledgeConfig)
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
      included: isAgentLearning && line.billedAmount === 0,
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
  // Bundle is 15% off the plan fee only (not add-ons).
  const bundleDiscount =
    !agencyMode && plan && addonPricing.lines.length > 0 && planAnnual > 0
      ? Math.round(planAnnual * BUNDLE_DISCOUNT)
      : 0

  if (bundleDiscount > 0) {
    productLines.push({
      id: 'bundle-discount',
      name: 'Bundle discount',
      meta: `${formatPercent(BUNDLE_DISCOUNT)} off plan when bundled with an add-on`,
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
    planTraceUplift,
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
