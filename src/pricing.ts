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

/** SMB list prices. Company-size multipliers apply on top. */
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
    basePrice: 12_000,
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

/** Credit on support when sold with exactly one other purchase. */
export const SUPPORT_BUNDLE_CREDIT_ONE = 0.2
/** Discount on support when sold with 2+ other purchases. */
export const SUPPORT_BUNDLE_CREDIT_MULTI = 0.25

export function getCompanySizeMultiplier(employees: number): number {
  if (employees > 500) return 2
  if (employees >= 100) return 1.5
  return 1
}

export function getCompanySizeLabel(employees: number): string {
  if (employees > 500) return 'Enterprise (500+)'
  if (employees >= 100) return 'Mid-market (100–500)'
  return 'SMB (< 100)'
}

/** Multi-purchase discount from count of distinct non-support purchases. */
export function getVolumeDiscount(purchaseCount: number): number {
  if (purchaseCount >= 4) return 0.3
  if (purchaseCount === 3) return 0.25
  if (purchaseCount === 2) return 0.2
  return 0
}

/**
 * Support credit/discount when bundled with other purchases.
 * 1 other purchase → 20%; 2+ → 25%; otherwise 0.
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
  const multiplier = getCompanySizeMultiplier(employees)

  const productItems = selected.filter((item) => item.kind !== 'support')
  const supportItem = selected.find((item) => item.kind === 'support') ?? null

  const productLineItems: LineItem[] = productItems.map((item) => {
    const listAmount = item.basePrice * multiplier
    return { item, listAmount, billedAmount: listAmount }
  })

  const productPurchaseCount = productLineItems.length
  const supportBundled = supportItem !== null && productPurchaseCount > 0
  const supportCreditRate = supportItem
    ? getSupportCreditRate(productPurchaseCount)
    : 0

  const supportLineItem: LineItem | null = supportItem
    ? (() => {
        const listAmount = supportItem.basePrice * multiplier
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
