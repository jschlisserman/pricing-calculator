import type { InternalEdition } from '../edition'
import type { OrderLineSnapshot } from '../orderSnapshot'
import { formatMultiplier, formatPercent, formatUsd } from '../pricing'
import {
  AUDIT_ID,
  DEFAULT_ENGINEER_COST_PER_HOUR,
  PATH2_EVALS_ID,
  PATH2_PACKAGES,
  buildMastraForwardQuote,
  buildSupportQuote,
  isForwardBillable,
  isPath1Id,
  isPath2Id,
  withoutOtherPath1Tiers,
} from './concierge'
import { buildPlatformMargin } from './costs'
import ForwardSection from './ForwardSection'
import ForwardSummary from './ForwardSummary'
import { PROGRAMS } from './programs'
import SupportSection from './SupportSection'
import SupportSummary from './SupportSummary'

/** Everything only the internal app may contain. See src/edition.tsx. */
export const internalEdition: InternalEdition = {
  programs: PROGRAMS,
  evalsBasePrice:
    PATH2_PACKAGES.find((p) => p.id === PATH2_EVALS_ID)?.flatPrice ?? 0,

  buildSupportQuote: (
    selectedIds,
    path2Hours,
    path2Margins,
    path1BillingPeriod,
    evalsMultiplier,
  ) =>
    buildSupportQuote(
      selectedIds,
      path2Hours,
      path2Margins,
      DEFAULT_ENGINEER_COST_PER_HOUR,
      path1BillingPeriod,
      evalsMultiplier,
    ),

  toggleSupportId(prev, id) {
    if (prev.includes(id)) return prev.filter((x) => x !== id)
    if (isPath1Id(id)) return withoutOtherPath1Tiers([...prev, id], id)
    if (isPath2Id(id)) {
      // Evals does not auto-include the Mastra Audit.
      if (id === PATH2_EVALS_ID) return [...prev, id]
      return prev.includes(AUDIT_ID) ? [...prev, id] : [...prev, id, AUDIT_ID]
    }
    return [...prev, id]
  },

  supportOrderSnapshot(support, headcountBand) {
    const supportLines: OrderLineSnapshot[] = []
    if (support.path1) {
      supportLines.push({
        name: `Support Path 1 · ${support.path1.tier.name}`,
        meta: `${support.path1.tier.hoursPerWeek} hrs/wk · ${
          support.path1.billingPeriod === 'year' ? 'Annual' : 'Quarterly'
        }`,
        listAmount: support.path1.listAmount,
        billedAmount: support.path1.billedAmount,
        period: support.path1.periodLabel,
      })
    }
    for (const line of support.path2) {
      supportLines.push({
        name: `Support Path 2 · ${line.package.name}`,
        meta:
          line.flatPrice != null
            ? line.flatMultiplier !== 1 && headcountBand
              ? `${formatUsd(line.flatPrice)} base · ${headcountBand.name} (${headcountBand.rangeLabel}) ${formatMultiplier(line.flatMultiplier)} · Flat one-time`
              : 'Flat one-time'
            : `${line.hours} hrs · ${formatPercent(line.targetMarginRate)} target`,
        listAmount: line.listAmount > 0 ? line.listAmount : null,
        billedAmount: line.listAmount > 0 ? line.billedAmount : null,
        period: '/ one-time',
      })
    }
    if (support.audit) {
      supportLines.push({
        name: 'Mastra Audit',
        listAmount: support.audit.listAmount,
        billedAmount: support.audit.billedAmount,
        period: '/ one-time',
      })
    }
    return {
      supportLines,
      supportPath1Total: support.path1 ? support.path1Total : null,
      supportPath1Period: support.path1 ? support.path1.periodLabel : null,
      supportOneTimeTotal:
        support.path2.length > 0 || support.audit ? support.oneTimeTotal : null,
    }
  },

  buildMastraForwardQuote: (selected, sellRatePerHour, hoursPerWeek) =>
    buildMastraForwardQuote(
      selected,
      { sellRatePerHour, hoursPerWeek },
      DEFAULT_ENGINEER_COST_PER_HOUR,
    ),

  forwardOrderSnapshot(quote) {
    if (!isForwardBillable(quote)) {
      return { forwardLines: [], forwardAnnualTotal: null }
    }
    const annual = Math.round(quote.annualRevenue)
    return {
      forwardLines: [
        {
          name: 'Mastra Forward',
          meta: `${formatUsd(quote.sellRatePerHour)}/hr · ${quote.hoursPerWeek} hrs/wk · cost ${formatUsd(quote.costPerHour)}/hr${
            quote.marginRate != null
              ? ` · ${formatPercent(quote.marginRate)} margin`
              : ''
          }`,
          listAmount: annual,
          billedAmount: annual,
          period: '/ yr',
        },
      ],
      forwardAnnualTotal: annual,
    }
  },

  buildPlatformMargin,
  ForwardSection,
  ForwardSummary,
  SupportSection,
  SupportSummary,
}
