import type { Program } from '../pricing'

/** Annual programs (internal edition only; agencies cannot buy these). */
export const PROGRAMS: Program[] = [
  {
    id: 'agency-program',
    name: 'Mastra Agency Program',
    description: 'Annual program for agency partners building on Mastra.',
    annualFee: 10_000,
  },
  {
    id: 'design-partner-program',
    name: 'Design Partner Program',
    description: 'Annual design partner program with the Mastra team.',
    annualFee: 12_000,
  },
]
