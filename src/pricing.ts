/** Mastra Pricing v5 — seat-based plans (primary table). */

export type PlanId =
  | 'free'
  | 'teams'
  | 'enterprise-platform'
  | 'enterprise-self-hosted'
  | 'byovpc'
  | 'private-cloud'
  | 'byoc'

export type SeatRateColumn = 'platform' | 'selfHosted' | 'isolation'

export interface Plan {
  id: PlanId
  name: string
  description: string
  features: string[]
  /** Annual floor for Enterprise plans; 0 for Free / Teams. */
  annualMinimum: number
  /** Included developer seats in the plan commitment. */
  includedDeveloperSeats: number
  /** Max developer seats. null = unlimited. */
  maxDeveloperSeats: number | null
  /** Monthly per-developer rate column for volume tiers. null = flat/free. */
  seatRateColumn: SeatRateColumn | null
  /** Flat monthly developer seat rate. When set, volume tiers do not apply. */
  flatDeveloperSeatMonthly?: number
  /** Flat monthly price (Teams). */
  flatMonthly: number | null
  /** Hosted Platform — usage packages apply. */
  hasUsage: boolean
  isEnterprise: boolean
  future?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Unlimited users. Bounded usage grant.',
    features: ['Unlimited users', 'Bounded usage grant'],
    annualMinimum: 0,
    includedDeveloperSeats: 0,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatMonthly: 0,
    hasUsage: false,
    isEnterprise: false,
  },
  {
    id: 'teams',
    name: 'Teams',
    description:
      'SOC 2, data residency, reduced usage grants. Self-serve, monthly.',
    features: ['SOC 2', 'Data residency', 'Self-serve, monthly'],
    annualMinimum: 0,
    includedDeveloperSeats: 0,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatMonthly: 250,
    hasUsage: false,
    isEnterprise: false,
  },
  {
    id: 'enterprise-platform',
    name: 'Enterprise (Platform)',
    description:
      'Auth, SSO, RBAC, FGA, SLA, SOC 2 report, data residency. Annual invoice, usage drawn from a commit.',
    features: [
      '5 developer seats included',
      '$100/seat/mo',
    ],
    annualMinimum: 8_000,
    includedDeveloperSeats: 5,
    maxDeveloperSeats: null,
    seatRateColumn: 'platform',
    flatMonthly: null,
    hasUsage: true,
    isEnterprise: true,
  },
  {
    id: 'enterprise-self-hosted',
    name: 'Enterprise Self-Hosted (Helm Chart)',
    description:
      'Same as Enterprise. The uplift covers usage that cannot be metered.',
    features: [
      '5 developer seats included',
      '$125/seat/mo',
    ],
    annualMinimum: 10_000,
    includedDeveloperSeats: 5,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatDeveloperSeatMonthly: 125,
    flatMonthly: null,
    hasUsage: false,
    isEnterprise: true,
  },
  {
    id: 'byovpc',
    name: 'BYO VPC',
    description:
      "Enterprise, with the data plane running inside the customer's own VPC. Mastra operates the control plane, so usage is still metered.",
    features: [
      '10 developer seats included',
      '$150/seat/mo',
    ],
    annualMinimum: 30_000,
    includedDeveloperSeats: 10,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatDeveloperSeatMonthly: 150,
    flatMonthly: null,
    hasUsage: false,
    isEnterprise: true,
  },
  {
    id: 'private-cloud',
    name: 'Private Cloud',
    description:
      'Enterprise, deployed into a dedicated single-tenant environment Mastra operates.',
    features: [
      '10 developer seats included',
      '$150/seat/mo',
    ],
    annualMinimum: 50_000,
    includedDeveloperSeats: 10,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatDeveloperSeatMonthly: 150,
    flatMonthly: null,
    hasUsage: false,
    isEnterprise: true,
  },
  {
    id: 'byoc',
    name: 'BYOC',
    description: "Mastra-operated inside the customer's own cloud account",
    features: [
      '10 developer seats included',
      '$200/seat/mo',
    ],
    annualMinimum: 100_000,
    includedDeveloperSeats: 10,
    maxDeveloperSeats: null,
    seatRateColumn: null,
    flatDeveloperSeatMonthly: 200,
    flatMonthly: null,
    hasUsage: false,
    isEnterprise: true,
  },
]

export function getPlan(planId: PlanId): Plan {
  return PLANS.find((p) => p.id === planId) ?? PLANS[0]
}

/** Builder and viewer seats are Enterprise only. Builders are $50/mo. Viewers are free. */
export const BUILDER_SEAT_MONTHLY = 50
export const VIEWER_SEAT_MONTHLY = 0

export interface VolumeTier {
  minSeats: number
  /** Inclusive upper bound; null = no upper bound. */
  maxSeats: number | null
  platform: number
  selfHosted: number
  isolation: number
}

/** Developer seat volume tiers ($/seat/mo). Platform bills every seat at the matching tier. */
export const VOLUME_TIERS: VolumeTier[] = [
  {
    minSeats: 1,
    maxSeats: 50,
    platform: 100,
    selfHosted: 125,
    isolation: 150,
  },
  {
    minSeats: 51,
    maxSeats: 150,
    platform: 85,
    selfHosted: 105,
    isolation: 125,
  },
  {
    minSeats: 151,
    maxSeats: 400,
    platform: 70,
    selfHosted: 85,
    isolation: 105,
  },
  {
    minSeats: 401,
    maxSeats: null,
    platform: 55,
    selfHosted: 65,
    isolation: 80,
  },
]

export function getVolumeTier(developerSeats: number): VolumeTier {
  const seats = Math.max(1, developerSeats)
  for (const tier of VOLUME_TIERS) {
    const withinMax = tier.maxSeats === null || seats <= tier.maxSeats
    if (seats >= tier.minSeats && withinMax) return tier
  }
  return VOLUME_TIERS[VOLUME_TIERS.length - 1]
}

export function getDeveloperSeatMonthlyRate(
  plan: Plan,
  developerSeats: number,
): number {
  if (plan.flatDeveloperSeatMonthly != null) return plan.flatDeveloperSeatMonthly
  if (plan.seatRateColumn == null) return 0
  const tier = getVolumeTier(developerSeats)
  return tier[plan.seatRateColumn]
}

export type AddonId = 'agent-learning' | 'compliance' | 'premium-on-call'

export interface Addon {
  id: AddonId
  name: string
  description: string
  /** Fraction of seat contract. */
  rate: number
  /** Annual floor; 0 = no floor. */
  annualMinimum: number
  /** Enterprise only. */
  enterpriseOnly: boolean
}

export const ADDONS: Addon[] = [
  {
    id: 'agent-learning',
    name: 'Agent Learning',
    description: 'Trace Intelligence, Custom Signals',
    rate: 0.3,
    annualMinimum: 7_500,
    enterpriseOnly: true,
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'BAA, HIPAA, audit logging. Enterprise only.',
    rate: 0.25,
    annualMinimum: 5_000,
    enterpriseOnly: true,
  },
  {
    id: 'premium-on-call',
    name: 'Premium on-call support',
    description:
      'Named on-call rotation, escalation path via Slack, response commitments beyond the standard SLA. Enterprise only.',
    rate: 0.2,
    annualMinimum: 15_000,
    enterpriseOnly: true,
  },
]

export const AGENCY_PROGRAM_ID = 'program-agency'
export const DESIGN_PARTNER_ID = 'program-design-partner'

export const AGENCY_ANNUAL_FEE = 10_000
export const DESIGN_PARTNER_ANNUAL_FEE = 12_000
export const DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS = 10
export const DESIGN_PARTNER_INCLUDED_BUILDER_SEATS = 5
/** Additional developer seats beyond the Design Partner grant. */
export const DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY = 100
/** Monthly credit toward Agent Learning under DPP. */
export const DESIGN_PARTNER_AGENT_LEARNING_CREDIT_MONTHLY = 250

/** DPP may choose Enterprise Platform or Self-Hosted only. */
export const DPP_ALLOWED_PLANS: PlanId[] = [
  'enterprise-platform',
  'enterprise-self-hosted',
]

export function isAddonAvailable(addon: Addon, plan: Plan): boolean {
  return plan.isEnterprise && addon.enterpriseOnly
}

export interface SeatCounts {
  developer: number
  builder: number
  viewer: number
}

export function clampSeats(plan: Plan, seats: SeatCounts): SeatCounts {
  if (!plan.isEnterprise) {
    return { developer: 0, builder: 0, viewer: 0 }
  }

  const maxDev = plan.maxDeveloperSeats
  let developer = Math.max(0, Math.floor(seats.developer))
  if (maxDev != null) {
    developer = Math.min(maxDev, developer)
  } else {
    developer = Math.max(plan.includedDeveloperSeats, developer)
  }

  const builder = Math.max(0, Math.floor(seats.builder))
  const viewer = Math.max(0, Math.floor(seats.viewer))
  return { developer, builder, viewer }
}

export interface SeatPricing {
  developerMonthlyRate: number
  developerAnnual: number
  /** Developer seats billed above the included block. */
  extraDeveloperSeats: number
  extraDeveloperAnnual: number
  builderAnnual: number
  viewerAnnual: number
  /** Developer + builder annual before plan minimum floor. */
  seatContractRaw: number
  /** Billed plan/seat annual (max of minimum and seat math). */
  planAnnual: number
  /** Seat contract used for add-on % — billed plan annual. */
  seatContract: number
  minimumApplied: boolean
}

export function priceSeats(plan: Plan, seats: SeatCounts): SeatPricing {
  const clamped = clampSeats(plan, seats)

  if (plan.id === 'free') {
    return {
      developerMonthlyRate: 0,
      developerAnnual: 0,
      extraDeveloperSeats: 0,
      extraDeveloperAnnual: 0,
      builderAnnual: 0,
      viewerAnnual: 0,
      seatContractRaw: 0,
      planAnnual: 0,
      seatContract: 0,
      minimumApplied: false,
    }
  }

  if (plan.flatMonthly != null) {
    const planAnnual = plan.flatMonthly * 12
    return {
      developerMonthlyRate: 0,
      developerAnnual: planAnnual,
      extraDeveloperSeats: 0,
      extraDeveloperAnnual: 0,
      builderAnnual: 0,
      viewerAnnual: 0,
      seatContractRaw: planAnnual,
      planAnnual,
      seatContract: planAnnual,
      minimumApplied: false,
    }
  }

  const rate = getDeveloperSeatMonthlyRate(plan, clamped.developer)
  const extraDeveloperSeats = Math.max(
    0,
    clamped.developer - plan.includedDeveloperSeats,
  )
  const extraDeveloperAnnual = extraDeveloperSeats * rate * 12
  const builderAnnual = clamped.builder * BUILDER_SEAT_MONTHLY * 12
  const planAnnual =
    plan.annualMinimum + extraDeveloperAnnual + builderAnnual
  return {
    developerMonthlyRate: rate,
    developerAnnual: extraDeveloperAnnual,
    extraDeveloperSeats,
    extraDeveloperAnnual,
    builderAnnual,
    viewerAnnual: 0,
    seatContractRaw: extraDeveloperAnnual + builderAnnual,
    planAnnual,
    seatContract: planAnnual,
    minimumApplied: false,
  }
}

/** Design Partner and Agency: included seats are inside the program fee. */
function priceProgramSeats(annualFee: number, seats: SeatCounts): SeatPricing {
  const extraDeveloperSeats = Math.max(
    0,
    seats.developer - DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS,
  )
  const extraBuilderSeats = Math.max(
    0,
    seats.builder - DESIGN_PARTNER_INCLUDED_BUILDER_SEATS,
  )
  const extraDeveloperAnnual =
    extraDeveloperSeats * DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY * 12
  const builderAnnual = extraBuilderSeats * BUILDER_SEAT_MONTHLY * 12
  const planAnnual = annualFee + extraDeveloperAnnual + builderAnnual
  return {
    developerMonthlyRate:
      extraDeveloperSeats > 0 ? DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY : 0,
    developerAnnual: extraDeveloperAnnual,
    extraDeveloperSeats,
    extraDeveloperAnnual,
    builderAnnual,
    viewerAnnual: 0,
    seatContractRaw: extraDeveloperAnnual + builderAnnual,
    planAnnual,
    seatContract: planAnnual,
    minimumApplied: false,
  }
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

/** Each add-on bills independently: max(rate × seat contract, annual minimum). */
export function priceAddons(
  plan: Plan,
  seatContract: number,
  selectedAddonIds: AddonId[],
): AddonPricing {
  const available = ADDONS.filter(
    (addon) =>
      selectedAddonIds.includes(addon.id) && isAddonAvailable(addon, plan),
  )

  const lines: AddonLine[] = available.map((addon) => {
    const fromRate = seatContract * addon.rate
    const listAmount = Math.max(addon.annualMinimum, fromRate)
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
  seats: SeatCounts
  seatPricing: SeatPricing
  addonPricing: AddonPricing
  designPartner: boolean
  agency: boolean
  programAnnual: number
  dppAgentLearningCredit: number
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
  seats: SeatCounts
  selectedAddonIds: AddonId[]
  designPartner?: boolean
  agency?: boolean
  platformConfig?: PlatformConfig
}

export function buildQuote(input: BuildQuoteInput): Quote {
  const plan = input.planId == null ? null : getPlan(input.planId)
  const designPartner = Boolean(input.designPartner)
  const agency = Boolean(input.agency) && !designPartner

  let effectivePlan = plan
  const programSelected = designPartner || agency
  if (
    programSelected &&
    effectivePlan != null &&
    !DPP_ALLOWED_PLANS.includes(effectivePlan.id)
  ) {
    effectivePlan = getPlan('enterprise-platform')
  }

  const seats = effectivePlan
    ? clampSeats(effectivePlan, input.seats)
    : {
        developer: Math.max(0, Math.floor(input.seats.developer)),
        builder: Math.max(0, Math.floor(input.seats.builder)),
        viewer: Math.max(0, Math.floor(input.seats.viewer)),
      }

  const emptySeatPricing: SeatPricing = {
    developerMonthlyRate: 0,
    developerAnnual: 0,
    extraDeveloperSeats: 0,
    extraDeveloperAnnual: 0,
    builderAnnual: 0,
    viewerAnnual: 0,
    seatContractRaw: 0,
    planAnnual: 0,
    seatContract: 0,
    minimumApplied: false,
  }

  let seatPricing: SeatPricing
  let programAnnual = 0
  let dppAgentLearningCredit = 0

  if (designPartner) {
    programAnnual = DESIGN_PARTNER_ANNUAL_FEE
    seatPricing = priceProgramSeats(DESIGN_PARTNER_ANNUAL_FEE, seats)
  } else if (agency) {
    programAnnual = AGENCY_ANNUAL_FEE
    seatPricing = priceProgramSeats(AGENCY_ANNUAL_FEE, seats)
  } else if (effectivePlan) {
    seatPricing = priceSeats(effectivePlan, seats)
  } else {
    seatPricing = emptySeatPricing
  }

  const addonPlan =
    effectivePlan ?? (programSelected ? getPlan('enterprise-platform') : null)
  const addonIds = addonPlan
    ? input.selectedAddonIds.filter((id) => {
        const addon = ADDONS.find((a) => a.id === id)
        return addon != null && isAddonAvailable(addon, addonPlan)
      })
    : []

  let addonPricing = addonPlan
    ? priceAddons(addonPlan, seatPricing.seatContract, addonIds)
    : { lines: [], total: 0 }

  if (designPartner && addonIds.includes('agent-learning')) {
    dppAgentLearningCredit =
      DESIGN_PARTNER_AGENT_LEARNING_CREDIT_MONTHLY * 12
    const lines = addonPricing.lines.map((line) => {
      if (line.addon.id !== 'agent-learning') return line
      const billed = Math.max(0, line.billedAmount - dppAgentLearningCredit)
      return { ...line, billedAmount: billed }
    })
    addonPricing = {
      lines,
      total: lines.reduce((sum, line) => sum + line.billedAmount, 0),
    }
  }

  const platformSelected = Boolean(effectivePlan?.hasUsage) && !designPartner
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

  if (designPartner || agency) {
    const programFee = designPartner
      ? DESIGN_PARTNER_ANNUAL_FEE
      : AGENCY_ANNUAL_FEE
    productLines.push({
      id: designPartner ? DESIGN_PARTNER_ID : AGENCY_PROGRAM_ID,
      name: designPartner
        ? 'Mastra Design Partner Program'
        : 'Mastra Agency Partner Program',
      meta: effectivePlan
        ? `${effectivePlan.name} · includes ${DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS} developer seats and ${DESIGN_PARTNER_INCLUDED_BUILDER_SEATS} builder seats`
        : `Includes ${DESIGN_PARTNER_INCLUDED_DEVELOPER_SEATS} developer seats and ${DESIGN_PARTNER_INCLUDED_BUILDER_SEATS} builder seats`,
      annualAmount: programFee,
      period: '/ yr',
    })
    if (seatPricing.extraDeveloperSeats > 0) {
      productLines.push({
        id: 'developer-seats',
        name: 'Additional developer seats',
        meta: `${seatPricing.extraDeveloperSeats} × ${formatUsd(DESIGN_PARTNER_EXTRA_DEVELOPER_MONTHLY)}/seat/mo`,
        annualAmount: seatPricing.extraDeveloperAnnual,
        period: '/ yr',
      })
    }
    const extraBuilderSeats = Math.max(
      0,
      seats.builder - DESIGN_PARTNER_INCLUDED_BUILDER_SEATS,
    )
    if (extraBuilderSeats > 0) {
      productLines.push({
        id: 'builder-seats',
        name: 'Additional builder seats',
        meta: `${extraBuilderSeats} × ${formatUsd(BUILDER_SEAT_MONTHLY)}/seat/mo`,
        annualAmount: seatPricing.builderAnnual,
        period: '/ yr',
      })
    }
  } else if (effectivePlan?.id === 'free') {
    productLines.push({
      id: 'plan',
      name: 'Free',
      meta: 'Unlimited users · bounded usage grant',
      annualAmount: 0,
      period: '/ yr',
    })
  } else if (effectivePlan?.id === 'teams') {
    productLines.push({
      id: 'plan',
      name: 'Teams',
      meta: 'Self-serve, monthly',
      annualAmount: (effectivePlan.flatMonthly ?? 0) * 12,
      period: '/ yr',
    })
  } else if (effectivePlan) {
    const included = Math.min(
      seats.developer,
      effectivePlan.includedDeveloperSeats,
    )
    productLines.push({
      id: 'plan',
      name: effectivePlan.name,
      meta: `Includes ${included} developer seat${included === 1 ? '' : 's'}`,
      annualAmount: effectivePlan.annualMinimum,
      period: '/ yr',
    })
    productLines.push({
      id: 'included-developer-seats',
      name: 'Developer seats',
      meta: `${included} included`,
      annualAmount: 0,
      period: '/ yr',
      included: true,
    })
    if (seatPricing.extraDeveloperSeats > 0) {
      productLines.push({
        id: 'developer-seats',
        name: 'Additional developer seats',
        meta: `${seatPricing.extraDeveloperSeats} × ${formatUsd(seatPricing.developerMonthlyRate)}/seat/mo`,
        annualAmount: seatPricing.extraDeveloperAnnual,
        period: '/ yr',
      })
    }
    if (seats.builder > 0) {
      productLines.push({
        id: 'builder-seats',
        name: 'Builder seats',
        meta: `${seats.builder} × ${formatUsd(BUILDER_SEAT_MONTHLY)}/mo`,
        annualAmount: seatPricing.builderAnnual,
        period: '/ yr',
      })
    }
  }

  if (effectivePlan?.isEnterprise && seats.viewer > 0) {
    productLines.push({
      id: 'viewer-seats',
      name: 'Viewer seats',
      meta: `${seats.viewer} · free`,
      annualAmount: 0,
      period: '/ yr',
    })
  }

  for (const line of addonPricing.lines) {
    productLines.push({
      id: line.addon.id,
      name: line.addon.name,
      meta: [
        `${formatPercent(line.addon.rate)} of seat contract`,
        line.addon.annualMinimum > 0
          ? `${formatUsd(line.addon.annualMinimum)} min`
          : null,
        designPartner &&
        line.addon.id === 'agent-learning' &&
        dppAgentLearningCredit > 0
          ? `${formatUsd(dppAgentLearningCredit)} DPP credit`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      annualAmount: line.billedAmount,
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
    seatPricing.planAnnual + addonPricing.total + platformOverageTotal

  return {
    plan: effectivePlan,
    seats,
    seatPricing,
    addonPricing,
    designPartner,
    agency,
    programAnnual,
    dppAgentLearningCredit,
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
