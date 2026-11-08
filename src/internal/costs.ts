import {
  PLATFORM_USAGE_METRICS,
  USAGE_MONTHS_PER_YEAR,
  buildPlatformUsageLines,
  type PlatformUsageAmounts,
  type PlatformUsageLine,
  type PlatformUsageMetric,
} from '../pricing'

/**
 * Mastra's delivery cost per usage unit, keyed by metric id. Internal only:
 * used for platform margin, never shipped to the agency edition.
 */
export const PLATFORM_DELIVERY_UNIT_COSTS: Record<string, number> = {
  'observability-events': 0.0000023,
  'data-egress': 0.05,
  'cpu-time': 0.027792,
  'rows-written': 0.000001,
  'compute-hours': 0.22,
  'data-storage': 0.35,
}

function deliveryUnitCost(metric: PlatformUsageMetric): number {
  return PLATFORM_DELIVERY_UNIT_COSTS[metric.id] ?? 0
}

export function costOfUsageAmounts(amounts: PlatformUsageAmounts): number {
  return PLATFORM_USAGE_METRICS.reduce((sum, metric) => {
    const qty = Math.max(0, amounts[metric.id] ?? 0)
    return sum + qty * deliveryUnitCost(metric)
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
    const unitCost = deliveryUnitCost(metric)
    return {
      metric,
      amount,
      deliveryUnitCost: unitCost,
      cost: amount * unitCost,
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
