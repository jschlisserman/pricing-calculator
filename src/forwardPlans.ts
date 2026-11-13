import {
  FORWARD_EMBEDDED_SELL_RATE_PER_HOUR,
  getForwardCommitmentWeeks,
  getForwardPeriodLabel,
  type ForwardHoursCommitment,
} from './concierge'
import {
  TRACE_INCLUDED_MONTHLY,
  formatPercent,
  formatUsd,
} from './pricing'

export type { ForwardHoursCommitment }
/** @deprecated Use ForwardHoursCommitment */
export type ForwardBillingPeriod = ForwardHoursCommitment

/** Enterprise features that Forward plans include or let you pick. */
export type EnterpriseFeatureId =
  | 'agent-builder'
  | 'mastra-knowledge'
  | 'trace-intelligence'

export const ENTERPRISE_FEATURES: ReadonlyArray<{
  id: EnterpriseFeatureId
  name: string
  description: string
}> = [
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    description: 'No-code / low-code agent building.',
  },
  {
    id: 'mastra-knowledge',
    name: 'Mastra Knowledge',
    description: 'Knowledge base and retrieval for agents.',
  },
  {
    id: 'trace-intelligence',
    name: 'Trace Intelligence',
    description: 'Analyzed traces and custom signals.',
  },
]

export type ForwardPlanId = 'startup' | 'growth' | 'enterprise'

export interface ForwardPlan {
  id: ForwardPlanId
  name: string
  description: string
  /**
   * Inclusive annual price floor (hrs × $300 × commitment weeks).
   * Ranges span 3-mo (13 wk) and 12-mo (52 wk) hours commitments.
   */
  priceMin: number
  /** Inclusive annual price ceiling; null = open-ended. */
  priceMax: number | null
  hoursMin: number
  hoursMax: number | null
  hoursNote: string
  /** Features always included (no pick required). */
  includedFeatures: EnterpriseFeatureId[]
  /** How many features the customer picks from `featurePool`. */
  featurePickCount: number
  /** Pool of features available to pick (excludes always-included). */
  featurePool: EnterpriseFeatureId[]
  includedDeploys: DeploysTierId | null
  includedObservability: ObservabilityTierId | null
  /** Monthly connections included (0 = not included). */
  includedConnections: number
  includedPackageValueAnnual: number
  allowsPrivateDeployment: boolean
  /** Plan can choose 3-month or 12-month hours commitment. */
  allowsQuarterlyHours: boolean
  /** @deprecated Use allowsQuarterlyHours */
  allowsQuarterlyBilling: boolean
  /**
   * Trace Intelligence traces/mo included when TI is on this Forward plan
   * (picked or always-included). Null when the plan cannot include TI.
   */
  traceIntelligenceIncludedMonthly: number | null
}

export const FORWARD_PLANS: ForwardPlan[] = [
  {
    id: 'startup',
    name: 'Startup',
    description: 'One team getting its first agents into production.',
    // 2×$300×13 … 4×$300×52
    priceMin: 7_800,
    priceMax: 62_400,
    hoursMin: 2,
    hoursMax: 4,
    hoursNote: 'Hours reset weekly',
    includedFeatures: [],
    featurePickCount: 1,
    featurePool: [
      'agent-builder',
      'mastra-knowledge',
      'trace-intelligence',
    ],
    includedDeploys: 'launch',
    includedObservability: 'obs-10m',
    includedConnections: 0,
    includedPackageValueAnnual: 12_000,
    allowsPrivateDeployment: false,
    allowsQuarterlyHours: true,
    allowsQuarterlyBilling: true,
    traceIntelligenceIncludedMonthly: TRACE_INCLUDED_MONTHLY,
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Several teams building on Mastra, with no-code builders.',
    // 4×$300×13 … 8×$300×52
    priceMin: 15_600,
    priceMax: 124_800,
    hoursMin: 4,
    hoursMax: 8,
    hoursNote: 'Unused hours roll over within the quarter',
    includedFeatures: ['agent-builder'],
    featurePickCount: 1,
    featurePool: ['mastra-knowledge', 'trace-intelligence'],
    includedDeploys: 'production',
    includedObservability: 'obs-25m',
    includedConnections: 0,
    includedPackageValueAnnual: 25_500,
    allowsPrivateDeployment: false,
    allowsQuarterlyHours: true,
    allowsQuarterlyBilling: true,
    traceIntelligenceIncludedMonthly: 25_000,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Company-wide rollout with a dedicated Mastra team.',
    // 10×$300×13 and up
    priceMin: 39_000,
    priceMax: null,
    hoursMin: 10,
    hoursMax: null,
    hoursNote: 'Unused hours roll over within the quarter',
    includedFeatures: [
      'agent-builder',
      'mastra-knowledge',
      'trace-intelligence',
    ],
    featurePickCount: 0,
    featurePool: [],
    includedDeploys: 'scale',
    includedObservability: 'obs-50m',
    includedConnections: 1_000,
    includedPackageValueAnnual: 60_000,
    allowsPrivateDeployment: true,
    allowsQuarterlyHours: true,
    allowsQuarterlyBilling: true,
    traceIntelligenceIncludedMonthly: 50_000,
  },
]

/** Included TI traces/mo when Trace Intelligence is on a Forward plan. */
export function getForwardTraceIncludedMonthly(plan: ForwardPlan): number {
  return plan.traceIntelligenceIncludedMonthly ?? TRACE_INCLUDED_MONTHLY
}

export function resolveForwardHoursCommitment(
  plan: ForwardPlan,
  commitment: ForwardHoursCommitment | null | undefined,
): ForwardHoursCommitment {
  if (plan.allowsQuarterlyHours && commitment === 'quarter') return 'quarter'
  return 'year'
}

/** @deprecated Use resolveForwardHoursCommitment */
export function resolveForwardBillingPeriod(
  plan: ForwardPlan,
  period: ForwardHoursCommitment | null | undefined,
): ForwardHoursCommitment {
  return resolveForwardHoursCommitment(plan, period)
}

export function getForwardPlan(id: ForwardPlanId): ForwardPlan {
  return FORWARD_PLANS.find((p) => p.id === id) ?? FORWARD_PLANS[0]
}

/** Hours/week options allowed for a Forward plan. */
export function getForwardPlanHoursOptions(plan: ForwardPlan): number[] {
  const all = [2, 4, 6, 8, 10, 12, 15, 20, 40]
  return all.filter((h) => {
    if (h < plan.hoursMin) return false
    if (plan.hoursMax != null && h > plan.hoursMax) return false
    return true
  })
}

export function clampForwardPlanPrice(
  plan: ForwardPlan,
  price: number,
): number {
  const min = plan.priceMin
  const max = plan.priceMax
  let next = Math.max(min, Math.round(price))
  if (max != null) next = Math.min(max, next)
  return next
}

export function defaultForwardPlanPrice(plan: ForwardPlan): number {
  if (plan.id === 'enterprise') return 150_000
  if (plan.priceMax == null) return plan.priceMin
  return plan.priceMin
}

// —— Platform packages ——

export type DeploysTierId = 'launch' | 'production' | 'scale'

export interface DeploysTier {
  id: DeploysTierId
  name: string
  monthly: number
  egress: string
}

export const DEPLOYS_TIERS: DeploysTier[] = [
  { id: 'launch', name: 'Launch', monthly: 500, egress: '250 GB' },
  { id: 'production', name: 'Production', monthly: 1_000, egress: '500 GB' },
  { id: 'scale', name: 'Scale', monthly: 2_500, egress: '1 TB' },
]

export function getDeploysTier(id: DeploysTierId): DeploysTier {
  return DEPLOYS_TIERS.find((t) => t.id === id) ?? DEPLOYS_TIERS[0]
}

export type ObservabilityTierId =
  | 'obs-10m'
  | 'obs-25m'
  | 'obs-50m'
  | 'obs-100m'
  | 'obs-250m'

export interface ObservabilityTier {
  id: ObservabilityTierId
  name: string
  eventsMonthly: number
  monthly: number
}

export const OBSERVABILITY_TIERS: ObservabilityTier[] = [
  { id: 'obs-10m', name: '10M', eventsMonthly: 10_000_000, monthly: 500 },
  { id: 'obs-25m', name: '25M', eventsMonthly: 25_000_000, monthly: 1_125 },
  { id: 'obs-50m', name: '50M', eventsMonthly: 50_000_000, monthly: 2_000 },
  { id: 'obs-100m', name: '100M', eventsMonthly: 100_000_000, monthly: 3_000 },
  { id: 'obs-250m', name: '250M', eventsMonthly: 250_000_000, monthly: 6_000 },
]

export function getObservabilityTier(id: ObservabilityTierId): ObservabilityTier {
  return OBSERVABILITY_TIERS.find((t) => t.id === id) ?? OBSERVABILITY_TIERS[0]
}

/** Connect (connections): first 1,000 @ $500/mo, then +500 blocks. */
export const CONNECTIONS_FIRST_BLOCK = 1_000
export const CONNECTIONS_FIRST_MONTHLY = 500
export const CONNECTIONS_STEP = 500
export const CONNECTIONS_STEP_TO_5K_MONTHLY = 200
export const CONNECTIONS_STEP_ABOVE_5K_MONTHLY = 175

/** Common Connect commitment chips for the order builder. */
export const CONNECTIONS_PRESETS = [
  0, 1_000, 5_000, 10_000,
] as const

/**
 * Connections monthly: first 1,000 = $500; each +500 up to 5,000 = $200;
 * each +500 above 5,000 = $175.
 */
export function getConnectionsMonthly(connections: number): number {
  const n = Math.max(0, Math.floor(connections))
  if (n <= 0) return 0
  if (n <= CONNECTIONS_FIRST_BLOCK) return CONNECTIONS_FIRST_MONTHLY

  let monthly = CONNECTIONS_FIRST_MONTHLY
  let at = CONNECTIONS_FIRST_BLOCK
  while (at < n) {
    at += CONNECTIONS_STEP
    monthly +=
      at <= 5_000
        ? CONNECTIONS_STEP_TO_5K_MONTHLY
        : CONNECTIONS_STEP_ABOVE_5K_MONTHLY
  }
  return monthly
}

export type GatewayCommitId =
  | 'none'
  | 'commit-100k'
  | 'commit-250k'
  | 'commit-500k'
  | 'commit-1m'

export interface GatewayCommit {
  id: GatewayCommitId
  name: string
  annualCommit: number
  bonusCreditRate: number | null
}

export const GATEWAY_COMMITS: GatewayCommit[] = [
  { id: 'none', name: 'Pay as you go', annualCommit: 0, bonusCreditRate: null },
  { id: 'commit-100k', name: '$100K', annualCommit: 100_000, bonusCreditRate: 0.03 },
  { id: 'commit-250k', name: '$250K', annualCommit: 250_000, bonusCreditRate: 0.04 },
  { id: 'commit-500k', name: '$500K', annualCommit: 500_000, bonusCreditRate: 0.05 },
  { id: 'commit-1m', name: '$1M+', annualCommit: 1_000_000, bonusCreditRate: 0.06 },
]

export interface ForwardPackageConfig {
  deploys: DeploysTierId | null
  observability: ObservabilityTierId | null
  /** Monthly connections commitment (0 = none). */
  connections: number
  gateway: GatewayCommitId
}

export function defaultForwardPackageConfig(
  plan: ForwardPlan,
): ForwardPackageConfig {
  return {
    deploys: plan.includedDeploys,
    observability: plan.includedObservability,
    connections: plan.includedConnections,
    gateway: 'none',
  }
}

export interface ForwardPackageLine {
  id: string
  name: string
  meta: string
  /** Annual charge (0 when fully covered by plan include). */
  annualAmount: number
  included: boolean
}

function deploysAnnual(id: DeploysTierId | null): number {
  return id ? getDeploysTier(id).monthly * 12 : 0
}

function observabilityAnnual(id: ObservabilityTierId | null): number {
  return id ? getObservabilityTier(id).monthly * 12 : 0
}

function connectionsAnnual(n: number): number {
  return getConnectionsMonthly(n) * 12
}

function deploysRank(id: DeploysTierId | null): number {
  if (!id) return -1
  return DEPLOYS_TIERS.findIndex((t) => t.id === id)
}

function observabilityRank(id: ObservabilityTierId | null): number {
  if (!id) return -1
  return OBSERVABILITY_TIERS.findIndex((t) => t.id === id)
}

/** Size-up charge = selected annual − included annual (floored at 0). */
export function buildForwardPackageLines(
  plan: ForwardPlan,
  config: ForwardPackageConfig,
): ForwardPackageLine[] {
  const lines: ForwardPackageLine[] = []

  const includedDeploysAnnual = deploysAnnual(plan.includedDeploys)
  const selectedDeploys = config.deploys
  if (selectedDeploys) {
    const selectedAnnual = deploysAnnual(selectedDeploys)
    const sizedUp =
      deploysRank(selectedDeploys) > deploysRank(plan.includedDeploys)
    const delta = Math.max(0, selectedAnnual - includedDeploysAnnual)
    const tier = getDeploysTier(selectedDeploys)
    if (plan.includedDeploys && !sizedUp) {
      lines.push({
        id: 'fwd-deploys',
        name: `Deploys · ${tier.name}`,
        meta: `Included · ${formatUsd(tier.monthly)}/mo credit · ${tier.egress}`,
        annualAmount: 0,
        included: true,
      })
    } else if (delta === 0 && plan.includedDeploys === selectedDeploys) {
      lines.push({
        id: 'fwd-deploys',
        name: `Deploys · ${tier.name}`,
        meta: `Included · ${formatUsd(tier.monthly)}/mo credit · ${tier.egress}`,
        annualAmount: 0,
        included: true,
      })
    } else {
      lines.push({
        id: 'fwd-deploys',
        name: `Deploys · ${tier.name}`,
        meta: plan.includedDeploys
          ? `Size up from ${getDeploysTier(plan.includedDeploys).name} · ${formatUsd(tier.monthly)}/mo`
          : `Add-on · ${formatUsd(tier.monthly)}/mo credit · ${tier.egress}`,
        annualAmount: delta > 0 ? delta : selectedAnnual,
        included: false,
      })
    }
  }

  const includedObsAnnual = observabilityAnnual(plan.includedObservability)
  const selectedObs = config.observability
  if (selectedObs) {
    const selectedAnnual = observabilityAnnual(selectedObs)
    const tier = getObservabilityTier(selectedObs)
    const sizedUp =
      observabilityRank(selectedObs) > observabilityRank(plan.includedObservability)
    const delta = Math.max(0, selectedAnnual - includedObsAnnual)
    if (plan.includedObservability && !sizedUp) {
      lines.push({
        id: 'fwd-observability',
        name: `Observability · ${tier.name}`,
        meta: `Included · ${formatUsd(tier.monthly)}/mo · 1-year retention`,
        annualAmount: 0,
        included: true,
      })
    } else {
      lines.push({
        id: 'fwd-observability',
        name: `Observability · ${tier.name}`,
        meta: plan.includedObservability
          ? `Size up from ${getObservabilityTier(plan.includedObservability).name} · +${formatUsd(delta / 12)}/mo`
          : `Add-on · ${formatUsd(tier.monthly)}/mo · 1-year retention`,
        annualAmount: plan.includedObservability ? delta : selectedAnnual,
        included: false,
      })
    }
  }

  const includedConnAnnual = connectionsAnnual(plan.includedConnections)
  const selectedConn = Math.max(0, config.connections)
  if (selectedConn > 0) {
    const selectedAnnual = connectionsAnnual(selectedConn)
    const delta = Math.max(0, selectedAnnual - includedConnAnnual)
    const monthly = getConnectionsMonthly(selectedConn)
    if (selectedConn <= plan.includedConnections) {
      lines.push({
        id: 'fwd-connections',
        name: `Connect · ${selectedConn.toLocaleString('en-US')}`,
        meta: `Included · ${formatUsd(monthly)}/mo`,
        annualAmount: 0,
        included: true,
      })
    } else {
      lines.push({
        id: 'fwd-connections',
        name: `Connect · ${selectedConn.toLocaleString('en-US')}`,
        meta:
          plan.includedConnections > 0
            ? `Size up from ${plan.includedConnections.toLocaleString('en-US')} · +${formatUsd(delta / 12)}/mo`
            : `Add-on · ${formatUsd(monthly)}/mo`,
        annualAmount: delta > 0 ? delta : selectedAnnual,
        included: false,
      })
    }
  }

  const gateway = GATEWAY_COMMITS.find((g) => g.id === config.gateway) ?? GATEWAY_COMMITS[0]
  if (gateway.id !== 'none') {
    lines.push({
      id: 'fwd-gateway',
      name: `Gateway commit · ${gateway.name}`,
      meta:
        gateway.bonusCreditRate != null
          ? `Market rate + 5.5% · ${formatPercent(gateway.bonusCreditRate)} bonus credit`
          : 'Market rate + 5.5%',
      // Commit is spend commitment, not a Mastra SKU charge in the example
      annualAmount: 0,
      included: true,
    })
  }

  return lines
}

// —— Forward quote ——

export interface ForwardQuoteLine {
  id: string
  name: string
  meta?: string
  /** Amount for the selected billing period. */
  amount: number
  /** @deprecated Use amount */
  annualAmount: number
  included?: boolean
}

export interface ForwardQuote {
  plan: ForwardPlan
  /** Hours commitment: 3-month (quarter) or 12-month (year). */
  hoursCommitment: ForwardHoursCommitment
  /** @deprecated Use hoursCommitment */
  billingPeriod: ForwardHoursCommitment
  /** Always annual subscription billing. */
  periodLabel: '/ yr'
  commitmentWeeks: number
  /** Annual subscription for embedded engineering. */
  planAmount: number
  /** @deprecated Use planAmount */
  planAnnual: number
  hoursPerWeek: number
  selectedFeatures: EnterpriseFeatureId[]
  /** Features included by the plan (always + picks). */
  includedFeatureIds: EnterpriseFeatureId[]
  packageLines: ForwardPackageLine[]
  packageOverageTotal: number
  lines: ForwardQuoteLine[]
  /** Forward annual subscription total. */
  periodTotal: number
  /** @deprecated Use periodTotal */
  annualTotal: number
}

export interface BuildForwardQuoteInput {
  planId: ForwardPlanId
  /** Annual subscription amount for embedded engineering. */
  planAmount: number
  /** @deprecated Use planAmount */
  planAnnual?: number
  hoursPerWeek: number
  hoursCommitment?: ForwardHoursCommitment
  /** @deprecated Use hoursCommitment */
  billingPeriod?: ForwardHoursCommitment
  /** Customer picks from the plan's feature pool. */
  featurePicks: EnterpriseFeatureId[]
  /** Extra enterprise features purchased beyond plan inclusion. */
  extraFeatures?: EnterpriseFeatureId[]
  /**
   * Platform packages (Deploys / Observability / Connect / Gateway).
   * Omitted for now — Forward quotes are hours + features only.
   */
  packages?: ForwardPackageConfig | null
}

export function resolveIncludedFeatures(
  plan: ForwardPlan,
  featurePicks: EnterpriseFeatureId[],
): EnterpriseFeatureId[] {
  const picks = featurePicks
    .filter((id) => plan.featurePool.includes(id))
    .slice(0, plan.featurePickCount)
  return [...new Set([...plan.includedFeatures, ...picks])]
}

export function buildForwardQuote(input: BuildForwardQuoteInput): ForwardQuote {
  const plan = getForwardPlan(input.planId)
  const hoursCommitment = resolveForwardHoursCommitment(
    plan,
    input.hoursCommitment ?? input.billingPeriod,
  )
  const commitmentWeeks = getForwardCommitmentWeeks(hoursCommitment)
  const periodLabel = getForwardPeriodLabel(hoursCommitment)
  const hoursOptions = getForwardPlanHoursOptions(plan)
  const hoursPerWeek = hoursOptions.includes(input.hoursPerWeek)
    ? input.hoursPerWeek
    : (hoursOptions[0] ?? plan.hoursMin)
  // Annual subscription = hours/wk × $300 × commitment weeks (13 or 52).
  const planAmount = Math.max(
    0,
    Math.round(input.planAmount ?? input.planAnnual ?? 0),
  )

  const includedFeatureIds = resolveIncludedFeatures(plan, input.featurePicks)
  const packageLines = input.packages
    ? buildForwardPackageLines(plan, input.packages)
    : []
  const packageOverageTotal = packageLines.reduce(
    (sum, line) => sum + line.annualAmount,
    0,
  )

  const lines: ForwardQuoteLine[] = [
    {
      id: 'forward-plan',
      name: `Mastra Forward · ${plan.name}`,
      meta: `${formatUsd(FORWARD_EMBEDDED_SELL_RATE_PER_HOUR)}/hr · ${hoursPerWeek} hrs/wk × ${commitmentWeeks} wks (${hoursCommitment === 'quarter' ? '3-mo hours' : '12-mo hours'}) · annual subscription · ${plan.hoursNote}`,
      amount: planAmount,
      annualAmount: planAmount,
    },
  ]

  for (const featureId of includedFeatureIds) {
    const feature = ENTERPRISE_FEATURES.find((f) => f.id === featureId)!
    const tiIncluded =
      featureId === 'trace-intelligence'
        ? getForwardTraceIncludedMonthly(plan)
        : null
    lines.push({
      id: `fwd-feature-${featureId}`,
      name: feature.name,
      meta:
        tiIncluded != null
          ? `Included with Forward plan · ${tiIncluded.toLocaleString('en-US')} traces/mo`
          : 'Included with Forward plan',
      amount: 0,
      annualAmount: 0,
      included: true,
    })
  }

  for (const line of packageLines) {
    lines.push({
      id: line.id,
      name: line.name,
      meta: line.meta,
      amount: line.annualAmount,
      annualAmount: line.annualAmount,
      included: line.included,
    })
  }

  const periodTotal = planAmount + packageOverageTotal
  return {
    plan,
    hoursCommitment,
    billingPeriod: hoursCommitment,
    periodLabel,
    commitmentWeeks,
    planAmount,
    planAnnual: planAmount,
    hoursPerWeek,
    selectedFeatures: includedFeatureIds,
    includedFeatureIds,
    packageLines,
    packageOverageTotal,
    lines,
    periodTotal,
    annualTotal: periodTotal,
  }
}

export function formatForwardPriceRange(plan: ForwardPlan): string {
  if (plan.priceMax == null) {
    return `${formatUsd(plan.priceMin)}+`
  }
  return `${formatUsd(plan.priceMin)}–${formatUsd(plan.priceMax)}`
}
