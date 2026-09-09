export type BillingPeriod = 'year' | 'quarter'

export type ProductKind = 'individual' | 'bundle' | 'program' | 'support'

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
    basePrice: 12_000,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'deploy-byoc',
    name: 'BYOC',
    category: 'Deployment',
    basePrice: 12_000,
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
    id: 'collab-software-factory',
    name: 'Software Factory',
    category: 'Collaboration',
    description: 'TBD features on Software Factory',
    basePrice: 12_000,
    billingPeriod: 'year',
    kind: 'individual',
    future: true,
  },
  {
    id: 'collab-company-brain',
    name: 'Company Brain',
    category: 'Collaboration',
    basePrice: 12_000,
    billingPeriod: 'year',
    kind: 'individual',
    future: true,
  },
  {
    id: 'program-agency',
    name: 'Mastra Agency Program',
    category: 'Programs',
    basePrice: 10_000,
    billingPeriod: 'year',
    kind: 'program',
  },
  {
    id: 'program-design-partner',
    name: 'Mastra Design Partner Program',
    category: 'Programs',
    description: 'Startup–Mid-Market only · not offered Enterprise+',
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'program',
  },
  {
    id: 'support-small',
    name: 'Support — Small',
    category: 'Support',
    description: '2 hrs / week · 3-month term',
    basePrice: 9_000,
    billingPeriod: 'quarter',
    kind: 'support',
  },
  {
    id: 'support-medium',
    name: 'Support — Medium',
    category: 'Support',
    description: '6 hrs / week · 3-month term',
    basePrice: 24_000,
    billingPeriod: 'quarter',
    kind: 'support',
  },
  {
    id: 'support-large',
    name: 'Support — Large',
    category: 'Support',
    description: '20 hrs / week · 3-month term',
    basePrice: 70_000,
    billingPeriod: 'quarter',
    kind: 'support',
  },
]

export const CATEGORY_ORDER = [
  'Deployment',
  'Security and Controls',
  'Agent Learning',
  'Collaboration',
  'Programs',
  'Support',
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

/** Sized list amount for a catalog item at a given headcount. */
export function getCatalogListAmount(
  item: CatalogItem,
  employees: number,
): number {
  if (item.id === DESIGN_PARTNER_ID) {
    const band = getDppHeadcountBand(employees)
    return band?.annualFee ?? 0
  }
  return item.basePrice * getHeadcountBand(employees).multiplier
}

/** Credit on support when sold with exactly one other purchase. */
export const SUPPORT_BUNDLE_CREDIT_ONE = 0.15
/** Discount on support when sold with 2+ other purchases. */
export const SUPPORT_BUNDLE_CREDIT_MULTI = 0.2

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

export function agencyPassThroughFee(
  growthBase: number,
  multiplier: number,
): number {
  return growthBase * multiplier * (1 - AGENCY_PASS_THROUGH_DISCOUNT)
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

/** Multi-purchase discount from count of distinct non-support purchases. */
export function getVolumeDiscount(purchaseCount: number): number {
  if (purchaseCount >= 4) return 0.25
  if (purchaseCount === 3) return 0.2
  if (purchaseCount === 2) return 0.15
  return 0
}

/**
 * Support credit/discount when bundled with other purchases.
 * 1 other purchase → 15%; 2+ → 20%; otherwise 0.
 */
export function getSupportCreditRate(productPurchaseCount: number): number {
  if (productPurchaseCount >= 2) return SUPPORT_BUNDLE_CREDIT_MULTI
  if (productPurchaseCount === 1) return SUPPORT_BUNDLE_CREDIT_ONE
  return 0
}

export interface LineItem {
  item: CatalogItem
  /** Sized list price in the item's native billing period. */
  listAmount: number
  /** Amount after support credit (products unchanged). */
  billedAmount: number
}

export interface Quote {
  lineItems: LineItem[]
  productLineItems: LineItem[]
  supportLineItem: LineItem | null
  purchaseCount: number
  productPurchaseCount: number
  companyMultiplier: number
  companySizeLabel: string
  companyBandId: string
  companyCustom: boolean
  dppEligible: boolean
  dppBandId: string | null
  dppMultiplier: number | null
  /** True when support is sold with ≥1 other purchase. */
  supportBundled: boolean
  /** Volume % off products only; 0 when support is bundled. */
  discountRate: number
  discountAmount: number
  /** Credit/discount on support when bundled; else 0. */
  supportCreditRate: number
  supportCreditAmount: number
  productSubtotal: number
  productTotal: number
  supportListQuarterly: number
  supportTotalQuarterly: number
}

export function buildQuote(
  selectedIds: string[],
  employees: number,
): Quote {
  const dppEligible = isDppEligible(employees)
  const selected = CATALOG.filter((item) => {
    if (!selectedIds.includes(item.id)) return false
    if (item.id === DESIGN_PARTNER_ID && !dppEligible) return false
    return true
  })
  const band = getHeadcountBand(employees)
  const dppBand = getDppHeadcountBand(employees)
  const multiplier = band.multiplier

  const productItems = selected.filter((item) => item.kind !== 'support')
  const supportItem = selected.find((item) => item.kind === 'support') ?? null

  const productLineItems: LineItem[] = productItems.map((item) => {
    const listAmount = getCatalogListAmount(item, employees)
    return { item, listAmount, billedAmount: listAmount }
  })

  const productPurchaseCount = productLineItems.length
  const supportBundled = supportItem !== null && productPurchaseCount > 0
  const supportCreditRate = supportItem
    ? getSupportCreditRate(productPurchaseCount)
    : 0

  const supportLineItem: LineItem | null = supportItem
    ? (() => {
        const listAmount = getCatalogListAmount(supportItem, employees)
        const credit = listAmount * supportCreditRate
        return {
          item: supportItem,
          listAmount,
          billedAmount: listAmount - credit,
        }
      })()
    : null

  const lineItems = [
    ...productLineItems,
    ...(supportLineItem ? [supportLineItem] : []),
  ]

  // Volume discount only when support is not on the order.
  // Support never annualizes and never participates in volume %.
  const discountRate = supportItem
    ? 0
    : getVolumeDiscount(productPurchaseCount)

  const productSubtotal = productLineItems.reduce(
    (sum, li) => sum + li.listAmount,
    0,
  )
  const discountAmount = productSubtotal * discountRate
  const productTotal = productSubtotal - discountAmount

  const supportListQuarterly = supportLineItem?.listAmount ?? 0
  const supportCreditAmount = supportLineItem
    ? supportLineItem.listAmount - supportLineItem.billedAmount
    : 0
  const supportTotalQuarterly = supportLineItem?.billedAmount ?? 0

  return {
    lineItems,
    productLineItems,
    supportLineItem,
    purchaseCount: lineItems.length,
    productPurchaseCount,
    companyMultiplier: multiplier,
    companySizeLabel: getCompanySizeLabel(employees),
    companyBandId: band.id,
    companyCustom: Boolean(band.custom),
    dppEligible,
    dppBandId: dppBand?.id ?? null,
    dppMultiplier: dppBand?.multiplier ?? null,
    supportBundled,
    discountRate,
    discountAmount,
    supportCreditRate,
    supportCreditAmount,
    productSubtotal,
    productTotal,
    supportListQuarterly,
    supportTotalQuarterly,
  }
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
