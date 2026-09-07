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
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'deploy-byoc',
    name: 'BYOC',
    category: 'Deployment',
    basePrice: 8_000,
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
    basePrice: 6_000,
    billingPeriod: 'year',
    kind: 'bundle',
  },
  {
    id: 'agent-learning',
    name: 'Agent Learning',
    category: 'Agent Learning',
    description: 'Sold as a bundle of features',
    features: ['Trace Intelligence', 'Custom Signals', 'Agent Learning'],
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'bundle',
  },
  {
    id: 'collab-agent-builder',
    name: 'Agent Builder',
    category: 'Collaboration',
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'individual',
  },
  {
    id: 'collab-software-factory',
    name: 'Software Factory',
    category: 'Collaboration',
    description: 'TBD features on Software Factory',
    basePrice: 8_000,
    billingPeriod: 'year',
    kind: 'individual',
    future: true,
  },
  {
    id: 'collab-company-brain',
    name: 'Company Brain',
    category: 'Collaboration',
    basePrice: 8_000,
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
    description: 'Uses DPP headcount bands (Startup baseline $8k)',
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
    deployment: '$4,000',
    security: '$3,000',
    agentLearning: '$4,000',
    collaboration: '$4,000',
    allFour: '$15,000',
  },
  {
    id: 'growth',
    name: 'Growth',
    headcount: '25–99',
    minEmployees: 25,
    maxEmployees: 99,
    multiplier: 1,
    deployment: '$8,000',
    security: '$6,000',
    agentLearning: '$8,000',
    collaboration: '$8,000',
    allFour: '$30,000',
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    headcount: '100–499',
    minEmployees: 100,
    maxEmployees: 499,
    multiplier: 1.5,
    deployment: '$12,000',
    security: '$9,000',
    agentLearning: '$12,000',
    collaboration: '$12,000',
    allFour: '$45,000',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headcount: '500–1,999',
    minEmployees: 500,
    maxEmployees: 1_999,
    multiplier: 2,
    deployment: '$16,000',
    security: '$12,000',
    agentLearning: '$16,000',
    collaboration: '$16,000',
    allFour: '$60,000',
  },
  {
    id: 'enterprise-plus',
    name: 'Enterprise+',
    headcount: '2,000–4,999',
    minEmployees: 2_000,
    maxEmployees: 4_999,
    multiplier: 3,
    deployment: '$24,000',
    security: '$18,000',
    agentLearning: '$24,000',
    collaboration: '$24,000',
    allFour: '$90,000',
  },
  {
    id: 'global',
    name: 'Global',
    headcount: '5,000–9,999',
    minEmployees: 5_000,
    maxEmployees: 9_999,
    multiplier: 4,
    deployment: '$32,000',
    security: '$24,000',
    agentLearning: '$32,000',
    collaboration: '$32,000',
    allFour: '$120,000',
  },
  {
    id: 'global-plus',
    name: 'Global+',
    headcount: '10,000+',
    minEmployees: 10_000,
    maxEmployees: null,
    multiplier: 5,
    custom: true,
    deployment: '$40,000+',
    security: '$30,000+',
    agentLearning: '$40,000+',
    collaboration: '$40,000+',
    allFour: '$150,000+',
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

/** Design Partner Program — Startup ($8k) is the 1.0x baseline. */
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
    multiplier: 1.5,
    annualFee: 12_000,
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    headcount: '100–499',
    minEmployees: 100,
    maxEmployees: 499,
    multiplier: 2,
    annualFee: 16_000,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headcount: '500–1,999',
    minEmployees: 500,
    maxEmployees: 1_999,
    multiplier: 3,
    annualFee: 24_000,
  },
  {
    id: 'enterprise-plus',
    name: 'Enterprise+',
    headcount: '2,000–4,999',
    minEmployees: 2_000,
    maxEmployees: 4_999,
    multiplier: 5,
    annualFee: 40_000,
  },
  {
    id: 'global',
    name: 'Global',
    headcount: '5,000–9,999',
    minEmployees: 5_000,
    maxEmployees: 9_999,
    multiplier: 8,
    annualFee: 64_000,
  },
  {
    id: 'global-plus',
    name: 'Global+',
    headcount: '10,000+',
    minEmployees: 10_000,
    maxEmployees: null,
    multiplier: 12.5,
    annualFee: 100_000,
  },
]

export function getDppHeadcountBand(employees: number): DppHeadcountBand {
  const normalized = Math.max(0, employees)
  if (normalized < 1) return DPP_HEADCOUNT_BANDS[0]

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
    return getDppHeadcountBand(employees).annualFee
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
  const value = Number.isInteger(multiplier)
    ? `${multiplier}.0`
    : String(multiplier)
  return custom ? `Custom, ${value}x floor` : `${value}x`
}

/** Growth-band category list prices used to derive band tables. */
export const PRODUCT_CATEGORY_BASES = {
  deployment: 8_000,
  security: 6_000,
  agentLearning: 8_000,
  collaboration: 8_000,
} as const

/** Agency client pass-through: 50% off product bands; $7.5k minimum on total. */
export const AGENCY_PASS_THROUGH_RATE = 0.5
export const AGENCY_PASS_THROUGH_MINIMUM = 7_500

export function agencyPassThroughFee(
  growthBase: number,
  multiplier: number,
): number {
  return growthBase * multiplier * AGENCY_PASS_THROUGH_RATE
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
  dppBandId: string
  dppMultiplier: number
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
  const selected = CATALOG.filter((item) => selectedIds.includes(item.id))
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
    dppBandId: dppBand.id,
    dppMultiplier: dppBand.multiplier,
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
