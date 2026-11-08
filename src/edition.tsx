import { createContext, useContext, type ComponentType } from 'react'
import type { OrderSnapshot } from './orderSnapshot'
import type {
  HeadcountBand,
  PlatformUsageAmounts,
  Program,
} from './pricing'
// Type-only imports are erased at build time, so the agency bundle never
// contains anything from src/internal.
import type {
  MastraForwardQuote,
  Path1BillingPeriod,
  Path2Hours,
  Path2Margins,
  SupportQuote,
} from './internal/concierge'
import type { PlatformMargin } from './internal/costs'
import type { ForwardSectionProps } from './internal/ForwardSection'
import type { ForwardSummaryProps } from './internal/ForwardSummary'
import type { SupportSectionProps } from './internal/SupportSection'
import type { SupportSummaryProps } from './internal/SupportSummary'

/**
 * Internal-only pricing (costs, margins, support services, programs).
 * The internal app (src/main.tsx) provides it; the agency app
 * (src/agency.tsx) provides null and is built without it.
 */
export interface InternalEdition {
  programs: Program[]
  /** Evals (Path 2) flat base price, shown on the pricing matrix. */
  evalsBasePrice: number
  buildSupportQuote: (
    selectedIds: string[],
    path2Hours: Path2Hours,
    path2Margins: Path2Margins,
    path1BillingPeriod: Path1BillingPeriod,
    evalsMultiplier: number,
  ) => SupportQuote
  /** Next selection after toggling a support item (Path 1 is single-select). */
  toggleSupportId: (selectedIds: string[], id: string) => string[]
  supportOrderSnapshot: (
    support: SupportQuote,
    headcountBand: HeadcountBand | null,
  ) => Pick<
    OrderSnapshot,
    | 'supportLines'
    | 'supportPath1Total'
    | 'supportPath1Period'
    | 'supportOneTimeTotal'
  >
  /** Mastra Forward quote, or null when not selected. */
  buildMastraForwardQuote: (
    selected: boolean,
    sellRatePerHour: number | null,
    hoursPerWeek: number | null,
  ) => MastraForwardQuote | null
  forwardOrderSnapshot: (
    quote: MastraForwardQuote | null,
  ) => Pick<OrderSnapshot, 'forwardLines' | 'forwardAnnualTotal'>
  buildPlatformMargin: (
    productAnnualTotal: number,
    includes: PlatformUsageAmounts,
    additional: PlatformUsageAmounts,
  ) => PlatformMargin
  ForwardSection: ComponentType<ForwardSectionProps>
  ForwardSummary: ComponentType<ForwardSummaryProps>
  SupportSection: ComponentType<SupportSectionProps>
  SupportSummary: ComponentType<SupportSummaryProps>
}

const EditionContext = createContext<InternalEdition | null>(null)

export const EditionProvider = EditionContext.Provider

/** Internal-only pricing, or null in the agency app. */
export function useInternalEdition(): InternalEdition | null {
  return useContext(EditionContext)
}
