import {
  HEADCOUNT_BANDS,
  formatUsd,
  getHeadcountBand,
  type HeadcountBand,
} from './pricing'

export type Path1Mode = 'advisory' | 'hands-on'

export type Path1TierId =
  | 'concierge-path1-small'
  | 'concierge-path1-medium'
  | 'concierge-path1-large'

export type Path2PackageId =
  | 'concierge-path2-evals'
  | 'concierge-path2-integrations'
  | 'concierge-path2-infrastructure'

export const AUDIT_ID = 'concierge-audit'

/** Hands-On is 30% above Advisory. Tunable in one place. */
export const HANDS_ON_MODE_FACTOR = 1.3

/** Weeks in a quarterly Path 1 engagement (for implied hourly). */
export const PATH1_WEEKS_PER_QUARTER = 13

/** Default fully loaded engineer cost for Concierge margin ($/hr). */
export const DEFAULT_ENGINEER_COST_PER_HOUR = 110

/** Concierge discount when purchased with platform packages. */
export const CONCIERGE_DISCOUNT_ONE = 0.15
export const CONCIERGE_DISCOUNT_MULTI = 0.2

/**
 * Labor-capped multipliers by existing headcount band id.
 * Caps at 1.5x so implied hourly stays defensible.
 */
export const CONCIERGE_MULTIPLIERS: Record<string, number> = {
  startup: 0.75,
  growth: 1,
  'mid-market': 1.5,
  enterprise: 1.5,
  'enterprise-plus': 1.5,
  global: 1.5,
  'global-plus': 1.5,
}

export interface Path1Tier {
  id: Path1TierId
  name: string
  hoursPerWeek: number
  /** Advisory base at Growth 1.0x, quarterly. */
  advisoryBase: number
}

export const PATH1_TIERS: Path1Tier[] = [
  {
    id: 'concierge-path1-small',
    name: 'Small',
    hoursPerWeek: 2,
    advisoryBase: 9_000,
  },
  {
    id: 'concierge-path1-medium',
    name: 'Medium',
    hoursPerWeek: 6,
    advisoryBase: 24_000,
  },
  {
    id: 'concierge-path1-large',
    name: 'Large',
    hoursPerWeek: 20,
    advisoryBase: 70_000,
  },
]

export interface Path2Package {
  id: Path2PackageId
  name: string
  /** Indicative floor at Growth 1.0x (placeholder pending scoping). */
  indicativeFloor: number
}

export const PATH2_PACKAGES: Path2Package[] = [
  {
    id: 'concierge-path2-evals',
    name: 'Evals',
    indicativeFloor: 40_000,
  },
  {
    id: 'concierge-path2-integrations',
    name: 'Integrations',
    indicativeFloor: 30_000,
  },
  {
    id: 'concierge-path2-infrastructure',
    name: 'Infrastructure',
    indicativeFloor: 100_000,
  },
]

/** Flat Mastra Audit fee by headcount band id. */
export const AUDIT_FEES_BY_BAND: Record<string, number> = {
  startup: 1_000,
  growth: 1_500,
  'mid-market': 3_000,
  enterprise: 4_000,
  'enterprise-plus': 5_000,
  global: 5_000,
  'global-plus': 5_000,
}

export const PATH1_IDS = new Set(PATH1_TIERS.map((t) => t.id))
export const PATH2_IDS = new Set(PATH2_PACKAGES.map((p) => p.id))

export const CONCIERGE_IDS = new Set<string>([
  ...PATH1_IDS,
  ...PATH2_IDS,
  AUDIT_ID,
])

export function isConciergeId(id: string): boolean {
  return CONCIERGE_IDS.has(id)
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

export function getConciergeMultiplier(employees: number): number {
  const band = getHeadcountBand(employees)
  return CONCIERGE_MULTIPLIERS[band.id] ?? 1
}

export function getConciergeMultiplierForBand(band: HeadcountBand): number {
  return CONCIERGE_MULTIPLIERS[band.id] ?? 1
}

export function modeFactor(mode: Path1Mode): number {
  return mode === 'hands-on' ? HANDS_ON_MODE_FACTOR : 1
}

export function getPath1QuarterlyList(
  tier: Path1Tier,
  mode: Path1Mode,
  employees: number,
): number {
  return (
    tier.advisoryBase *
    getConciergeMultiplier(employees) *
    modeFactor(mode)
  )
}

export function getPath1HoursPerQuarter(tier: Path1Tier): number {
  return tier.hoursPerWeek * PATH1_WEEKS_PER_QUARTER
}

export function getPath1ImpliedHourly(
  quarterlyPrice: number,
  tier: Path1Tier,
): number {
  const hours = getPath1HoursPerQuarter(tier)
  return hours > 0 ? quarterlyPrice / hours : 0
}

export function getPath2Floor(
  pkg: Path2Package,
  employees: number,
): number {
  return pkg.indicativeFloor * getConciergeMultiplier(employees)
}

export function getAuditFee(employees: number): number {
  const band = getHeadcountBand(employees)
  return AUDIT_FEES_BY_BAND[band.id] ?? 0
}

export function getConciergeDiscountRate(packagePurchaseCount: number): number {
  if (packagePurchaseCount >= 2) return CONCIERGE_DISCOUNT_MULTI
  if (packagePurchaseCount === 1) return CONCIERGE_DISCOUNT_ONE
  return 0
}

export function withoutOtherPath1Tiers(
  selectedIds: string[],
  keepId: Path1TierId,
): string[] {
  return selectedIds.filter((id) => !isPath1Id(id) || id === keepId)
}

export interface ConciergePath1Line {
  tier: Path1Tier
  mode: Path1Mode
  listAmount: number
  billedAmount: number
  impliedHourly: number
  annualized: number
  hoursPerQuarter: number
}

export interface ConciergePath2Line {
  package: Path2Package
  floor: number
  scopedPrice: number | null
  listAmount: number
  billedAmount: number
  isOverridden: boolean
}

export interface ConciergeAuditLine {
  listAmount: number
  billedAmount: number
}

export interface ConciergeQuote {
  path1: ConciergePath1Line | null
  path2: ConciergePath2Line[]
  audit: ConciergeAuditLine | null
  discountRate: number
  discountAmount: number
  /** Path 1 after Concierge discount (quarterly). */
  path1TotalQuarterly: number
  /** Path 2 + Audit after Concierge discount (one-time). */
  oneTimeTotal: number
  path2Total: number
  auditTotal: number
  /** Path 1 annualized (quarterly × 4) after discount. */
  path1Annualized: number
  multiplier: number
}

export type Path2ScopedPrices = Partial<Record<Path2PackageId, number | null>>
/** Manual Path 2 delivery hours for margin (× engineer $/hr). */
export type Path2Hours = Partial<Record<Path2PackageId, number>>

export function buildConciergeQuote(
  selectedIds: string[],
  employees: number,
  path1Mode: Path1Mode,
  path2ScopedPrices: Path2ScopedPrices = {},
  packagePurchaseCount: number,
): ConciergeQuote {
  const multiplier = getConciergeMultiplier(employees)
  const discountRate = getConciergeDiscountRate(packagePurchaseCount)

  const path1Id = selectedIds.find(isPath1Id)
  const path1Tier = path1Id ? getPath1Tier(path1Id) : undefined
  const path1: ConciergePath1Line | null =
    path1Tier != null
      ? (() => {
          const listAmount = getPath1QuarterlyList(
            path1Tier,
            path1Mode,
            employees,
          )
          const billedAmount = listAmount * (1 - discountRate)
          return {
            tier: path1Tier,
            mode: path1Mode,
            listAmount,
            billedAmount,
            impliedHourly: getPath1ImpliedHourly(listAmount, path1Tier),
            annualized: listAmount * 4,
            hoursPerQuarter: getPath1HoursPerQuarter(path1Tier),
          }
        })()
      : null

  const path2: ConciergePath2Line[] = PATH2_PACKAGES.filter((pkg) =>
    selectedIds.includes(pkg.id),
  ).map((pkg) => {
    const floor = getPath2Floor(pkg, employees)
    const scoped = path2ScopedPrices[pkg.id]
    const isOverridden =
      scoped != null && Number.isFinite(scoped) && scoped > 0
    const listAmount = isOverridden ? (scoped as number) : floor
    return {
      package: pkg,
      floor,
      scopedPrice: isOverridden ? (scoped as number) : null,
      listAmount,
      billedAmount: listAmount * (1 - discountRate),
      isOverridden,
    }
  })

  const auditSelected = selectedIds.includes(AUDIT_ID)
  const auditList = auditSelected ? getAuditFee(employees) : 0
  const audit: ConciergeAuditLine | null = auditSelected
    ? {
        listAmount: auditList,
        billedAmount: auditList * (1 - discountRate),
      }
    : null

  const path1List = path1?.listAmount ?? 0
  const path2List = path2.reduce((sum, line) => sum + line.listAmount, 0)
  const auditListTotal = audit?.listAmount ?? 0
  const conciergeListTotal = path1List + path2List + auditListTotal
  const discountAmount = conciergeListTotal * discountRate

  return {
    path1,
    path2,
    audit,
    discountRate,
    discountAmount,
    path1TotalQuarterly: path1?.billedAmount ?? 0,
    path2Total: path2.reduce((sum, line) => sum + line.billedAmount, 0),
    auditTotal: audit?.billedAmount ?? 0,
    oneTimeTotal:
      path2.reduce((sum, line) => sum + line.billedAmount, 0) +
      (audit?.billedAmount ?? 0),
    path1Annualized: (path1?.billedAmount ?? 0) * 4,
    multiplier,
  }
}

export interface ConciergeMargin {
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
    margin: number
    marginRate: number | null
  }>
  path2Revenue: number
  path2Cost: number
  path2Margin: number
  path2MarginRate: number | null
  engineerCostPerHour: number
}

/**
 * Concierge margin against fully loaded engineer $/hr.
 * Path 1: quarterly revenue vs rate × hours/week × 13 weeks.
 * Path 2: one-time revenue vs rate × entered engagement hours.
 */
export function buildConciergeMargin(
  concierge: ConciergeQuote,
  engineerCostPerHour: number,
  path2Hours: Path2Hours,
): ConciergeMargin {
  const rate = Math.max(0, engineerCostPerHour)
  const path1HoursPerWeek = concierge.path1?.tier.hoursPerWeek ?? 0
  const path1HoursPerQuarter = path1HoursPerWeek * PATH1_WEEKS_PER_QUARTER
  const path1Revenue = concierge.path1TotalQuarterly
  const path1Cost = path1HoursPerQuarter * rate
  const path1Margin = path1Revenue - path1Cost
  const path1MarginRate =
    path1Revenue > 0 ? path1Margin / path1Revenue : null

  const path2 = concierge.path2.map((line) => {
    const revenue = line.billedAmount
    const hours = Math.max(0, path2Hours[line.package.id] ?? 0)
    const cost = hours * rate
    const margin = revenue - cost
    return {
      id: line.package.id,
      name: line.package.name,
      revenue,
      hours,
      cost,
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

function formatBandUsd(amount: number, custom = false): string {
  return `${formatUsd(amount)}${custom ? '+' : ''}`
}

export interface ConciergePath1BandRow {
  id: string
  name: string
  headcount: string
  multiplier: number
  custom?: boolean
  small: string
  medium: string
  large: string
}

function buildPath1BandRows(mode: Path1Mode): ConciergePath1BandRow[] {
  return HEADCOUNT_BANDS.map((band) => {
    const mult = getConciergeMultiplierForBand(band)
    const custom = Boolean(band.custom)
    const cells = PATH1_TIERS.map((tier) => {
      const quarterly =
        tier.advisoryBase * mult * modeFactor(mode)
      const hourly = getPath1ImpliedHourly(quarterly, tier)
      return `${formatBandUsd(quarterly, custom)} (${formatUsd(Math.round(hourly))}/hr)`
    })
    return {
      id: band.id,
      name: band.name,
      headcount: band.headcount,
      multiplier: mult,
      custom: band.custom,
      small: cells[0],
      medium: cells[1],
      large: cells[2],
    }
  })
}

export const CONCIERGE_PATH1_ADVISORY_BANDS = buildPath1BandRows('advisory')
export const CONCIERGE_PATH1_HANDS_ON_BANDS = buildPath1BandRows('hands-on')

export interface ConciergePath2BandRow {
  id: string
  name: string
  headcount: string
  multiplier: number
  custom?: boolean
  evals: string
  integrations: string
  infrastructure: string
}

export const CONCIERGE_PATH2_BANDS: ConciergePath2BandRow[] =
  HEADCOUNT_BANDS.map((band) => {
    const mult = getConciergeMultiplierForBand(band)
    const custom = Boolean(band.custom)
    return {
      id: band.id,
      name: band.name,
      headcount: band.headcount,
      multiplier: mult,
      custom: band.custom,
      evals: formatBandUsd(40_000 * mult, custom),
      integrations: formatBandUsd(30_000 * mult, custom),
      infrastructure: formatBandUsd(100_000 * mult, custom),
    }
  })

export interface ConciergeAuditBandRow {
  id: string
  name: string
  headcount: string
  fee: string
}

export const CONCIERGE_AUDIT_BANDS: ConciergeAuditBandRow[] =
  HEADCOUNT_BANDS.map((band) => ({
    id: band.id,
    name: band.name,
    headcount: band.headcount,
    fee: formatUsd(AUDIT_FEES_BY_BAND[band.id] ?? 0),
  }))
