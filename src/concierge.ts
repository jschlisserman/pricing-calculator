import { formatUsd } from './pricing'

export type Path1TierId =
  | 'support-path1-small'
  | 'support-path1-medium'
  | 'support-path1-large'

export type Path2PackageId =
  | 'support-path2-evals'
  | 'support-path2-integrations'
  | 'support-path2-infrastructure'
  | 'support-path2-custom'

export const AUDIT_ID = 'support-audit'

/** Flat Mastra Audit fee (Pricing v5). */
export const AUDIT_FEE = 500

/** Weeks in a quarterly Path 1 engagement (for implied hourly). */
export const PATH1_WEEKS_PER_QUARTER = 13

/** Default fully loaded engineer cost for Support margin ($/hr). */
export const DEFAULT_ENGINEER_COST_PER_HOUR = 110

export interface Path1Tier {
  id: Path1TierId
  name: string
  hoursPerWeek: number
  /** Quarterly list price (flat). */
  quarterlyPrice: number
  /** Approximate annual package (quarterly ×4 less ~10%, per doc). */
  annualPrice: number
}

export const PATH1_TIERS: Path1Tier[] = [
  {
    id: 'support-path1-small',
    name: 'Small',
    hoursPerWeek: 2,
    quarterlyPrice: 9_000,
    annualPrice: 32_000,
  },
  {
    id: 'support-path1-medium',
    name: 'Medium',
    hoursPerWeek: 6,
    quarterlyPrice: 24_000,
    annualPrice: 86_000,
  },
  {
    id: 'support-path1-large',
    name: 'Large',
    hoursPerWeek: 20,
    quarterlyPrice: 70_000,
    annualPrice: 250_000,
  },
]

export interface Path2Package {
  id: Path2PackageId
  name: string
}

export const PATH2_PACKAGES: Path2Package[] = [
  { id: 'support-path2-evals', name: 'Evals' },
  { id: 'support-path2-integrations', name: 'Integrations' },
  { id: 'support-path2-infrastructure', name: 'Infrastructure' },
  { id: 'support-path2-custom', name: 'Custom' },
]

/** Target gross margins for Path 2 outcome pricing. */
export const PATH2_MARGIN_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7] as const
export type Path2MarginRate = (typeof PATH2_MARGIN_OPTIONS)[number]
export const DEFAULT_PATH2_MARGIN: Path2MarginRate = 0.5

export const PATH1_IDS = new Set(PATH1_TIERS.map((t) => t.id))
export const PATH2_IDS = new Set(PATH2_PACKAGES.map((p) => p.id))

export const SUPPORT_IDS = new Set<string>([
  ...PATH1_IDS,
  ...PATH2_IDS,
  AUDIT_ID,
])

export function isSupportId(id: string): boolean {
  return SUPPORT_IDS.has(id)
}

export function isPath1Id(id: string): id is Path1TierId {
  return PATH1_IDS.has(id as Path1TierId)
}

export function isPath2Id(id: string): id is Path2PackageId {
  return PATH2_IDS.has(id as Path2PackageId)
}

export function getPath1Tier(id: string): Path1Tier | undefined {
  return PATH1_TIERS.find((t) => t.id === id)
}

export function getPath2Package(id: string): Path2Package | undefined {
  return PATH2_PACKAGES.find((p) => p.id === id)
}

export type Path1BillingPeriod = 'quarter' | 'year'

export function getPath1ListPrice(
  tier: Path1Tier,
  billingPeriod: Path1BillingPeriod = 'quarter',
): number {
  return billingPeriod === 'year' ? tier.annualPrice : tier.quarterlyPrice
}

export function getPath1PeriodLabel(
  billingPeriod: Path1BillingPeriod,
): '/ qtr' | '/ yr' {
  return billingPeriod === 'year' ? '/ yr' : '/ qtr'
}

export function getPath1HoursPerQuarter(tier: Path1Tier): number {
  return tier.hoursPerWeek * PATH1_WEEKS_PER_QUARTER
}

export function getPath1ImpliedHourly(
  price: number,
  tier: Path1Tier,
  billingPeriod: Path1BillingPeriod = 'quarter',
): number {
  const hoursPerQuarter = getPath1HoursPerQuarter(tier)
  const hours =
    billingPeriod === 'year' ? hoursPerQuarter * 4 : hoursPerQuarter
  return hours > 0 ? price / hours : 0
}

export function getPath2Cost(
  hours: number,
  engineerCostPerHour = DEFAULT_ENGINEER_COST_PER_HOUR,
): number {
  return Math.max(0, hours) * Math.max(0, engineerCostPerHour)
}

export function getPath2PriceFromMargin(
  cost: number,
  marginRate: number,
): number {
  if (!(cost > 0) || !(marginRate > 0) || !(marginRate < 1)) return 0
  return cost / (1 - marginRate)
}

export function getPath2ListPrice(
  hours: number,
  marginRate: number,
  engineerCostPerHour = DEFAULT_ENGINEER_COST_PER_HOUR,
): number {
  return getPath2PriceFromMargin(
    getPath2Cost(hours, engineerCostPerHour),
    marginRate,
  )
}

export function getAuditFee(): number {
  return AUDIT_FEE
}

export function withoutOtherPath1Tiers(
  selectedIds: string[],
  keepId: Path1TierId,
): string[] {
  return selectedIds.filter((id) => !isPath1Id(id) || id === keepId)
}

export function withoutSupportItems(selectedIds: string[]): string[] {
  return selectedIds.filter((id) => !isSupportId(id))
}

export interface SupportPath1Line {
  tier: Path1Tier
  billingPeriod: Path1BillingPeriod
  listAmount: number
  billedAmount: number
  impliedHourly: number
  /** Annual package price (doc table), regardless of selected billing. */
  annualPackage: number
  hoursPerQuarter: number
  periodLabel: '/ qtr' | '/ yr'
}

export interface SupportPath2Line {
  package: Path2Package
  hours: number
  engineerCostPerHour: number
  cost: number
  targetMarginRate: Path2MarginRate
  listAmount: number
  billedAmount: number
}

export interface SupportAuditLine {
  listAmount: number
  billedAmount: number
}

export interface SupportQuote {
  path1: SupportPath1Line | null
  path2: SupportPath2Line[]
  audit: SupportAuditLine | null
  /** Path 1 billed amount in the selected billing period. */
  path1Total: number
  path1BillingPeriod: Path1BillingPeriod
  oneTimeTotal: number
  path2Total: number
  auditTotal: number
}

export type Path2Hours = Partial<Record<Path2PackageId, number>>
export type Path2Margins = Partial<Record<Path2PackageId, Path2MarginRate>>

export function buildSupportQuote(
  selectedIds: string[],
  path2Hours: Path2Hours = {},
  path2Margins: Path2Margins = {},
  engineerCostPerHour = DEFAULT_ENGINEER_COST_PER_HOUR,
  path1BillingPeriod: Path1BillingPeriod = 'quarter',
): SupportQuote {
  const rate = Math.max(0, engineerCostPerHour)

  const path1Id = selectedIds.find(isPath1Id)
  const path1Tier = path1Id ? getPath1Tier(path1Id) : undefined
  const path1: SupportPath1Line | null =
    path1Tier != null
      ? (() => {
          const listAmount = getPath1ListPrice(path1Tier, path1BillingPeriod)
          return {
            tier: path1Tier,
            billingPeriod: path1BillingPeriod,
            listAmount,
            billedAmount: listAmount,
            impliedHourly: getPath1ImpliedHourly(
              listAmount,
              path1Tier,
              path1BillingPeriod,
            ),
            annualPackage: path1Tier.annualPrice,
            hoursPerQuarter: getPath1HoursPerQuarter(path1Tier),
            periodLabel: getPath1PeriodLabel(path1BillingPeriod),
          }
        })()
      : null

  const path2: SupportPath2Line[] = PATH2_PACKAGES.filter((pkg) =>
    selectedIds.includes(pkg.id),
  ).map((pkg) => {
    const hours = Math.max(0, path2Hours[pkg.id] ?? 0)
    const targetMarginRate = path2Margins[pkg.id] ?? DEFAULT_PATH2_MARGIN
    const cost = getPath2Cost(hours, rate)
    const listAmount = getPath2PriceFromMargin(cost, targetMarginRate)
    return {
      package: pkg,
      hours,
      engineerCostPerHour: rate,
      cost,
      targetMarginRate,
      listAmount,
      billedAmount: listAmount,
    }
  })

  const auditSelected = selectedIds.includes(AUDIT_ID)
  const auditList = auditSelected ? getAuditFee() : 0
  const audit: SupportAuditLine | null = auditSelected
    ? { listAmount: auditList, billedAmount: auditList }
    : null

  const path1Billed = path1?.billedAmount ?? 0
  const path2Billed = path2.reduce((sum, line) => sum + line.billedAmount, 0)
  const auditBilled = audit?.billedAmount ?? 0

  return {
    path1,
    path2,
    audit,
    path1Total: path1Billed,
    path1BillingPeriod,
    path2Total: path2Billed,
    auditTotal: auditBilled,
    oneTimeTotal: path2Billed + auditBilled,
  }
}

export interface SupportMargin {
  path1Revenue: number
  path1Cost: number
  path1HoursPerWeek: number
  path1HoursPerQuarter: number
  path1Margin: number
  path1MarginRate: number | null
  path2: Array<{
    id: Path2PackageId
    name: string
    revenue: number
    hours: number
    cost: number
    targetMarginRate: Path2MarginRate
    margin: number
    marginRate: number | null
  }>
  path2Revenue: number
  path2Cost: number
  path2Margin: number
  path2MarginRate: number | null
  engineerCostPerHour: number
}

export function buildSupportMargin(
  support: SupportQuote,
  engineerCostPerHour: number,
): SupportMargin {
  const rate = Math.max(0, engineerCostPerHour)
  const path1HoursPerWeek = support.path1?.tier.hoursPerWeek ?? 0
  const path1HoursPerQuarter = path1HoursPerWeek * PATH1_WEEKS_PER_QUARTER
  const path1BillingPeriod = support.path1BillingPeriod
  const path1Revenue = support.path1Total
  const path1Cost =
    path1HoursPerQuarter *
    rate *
    (path1BillingPeriod === 'year' ? 4 : 1)
  const path1Margin = path1Revenue - path1Cost
  const path1MarginRate = path1Revenue > 0 ? path1Margin / path1Revenue : null

  const path2 = support.path2.map((line) => {
    const revenue = line.billedAmount
    const cost = line.cost
    const margin = revenue - cost
    return {
      id: line.package.id,
      name: line.package.name,
      revenue,
      hours: line.hours,
      cost,
      targetMarginRate: line.targetMarginRate,
      margin,
      marginRate: revenue > 0 ? margin / revenue : null,
    }
  })
  const path2Revenue = path2.reduce((sum, row) => sum + row.revenue, 0)
  const path2Cost = path2.reduce((sum, row) => sum + row.cost, 0)
  const path2Margin = path2Revenue - path2Cost

  return {
    path1Revenue,
    path1Cost,
    path1HoursPerWeek,
    path1HoursPerQuarter,
    path1Margin,
    path1MarginRate,
    path2,
    path2Revenue,
    path2Cost,
    path2Margin,
    path2MarginRate: path2Revenue > 0 ? path2Margin / path2Revenue : null,
    engineerCostPerHour: rate,
  }
}

export interface SupportPath1TableRow {
  name: string
  hoursPerWeek: number
  quarterly: string
  annual: string
  impliedHourly: string
}

export const SUPPORT_PATH1_TABLE: SupportPath1TableRow[] = PATH1_TIERS.map(
  (tier) => {
    const hourly = getPath1ImpliedHourly(tier.quarterlyPrice, tier)
    return {
      name: tier.name,
      hoursPerWeek: tier.hoursPerWeek,
      quarterly: formatUsd(tier.quarterlyPrice),
      annual: formatUsd(tier.annualPrice),
      impliedHourly: formatUsd(Math.round(hourly)),
    }
  },
)

export interface SupportPath2MarginExampleRow {
  hours: number
  cost: string
  margins: Record<string, string>
}

export const SUPPORT_PATH2_MARGIN_EXAMPLES: SupportPath2MarginExampleRow[] = [
  40, 80, 120, 200, 400,
].map((hours) => {
  const cost = getPath2Cost(hours)
  const margins = Object.fromEntries(
    PATH2_MARGIN_OPTIONS.map((rate) => [
      `${Math.round(rate * 100)}%`,
      formatUsd(Math.round(getPath2PriceFromMargin(cost, rate))),
    ]),
  )
  return {
    hours,
    cost: formatUsd(cost),
    margins,
  }
})
