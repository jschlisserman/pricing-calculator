export type BillingPeriod = 'year' | 'quarter'

export type ProductKind = 'individual' | 'bundle' | 'program'

export interface CatalogItem {
  id: string
  name: string
  category: string
  description?: string
  features?: string[]
  basePrice: number
  billingPeriod: BillingPeriod
  kind: ProductKind
  future?: boolean
}

/** Growth-band (25–99) list prices. Headcount-band multipliers apply on top. */
export const CATALOG: CatalogItem[] = [
  {
    id: 'deploy-helm',
    name: 'Helm Chart',
    category: 'Deployment',
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'deploy-self-hosted',
    name: 'Self-Hosted',
    category: 'Deployment',
    description:
      'No base subscription — select products or bundles for pricing.',
    basePrice: 0,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'deploy-platform',
    name: 'Platform',
    category: 'Deployment',
    description:
      'No base subscription — select products or bundles for pricing. Usage packages meter additional volume.',
    basePrice: 0,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'deploy-byoc',
    name: 'BYOC',
    category: 'Deployment',
    description:
      'Not offered with Agency or Design Partner unless explicit permission is given.',
    basePrice: 100_000,
    billingPeriod: 'year',
    kind: 'individual',
    future: true,
  },
  {
    id: 'security-controls',
    name: 'Security and Controls',
    category: 'Security and Controls',
    description: 'Sold as a bundle of features',
    features: ['FGA', 'RBAC', 'Auth', 'HIPAA', 'SOC II', 'FGC'],
    basePrice: 10_000,
    billingPeriod: 'year',
    kind: 'bundle',
  },
  {
    id: 'agent-learning',
    name: 'Agent Learning',
    category: 'Agent Learning',
    description: 'Sold as a bundle of features',
    features: ['Trace Intelligence', 'Custom Signals', 'Agent Learning'],
    basePrice: 14_000,
    billingPeriod: 'year',
    kind: 'bundle',
  },
  {
    id: 'collab-agent-builder',
    name: 'Agent Builder',
    category: 'Collaboration',
    basePrice: 12_000,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'program-agency',
    name: 'Mastra Agency Program',
    category: 'Programs',
    description:
      'BYOC is not offered with Agency unless explicit permission is given.',
    basePrice: 10_000,
    billingPeriod: 'year',
    kind: 'program',
  },
  {
    id: 'program-design-partner',
    name: 'Mastra Design Partner Program',
    category: 'Programs',
    description:
      'BYOC is not offered with Design Partner unless explicit permission is given.',
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'program',
  },
]

export const CATEGORY_ORDER = [
  'Deployment',
  'Security and Controls',
  'Agent Learning',
  'Collaboration',
  'Programs',
] as const

export interface HeadcountBand {
  id: string
  name: string
  headcount: string
  minEmployees: number
  /** Exclusive upper bound; null means no upper bound. */
  maxEmployees: number | null
  multiplier: number
  custom?: boolean
  deployment: string
  security: string
  agentLearning: string
  collaboration: string
  allFour: string
}

/**
 * Growth (25–99) is the 1.0x list-price baseline.
 * Product category prices assume one Deployment / Security / Agent Learning /
 * Collaboration purchase at list (Helm Chart, Security bundle, etc.).
 */
export const HEADCOUNT_BANDS: HeadcountBand[] = [
  {
    id: 'startup',
    name: 'Startup',
    headcount: '1–24',
    minEmployees: 1,
    maxEmployees: 24,
    multiplier: 0.5,
    deployment: '$6,000',
    security: '$5,000',
    agentLearning: '$7,000',
    collaboration: '$6,000',
    allFour: '$24,000',
  },
  {
    id: 'growth',
    name: 'Growth',
    headcount: '25–99',
    minEmployees: 25,
    maxEmployees: 99,
    multiplier: 1,
    deployment: '$12,000',
    security: '$10,000',
    agentLearning: '$14,000',
    collaboration: '$12,000',
    allFour: '$48,000',
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    headcount: '100–499',
    minEmployees: 100,
    maxEmployees: 499,
    multiplier: 1.75,
    deployment: '$21,000',
    security: '$17,500',
    agentLearning: '$24,500',
    collaboration: '$21,000',
    allFour: '$84,000',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headcount: '500–1,999',
    minEmployees: 500,
    maxEmployees: 1_999,
    multiplier: 2.5,
    deployment: '$30,000',
    security: '$25,000',
    agentLearning: '$35,000',
    collaboration: '$30,000',
    allFour: '$120,000',
  },
  {
    id: 'enterprise-plus',
    name: 'Enterprise+',
    headcount: '2,000–4,999',
    minEmployees: 2_000,
    maxEmployees: 4_999,
    multiplier: 4,
    deployment: '$48,000',
    security: '$40,000',
    agentLearning: '$56,000',
    collaboration: '$48,000',
    allFour: '$192,000',
  },
  {
    id: 'global',
    name: 'Global',
    headcount: '5,000–9,999',
    minEmployees: 5_000,
    maxEmployees: 9_999,
    multiplier: 6,
    deployment: '$72,000',
    security: '$60,000',
    agentLearning: '$84,000',
    collaboration: '$72,000',
    allFour: '$288,000',
  },
  {
    id: 'global-plus',
    name: 'Global+',
    headcount: '10,000+',
    minEmployees: 10_000,
    maxEmployees: null,
    multiplier: 8,
    custom: true,
    deployment: '$96,000+',
    security: '$80,000+',
    agentLearning: '$112,000+',
    collaboration: '$96,000+',
    allFour: '$384,000+',
  },
]

export function getHeadcountBand(employees: number): HeadcountBand {
  const normalized = Math.max(0, employees)
  if (normalized < 1) return HEADCOUNT_BANDS[0]

  for (const band of HEADCOUNT_BANDS) {
    const withinMin = normalized >= band.minEmployees
    const withinMax =
      band.maxEmployees === null || normalized <= band.maxEmployees
    if (withinMin && withinMax) return band
  }

  return HEADCOUNT_BANDS[HEADCOUNT_BANDS.length - 1]
}

export interface DppHeadcountBand {
  id: string
  name: string
  headcount: string
  minEmployees: number
  maxEmployees: number | null
  multiplier: number
  annualFee: number
}

/** Design Partner Program — Startup–Mid-Market only. Startup ($8k) is 1.0x. */
export const DESIGN_PARTNER_BASE = 8_000

export const DPP_HEADCOUNT_BANDS: DppHeadcountBand[] = [
  {
    id: 'startup',
    name: 'Startup',
    headcount: '1–24',
    minEmployees: 1,
    maxEmployees: 24,
    multiplier: 1,
    annualFee: 8_000,
  },
  {
    id: 'growth',
    name: 'Growth',
    headcount: '25–99',
    minEmployees: 25,
    maxEmployees: 99,
    multiplier: 15_000 / DESIGN_PARTNER_BASE,
    annualFee: 15_000,
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    headcount: '100–499',
    minEmployees: 100,
    maxEmployees: 499,
    multiplier: 22_000 / DESIGN_PARTNER_BASE,
    annualFee: 22_000,
  },
]

/** DPP is not offered at Enterprise (500+) or above. */
export function isDppEligible(employees: number): boolean {
  return employees >= 1 && employees <= 499
}

export function getDppHeadcountBand(
  employees: number,
): DppHeadcountBand | null {
  if (!isDppEligible(employees)) return null

  const normalized = Math.max(1, employees)
  for (const band of DPP_HEADCOUNT_BANDS) {
    const withinMin = normalized >= band.minEmployees
    const withinMax =
      band.maxEmployees === null || normalized <= band.maxEmployees
    if (withinMin && withinMax) return band
  }

  return DPP_HEADCOUNT_BANDS[DPP_HEADCOUNT_BANDS.length - 1]
}

export const DESIGN_PARTNER_ID = 'program-design-partner'
export const PLATFORM_ID = 'deploy-platform'
export const HELM_ID = 'deploy-helm'
export const SELF_HOSTED_ID = 'deploy-self-hosted'
export const BYOC_ID = 'deploy-byoc'
export const AGENT_LEARNING_ID = 'agent-learning'
export const SECURITY_ID = 'security-controls'
export const AGENT_BUILDER_ID = 'collab-agent-builder'

export const PROGRAM_IDS = CATALOG.filter((item) => item.kind === 'program').map(
  (item) => item.id,
)

export const DEPLOYMENT_IDS = CATALOG.filter(
  (item) => item.category === 'Deployment',
).map((item) => item.id)

/**
 * Self-managed deployment options that gate Agent Learning.
 * (Platform keeps Agent Learning available.)
 */
export const SELF_HOSTED_DEPLOYMENT_IDS = [
  HELM_ID,
  SELF_HOSTED_ID,
  BYOC_ID,
] as const

/** Catalog IDs unavailable when Helm / Self-Hosted / BYOC is selected. */
export const GATED_BY_SELF_HOSTED_IDS = [AGENT_LEARNING_ID] as const

/** Must pick a Deployment before these can be selected. */
export const REQUIRES_DEPLOYMENT_IDS = [
  SECURITY_ID,
  AGENT_LEARNING_ID,
  AGENT_BUILDER_ID,
] as const

export function isProgramId(itemId: string): boolean {
  return PROGRAM_IDS.includes(itemId)
}

export function isDeploymentId(itemId: string): boolean {
  return DEPLOYMENT_IDS.includes(itemId)
}

export function hasDeploymentSelected(selectedIds: string[]): boolean {
  return selectedIds.some((id) => isDeploymentId(id))
}

export function requiresDeployment(itemId: string): boolean {
  return (REQUIRES_DEPLOYMENT_IDS as readonly string[]).includes(itemId)
}

/** Security / Agent Learning / Collaboration need a Deployment first. */
export function isDeploymentRequiredGated(
  itemId: string,
  selectedIds: string[],
): boolean {
  if (!requiresDeployment(itemId) || selectedIds.includes(itemId)) return false
  return !hasDeploymentSelected(selectedIds)
}

/** Drop packages that require Deployment when none is selected. */
export function withoutDeploymentRequiredItems(
  selectedIds: string[],
): string[] {
  if (hasDeploymentSelected(selectedIds)) return selectedIds
  return selectedIds.filter((id) => !requiresDeployment(id))
}

/** Another Deployment SKU is already selected — deselect it first. */
export function isDeploymentExclusiveGated(
  itemId: string,
  selectedIds: string[],
): boolean {
  if (!isDeploymentId(itemId) || selectedIds.includes(itemId)) return false
  return selectedIds.some((id) => isDeploymentId(id))
}

/** Keep at most one Deployment option. */
export function withoutOtherDeployments(
  selectedIds: string[],
  keepDeploymentId: string,
): string[] {
  return selectedIds.filter(
    (id) => !isDeploymentId(id) || id === keepDeploymentId,
  )
}

export function hasProgramSelected(selectedIds: string[]): boolean {
  return selectedIds.some((id) => isProgramId(id))
}

export function hasNonProgramSelected(selectedIds: string[]): boolean {
  return selectedIds.some((id) => !isProgramId(id))
}

/** Keep at most one program (Agency vs Design Partner are mutually exclusive). */
export function withoutOtherPrograms(
  selectedIds: string[],
  keepProgramId: string,
): string[] {
  return selectedIds.filter(
    (id) => !isProgramId(id) || id === keepProgramId,
  )
}

export function hasSelfHostedDeployment(selectedIds: string[]): boolean {
  return SELF_HOSTED_DEPLOYMENT_IDS.some((id) => selectedIds.includes(id))
}

export function isGatedBySelfHosted(itemId: string): boolean {
  return (GATED_BY_SELF_HOSTED_IDS as readonly string[]).includes(itemId)
}

/**
 * Programs are gated when a Deployment is selected (and vice versa).
 * Concierge is also unavailable while a Program is selected (handled in UI/toggle).
 * BYOC still needs permission to combine with Agency / DPP.
 */
export function isProgramExclusiveGated(
  itemId: string,
  selectedIds: string[],
): boolean {
  if (isProgramId(itemId)) {
    return hasDeploymentSelected(selectedIds)
  }
  if (isDeploymentId(itemId)) {
    return hasProgramSelected(selectedIds)
  }
  return false
}

export function withoutSelfHostedGatedItems(selectedIds: string[]): string[] {
  if (!hasSelfHostedDeployment(selectedIds)) return selectedIds
  return selectedIds.filter((id) => !isGatedBySelfHosted(id))
}

export function withoutIncompatibleProgramMix(selectedIds: string[]): string[] {
  const programs = selectedIds.filter((id) => isProgramId(id))
  // Agency and Design Partner cannot both be selected — keep the latest.
  let next =
    programs.length > 1
      ? withoutOtherPrograms(selectedIds, programs[programs.length - 1])
      : selectedIds

  const hasProgram = hasProgramSelected(next)
  const hasDeployment = hasDeploymentSelected(next)
  if (!(hasProgram && hasDeployment)) return next
  // Prefer keeping the side that matches the latest id in the list.
  const lastId = next[next.length - 1]
  if (isProgramId(lastId)) {
    return withoutDeploymentRequiredItems(
      next.filter((id) => !isDeploymentId(id)),
    )
  }
  return next.filter((id) => !isProgramId(id))
}

export interface PlatformUsageMetric {
  id: string
  name: string
  unitCost: number
  /** Shown next to the unit cost, e.g. "event", "GB", "hour". */
  unitLabel: string
  /** Baseline free tier note (applies when package include is 0). */
  includedNote?: string
}

export const PLATFORM_USAGE_METRICS: PlatformUsageMetric[] = [
  {
    id: 'observability-events',
    name: 'Observability Events',
    unitCost: 0.00008,
    unitLabel: 'event',
    includedNote: 'First 1,000,000 events free outside package includes',
  },
  {
    id: 'data-egress',
    name: 'Data Egress (GB)',
    unitCost: 0.8,
    unitLabel: 'GB',
    includedNote: 'First 100 GB free outside package includes',
  },
  {
    id: 'cpu-time',
    name: 'CPU Time (Hour)',
    unitCost: 0.25,
    unitLabel: 'hour',
    includedNote: 'First 250 hours free outside package includes',
  },
  {
    id: 'rows-written',
    name: 'Rows Written (LibSQL)',
    unitCost: 0.000002,
    unitLabel: 'row',
  },
  {
    id: 'compute-hours',
    name: 'Compute Hours (Postgres)',
    unitCost: 0.4,
    unitLabel: 'hour',
  },
  {
    id: 'data-storage',
    name: 'Data Storage GB',
    unitCost: 0.75,
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
  /** Include amounts calibrated for PLATFORM_USAGE_REFERENCE_ANNUAL. */
  includes: PlatformUsageAmounts
}

/** Package include tables are authored against this annual Platform reference. */
export const PLATFORM_USAGE_REFERENCE_ANNUAL = 30_000

/**
 * Growth-band reference used only to scale Platform usage includes.
 * Platform itself has no billed base subscription.
 */
export const PLATFORM_USAGE_SCALE_GROWTH_BASE = 10_000

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

/**
 * Round to the nearest 1 / 2 / 2.5 / 5 × 10^n quantity.
 * Keeps scaled package grants from jumping back up to the full reference
 * (e.g. 5.83M → 5M, 2.67M → 2.5M).
 */
export function roundUpUsageQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  const exp = Math.floor(Math.log10(value))
  const magnitude = 10 ** exp
  const fraction = value / magnitude
  const candidates = [1, 2, 2.5, 5, 10]
  let best = candidates[0]
  let bestDist = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const dist = Math.abs(fraction - candidate)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return best * magnitude
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

/** DPP usage package authored against Growth DPP fee ($15k/year). */
export const DPP_USAGE_REFERENCE_ANNUAL = 15_000

export const DPP_USAGE_REFERENCE_INCLUDES: PlatformUsageAmounts = {
  'observability-events': 5_000_000,
  'data-egress': 500,
  'cpu-time': 1_250,
  'rows-written': 50_000_000,
  'compute-hours': 250,
  'data-storage': 50,
}

export interface DppUsageConfig {
  includes: PlatformUsageAmounts
  additional: PlatformUsageAmounts
}

export function getDppAnnualFee(employees: number): number {
  return getDppHeadcountBand(employees)?.annualFee ?? 0
}

export function dppUsageConfigFromEmployees(employees: number): DppUsageConfig {
  const fee = getDppAnnualFee(employees)
  return {
    includes: scaleUsageIncludes(
      DPP_USAGE_REFERENCE_INCLUDES,
      fee > 0 ? fee : DPP_USAGE_REFERENCE_ANNUAL,
      DPP_USAGE_REFERENCE_ANNUAL,
    ),
    additional: emptyPlatformUsage(),
  }
}

export function defaultDppUsageConfig(employees = 50): DppUsageConfig {
  return dppUsageConfigFromEmployees(employees)
}

export interface PlatformConfig {
  packageId: PlatformPackageId
  includes: PlatformUsageAmounts
  /** Additional volume beyond package includes, billed at unit cost. */
  additional: PlatformUsageAmounts
}

/** Billed Platform base subscription — always $0 (no base fee). */
export function getPlatformListPrice(_employees: number): number {
  return 0
}

/** Headcount-scaled annual used to size Platform usage package includes. */
export function getPlatformUsageScaleAnnual(employees: number): number {
  return (
    PLATFORM_USAGE_SCALE_GROWTH_BASE * getHeadcountBand(employees).multiplier
  )
}

export function platformConfigFromPackage(
  packageId: PlatformPackageId,
  employees: number,
): PlatformConfig {
  const preset =
    PLATFORM_PACKAGES.find((pkg) => pkg.id === packageId) ?? PLATFORM_PACKAGES[0]
  const scaleAnnual = getPlatformUsageScaleAnnual(employees)
  return {
    packageId: preset.id,
    includes: scalePlatformIncludes(preset.includes, scaleAnnual),
    additional: emptyPlatformUsage(),
  }
}

export function defaultPlatformConfig(employees = 50): PlatformConfig {
  return platformConfigFromPackage('enterprise-standard', employees)
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
  /**
   * Fixed list / overage unit cost (same as metric.unitCost; does not scale
   * and is not discounted).
   */
  listUnitCost: number
  /** Purchase price for additional usage: 50% of list unit cost. */
  billedUnitCost: number
  /** Billed amount for purchased additional usage. */
  cost: number
}

/**
 * Purchased additional usage is billed at 50% of the fixed list unit cost.
 * Overage / list unit cost itself stays at full unitCost (not discounted).
 */
export const ADDITIONAL_USAGE_DISCOUNT = 0.5

export function getAdditionalUsageUnitPrice(listUnitCost: number): number {
  return listUnitCost * (1 - ADDITIONAL_USAGE_DISCOUNT)
}

export function buildPlatformUsageLines(
  amounts: PlatformUsageAmounts,
): PlatformUsageLine[] {
  return PLATFORM_USAGE_METRICS.map((metric) => {
    const additionalAmount = Math.max(0, amounts[metric.id] ?? 0)
    const billedUnitCost = getAdditionalUsageUnitPrice(metric.unitCost)
    return {
      metric,
      additionalAmount,
      listUnitCost: metric.unitCost,
      billedUnitCost,
      cost: additionalAmount * billedUnitCost,
    }
  }).filter((line) => line.additionalAmount > 0)
}

export function sumPlatformUsage(amounts: PlatformUsageAmounts): number {
  return buildPlatformUsageLines(amounts).reduce((sum, line) => sum + line.cost, 0)
}

/** Value at fixed list unit cost (includes / delivery cost; does not scale). */
export function costOfUsageAmounts(amounts: PlatformUsageAmounts): number {
  return PLATFORM_USAGE_METRICS.reduce((sum, metric) => {
    const qty = Math.max(0, amounts[metric.id] ?? 0)
    return sum + qty * metric.unitCost
  }, 0)
}

export interface PlatformUsageCostLine {
  metric: PlatformUsageMetric
  amount: number
  /** Fixed list unit cost. */
  listUnitCost: number
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
      listUnitCost: metric.unitCost,
      cost: amount * metric.unitCost,
    }
  }).filter((line) => line.amount > 0)
}

export interface PlatformMargin {
  /** Product total / year (billed), used as margin revenue. */
  revenue: number
  additionalRevenue: number
  includeCost: number
  /** Delivery cost of additional at full fixed unit cost. */
  additionalCost: number
  totalCost: number
  margin: number
  marginRate: number | null
  includeLines: PlatformUsageCostLine[]
  additionalCostLines: PlatformUsageCostLine[]
  additionalRevenueLines: PlatformUsageLine[]
}

/**
 * Platform / DPP margin: product total / year vs delivery cost of included
 * usage + additional usage (both at full fixed unit cost).
 */
export function buildPlatformMargin(
  productAnnualTotal: number,
  includes: PlatformUsageAmounts,
  additional: PlatformUsageAmounts,
): PlatformMargin {
  const includeLines = buildUsageCostLines(includes)
  const additionalCostLines = buildUsageCostLines(additional)
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

/** Sized list amount for a catalog item at a given headcount. */
export function getCatalogListAmount(
  item: CatalogItem,
  employees: number,
): number {
  if (item.id === DESIGN_PARTNER_ID) {
    const band = getDppHeadcountBand(employees)
    return band?.annualFee ?? 0
  }
  // BYOC: Startup and Growth share the $100k Growth list; scale from Mid-Market up.
  if (item.id === BYOC_ID) {
    const multiplier = Math.max(1, getHeadcountBand(employees).multiplier)
    return item.basePrice * multiplier
  }
  return item.basePrice * getHeadcountBand(employees).multiplier
}

export function getCompanySizeMultiplier(employees: number): number {
  return getHeadcountBand(employees).multiplier
}

export function getCompanySizeLabel(employees: number): string {
  const band = getHeadcountBand(employees)
  return `${band.name} (${band.headcount})`
}

export function formatMultiplier(multiplier: number, custom = false): string {
  const rounded = Math.round(multiplier * 1000) / 1000
  const value = Number.isInteger(rounded)
    ? `${rounded}.0`
    : String(rounded)
  return custom ? `Custom, ${value}x floor` : `${value}x`
}

/** Growth-band category list prices used to derive band tables. */
export const PRODUCT_CATEGORY_BASES = {
  deployment: 12_000,
  security: 10_000,
  agentLearning: 14_000,
  collaboration: 12_000,
} as const

/** Agency client pass-through: 30% off product bands; $7.5k minimum on total. */
export const AGENCY_PASS_THROUGH_DISCOUNT = 0.3
export const AGENCY_PASS_THROUGH_MINIMUM = 7_500

/** Round dollars to the nearest significant whole amount (nearest $1,000). */
export function roundAgencyPassThroughFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.round(amount / 1_000) * 1_000
}

export function agencyPassThroughFee(
  growthBase: number,
  multiplier: number,
): number {
  return roundAgencyPassThroughFee(
    growthBase * multiplier * (1 - AGENCY_PASS_THROUGH_DISCOUNT),
  )
}

export interface AgencyPassThroughBand {
  id: string
  name: string
  headcount: string
  multiplier: number
  custom?: boolean
  deployment: string
  security: string
  agentLearning: string
  collaboration: string
  allFour: string
}

function formatBandUsd(amount: number, custom = false): string {
  return `${formatUsd(amount)}${custom ? '+' : ''}`
}

export const AGENCY_PASS_THROUGH_BANDS: AgencyPassThroughBand[] =
  HEADCOUNT_BANDS.map((band) => {
    const deployment = agencyPassThroughFee(
      PRODUCT_CATEGORY_BASES.deployment,
      band.multiplier,
    )
    const security = agencyPassThroughFee(
      PRODUCT_CATEGORY_BASES.security,
      band.multiplier,
    )
    const agentLearning = agencyPassThroughFee(
      PRODUCT_CATEGORY_BASES.agentLearning,
      band.multiplier,
    )
    const collaboration = agencyPassThroughFee(
      PRODUCT_CATEGORY_BASES.collaboration,
      band.multiplier,
    )
    const allFour = Math.max(
      deployment + security + agentLearning + collaboration,
      AGENCY_PASS_THROUGH_MINIMUM,
    )
    const custom = Boolean(band.custom)

    return {
      id: band.id,
      name: band.name,
      headcount: band.headcount,
      multiplier: band.multiplier,
      custom: band.custom,
      deployment: formatBandUsd(deployment, custom),
      security: formatBandUsd(security, custom),
      agentLearning: formatBandUsd(agentLearning, custom),
      collaboration: formatBandUsd(collaboration, custom),
      allFour: formatBandUsd(allFour, custom),
    }
  })

/** Multi-purchase discount from count of distinct package purchases. */
export function getVolumeDiscount(purchaseCount: number): number {
  if (purchaseCount >= 4) return 0.25
  if (purchaseCount === 3) return 0.2
  if (purchaseCount === 2) return 0.15
  return 0
}

export interface LineItem {
  item: CatalogItem
  /** Sized list price in the item's native billing period. */
  listAmount: number
  /** Billed amount (same as list for packages; Concierge handled separately). */
  billedAmount: number
}

export interface Quote {
  lineItems: LineItem[]
  productLineItems: LineItem[]
  purchaseCount: number
  productPurchaseCount: number
  companyMultiplier: number
  companySizeLabel: string
  companyBandId: string
  companyCustom: boolean
  dppEligible: boolean
  dppBandId: string | null
  dppMultiplier: number | null
  /** Volume % off package products. Concierge does not waive this. */
  discountRate: number
  discountAmount: number
  productSubtotal: number
  productTotal: number
  platformPackageId: PlatformPackageId | null
  platformPackageName: string | null
  platformBasePrice: number
  platformIncludes: PlatformUsageAmounts
  platformUsageLines: PlatformUsageLine[]
  platformOverageTotal: number
  platformUsageTotal: number
  dppIncludes: PlatformUsageAmounts
  dppUsageLines: PlatformUsageLine[]
  dppOverageTotal: number
  /** Products after discount + platform/DPP overage (excludes Concierge). */
  annualTotal: number
}

export function buildQuote(
  selectedIds: string[],
  employees: number,
  platformConfig: PlatformConfig = defaultPlatformConfig(),
  dppUsageConfig: DppUsageConfig = defaultDppUsageConfig(),
): Quote {
  const dppEligible = isDppEligible(employees)
  const selfHostedSelected = hasSelfHostedDeployment(selectedIds)
  const programSelected = hasProgramSelected(selectedIds)
  const deploymentSelected = hasDeploymentSelected(selectedIds)
  const selected = CATALOG.filter((item) => {
    if (!selectedIds.includes(item.id)) return false
    if (item.id === DESIGN_PARTNER_ID && !dppEligible) return false
    if (selfHostedSelected && isGatedBySelfHosted(item.id)) return false
    if (requiresDeployment(item.id) && !deploymentSelected) return false
    if (programSelected && deploymentSelected) {
      // Prefer deployment side if both somehow present; UI prevents this mix.
      if (item.kind === 'program') return false
    }
    return true
  })
  // Agency and Design Partner are mutually exclusive — keep the last selected.
  const programIdsInOrder = selectedIds.filter((id) => isProgramId(id))
  const keepProgramId =
    programIdsInOrder.length > 0
      ? programIdsInOrder[programIdsInOrder.length - 1]
      : null
  // Deployment options are mutually exclusive — keep the last selected.
  const deploymentIdsInOrder = selectedIds.filter((id) => isDeploymentId(id))
  const keepDeploymentId =
    deploymentIdsInOrder.length > 0
      ? deploymentIdsInOrder[deploymentIdsInOrder.length - 1]
      : null
  const selectedExclusive = selected.filter((item) => {
    if (
      keepProgramId !== null &&
      item.kind === 'program' &&
      item.id !== keepProgramId
    ) {
      return false
    }
    if (
      keepDeploymentId !== null &&
      isDeploymentId(item.id) &&
      item.id !== keepDeploymentId
    ) {
      return false
    }
    return true
  })
  const band = getHeadcountBand(employees)
  const dppBand = getDppHeadcountBand(employees)
  const multiplier = band.multiplier

  const productItems = selectedExclusive
  const platformSelected = selectedExclusive.some(
    (item) => item.id === PLATFORM_ID,
  )
  const dppSelected = selectedExclusive.some(
    (item) => item.id === DESIGN_PARTNER_ID,
  )

  const productLineItems: LineItem[] = productItems.map((item) => {
    const listAmount = getCatalogListAmount(item, employees)
    return { item, listAmount, billedAmount: listAmount }
  })

  // $0 deployment options (Self-Hosted / Platform) do not count toward volume.
  const productPurchaseCount = productLineItems.filter(
    (li) => li.listAmount > 0,
  ).length
  const lineItems = [...productLineItems]

  // Concierge never participates in or suppresses the package volume ladder.
  // Platform / DPP usage overage is metered separately and not volume-discounted.
  const discountRate = getVolumeDiscount(productPurchaseCount)

  const productSubtotal = productLineItems.reduce(
    (sum, li) => sum + li.listAmount,
    0,
  )
  const discountAmount = productSubtotal * discountRate
  const productTotal = productSubtotal - discountAmount

  const platformBasePrice = platformSelected
    ? getPlatformListPrice(employees)
    : 0
  const platformIncludes = platformSelected
    ? platformConfig.includes
    : emptyPlatformUsage()
  const platformUsageLines = platformSelected
    ? buildPlatformUsageLines(platformConfig.additional)
    : []
  const platformOverageTotal = platformUsageLines.reduce(
    (sum, line) => sum + line.cost,
    0,
  )
  // Base is already in productTotal via the Platform catalog line.
  const platformUsageTotal = platformBasePrice + platformOverageTotal

  const dppIncludes = dppSelected
    ? dppUsageConfig.includes
    : emptyPlatformUsage()
  const dppUsageLines = dppSelected
    ? buildPlatformUsageLines(dppUsageConfig.additional)
    : []
  const dppOverageTotal = dppUsageLines.reduce(
    (sum, line) => sum + line.cost,
    0,
  )

  const annualTotal = productTotal + platformOverageTotal + dppOverageTotal

  return {
    lineItems,
    productLineItems,
    purchaseCount: lineItems.length,
    productPurchaseCount,
    companyMultiplier: multiplier,
    companySizeLabel: getCompanySizeLabel(employees),
    companyBandId: band.id,
    companyCustom: Boolean(band.custom),
    dppEligible,
    dppBandId: dppBand?.id ?? null,
    dppMultiplier: dppBand?.multiplier ?? null,
    discountRate,
    discountAmount,
    productSubtotal,
    productTotal,
    platformPackageId: platformSelected ? platformConfig.packageId : null,
    platformPackageName: platformSelected
      ? getPlatformPackageName(platformConfig.packageId)
      : null,
    platformBasePrice,
    platformIncludes,
    platformUsageLines,
    platformOverageTotal,
    platformUsageTotal,
    dppIncludes,
    dppUsageLines,
    dppOverageTotal,
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
