// Fails the build if the agency app can load internal-only code or data.
// Walks every file reachable from dist/agency/index.html.
import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'

const DIST = 'dist'
// Backstop for data leaking into shared code (e.g. added to src/pricing.ts).
const INTERNAL_MARKERS = [
  'Design Partner Program',
  'Billable engineering hours',
  'Mastra Audit',
  'target margin',
  'deliveryUnitCost',
]

const html = readFileSync(join(DIST, 'agency/index.html'), 'utf8')
const queue = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
  (m) => m[1],
)
const seen = new Set()
const problems = []

while (queue.length > 0) {
  const path = queue.pop()
  if (seen.has(path)) continue
  seen.add(path)
  if (path.startsWith('/assets/internal/')) {
    problems.push(`${path} is internal-only`)
    continue
  }
  const source = readFileSync(join(DIST, path), 'utf8')
  for (const marker of INTERNAL_MARKERS) {
    if (source.includes(marker)) problems.push(`${path} contains "${marker}"`)
  }
  if (path.endsWith('.js')) {
    for (const m of source.matchAll(/(?:from|import\()\s*"(\.{1,2}\/[^"]+)"/g)) {
      queue.push(posix.join(posix.dirname(path), m[1]))
    }
  }
}

if (problems.length > 0) {
  console.error('Agency bundle check failed:\n  ' + problems.join('\n  '))
  process.exit(1)
}
console.log(`Agency bundle check passed (${seen.size} files, no internal data).`)
