import { formatUsd } from './pricing'

export interface OrderLineSnapshot {
  name: string
  meta?: string
  listAmount: number | null
  billedAmount: number | null
  period: '/ yr' | '/ qtr' | '/ one-time' | ''
  noBaseFee?: boolean
  included?: boolean
}

export interface OrderSnapshot {
  planLabel: string
  seatsLabel: string
  programLabel: string | null
  productLines: OrderLineSnapshot[]
  productTotal: number
  supportLines: OrderLineSnapshot[]
  supportPath1Total: number | null
  supportPath1Period: '/ qtr' | '/ yr' | null
  supportOneTimeTotal: number | null
}

export interface OrderContactDetails {
  accountOwner: string
  leadCompanyName: string
  pointOfContactName: string
  pointOfContactEmail: string
  notes?: string
}

export interface SubmitOrderRequest extends OrderContactDetails {
  order: OrderSnapshot
}

export const ORDER_EMAIL_RECIPIENTS = [
  'josh@mastra.ai',
  'jake@mastra.ai',
] as const

function lineText(line: OrderLineSnapshot): string {
  if (line.included) {
    return `${line.name}${line.meta ? ` (${line.meta})` : ''}: Included`
  }
  if (line.noBaseFee) {
    return `${line.name}${line.meta ? ` (${line.meta})` : ''}: $0`
  }
  const billed =
    line.billedAmount != null ? formatUsd(line.billedAmount) : '—'
  const list =
    line.listAmount != null &&
    line.billedAmount != null &&
    line.listAmount > line.billedAmount
      ? ` (list ${formatUsd(line.listAmount)})`
      : ''
  return `${line.name}${line.meta ? ` — ${line.meta}` : ''}: ${billed}${line.period}${list}`
}

function displayOrNone(value: string): string {
  return value.trim() ? value.trim() : '(none)'
}

export function formatOrderEmailText(
  order: OrderSnapshot,
  contact: OrderContactDetails,
): string {
  const notes = contact.notes?.trim() ?? ''
  const sections: string[] = [
    'New pricing calculator order',
    '',
    'Account details',
    `Account owner: ${displayOrNone(contact.accountOwner)}`,
    `Lead company: ${contact.leadCompanyName}`,
    `Point of contact: ${displayOrNone(contact.pointOfContactName)}`,
    `Point of contact email: ${displayOrNone(contact.pointOfContactEmail)}`,
    notes ? `Notes: ${notes}` : 'Notes: (none)',
    '',
    'Order details',
    `Plan: ${order.planLabel}`,
    `Seats: ${order.seatsLabel}`,
  ]

  if (order.programLabel) {
    sections.push(`Program: ${order.programLabel}`)
  }
  sections.push('')

  if (order.productLines.length > 0) {
    sections.push('Products')
    for (const line of order.productLines) sections.push(`- ${lineText(line)}`)
    sections.push(`Product total / year: ${formatUsd(order.productTotal)}`)
    sections.push('')
  }

  if (order.supportLines.length > 0) {
    sections.push('Support')
    for (const line of order.supportLines) sections.push(`- ${lineText(line)}`)
    if (order.supportPath1Total != null) {
      sections.push(
        `Support ${order.supportPath1Period === '/ yr' ? '/ year' : '/ quarter'}: ${formatUsd(order.supportPath1Total)}`,
      )
    }
    if (order.supportOneTimeTotal != null) {
      sections.push(
        `Support one-time: ${formatUsd(order.supportOneTimeTotal)}`,
      )
    }
    sections.push('')
  }

  return sections.join('\n')
}

export function formatOrderEmailHtml(
  order: OrderSnapshot,
  contact: OrderContactDetails,
): string {
  const esc = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')

  const notes = contact.notes?.trim() ?? ''

  const renderLines = (lines: OrderLineSnapshot[]) =>
    lines
      .map((line) => {
        const price = line.included
          ? 'Included'
          : line.noBaseFee
            ? '$0'
            : line.billedAmount != null
              ? `${formatUsd(line.billedAmount)}${line.period}`
              : '—'
        const list =
          !line.noBaseFee &&
          line.listAmount != null &&
          line.billedAmount != null &&
          line.listAmount > line.billedAmount
            ? ` <span style="color:#888;text-decoration:line-through">${formatUsd(line.listAmount)}</span>`
            : ''
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">
            <div style="font-weight:600">${esc(line.name)}</div>
            ${line.meta ? `<div style="color:#666;font-size:13px">${esc(line.meta)}</div>` : ''}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${list} ${price}</td>
        </tr>`
      })
      .join('')

  const productBlock =
    order.productLines.length > 0
      ? `<h3 style="margin:24px 0 8px">Products</h3>
         <table style="width:100%;border-collapse:collapse">${renderLines(order.productLines)}</table>
         <p style="font-size:18px;font-weight:700">Product total / year: ${formatUsd(order.productTotal)}</p>`
      : ''

  const supportBlock =
    order.supportLines.length > 0
      ? `<h3 style="margin:24px 0 8px">Support</h3>
         <table style="width:100%;border-collapse:collapse">${renderLines(order.supportLines)}</table>
         ${
           order.supportPath1Total != null
             ? `<p style="font-size:18px;font-weight:700">Support ${order.supportPath1Period === '/ yr' ? '/ year' : '/ quarter'}: ${formatUsd(order.supportPath1Total)}</p>`
             : ''
         }
         ${
           order.supportOneTimeTotal != null
             ? `<p style="font-size:18px;font-weight:700">Support one-time: ${formatUsd(order.supportOneTimeTotal)}</p>`
             : ''
         }`
      : ''

  return `<!doctype html>
<html>
  <body style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;line-height:1.45;max-width:640px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px;margin:0 0 16px">New pricing calculator order</h1>
    <h2 style="font-size:16px;margin:0 0 8px">Account details</h2>
    <p><strong>Account owner:</strong> ${contact.accountOwner.trim() ? esc(contact.accountOwner.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Lead company:</strong> ${esc(contact.leadCompanyName)}</p>
    <p><strong>Point of contact:</strong> ${contact.pointOfContactName.trim() ? esc(contact.pointOfContactName.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Point of contact email:</strong> ${contact.pointOfContactEmail.trim() ? esc(contact.pointOfContactEmail.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Notes:</strong> ${notes ? esc(notes) : '<span style="color:#888">(none)</span>'}</p>
    <h2 style="font-size:16px;margin:24px 0 8px">Order details</h2>
    <p><strong>Plan:</strong> ${esc(order.planLabel)}</p>
    <p><strong>Seats:</strong> ${esc(order.seatsLabel)}</p>
    ${order.programLabel ? `<p><strong>Program:</strong> ${esc(order.programLabel)}</p>` : ''}
    ${productBlock}
    ${supportBlock}
  </body>
</html>`
}
