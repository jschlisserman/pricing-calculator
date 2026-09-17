import { formatPercent, formatUsd } from './pricing'

export interface OrderLineSnapshot {
  name: string
  meta?: string
  listAmount: number | null
  billedAmount: number | null
  period: '/ yr' | '/ qtr' | '/ one-time' | ''
  noBaseFee?: boolean
}

export interface OrderSnapshot {
  employees: number
  companyBandLabel: string
  productLines: OrderLineSnapshot[]
  productDiscountRate: number
  productDiscountAmount: number
  productTotal: number
  conciergeLines: OrderLineSnapshot[]
  conciergeDiscountRate: number
  conciergeDiscountAmount: number
  conciergeQuarterlyTotal: number | null
  conciergeOneTimeTotal: number | null
}

export interface OrderContactDetails {
  accountOwner: string
  accountEmail: string
  leadCompanyName: string
  pointOfContactName: string
  pointOfContactEmail: string
  notes?: string
}

export interface SubmitOrderRequest extends OrderContactDetails {
  order: OrderSnapshot
}

/** Team copy of every order (BCC). Primary To is the submitted Account email. */
export const ORDER_EMAIL_BCC = [
  'josh@mastra.ai',
  'aron@mastra.ai',
  'jake@mastra.ai',
] as const


function lineText(line: OrderLineSnapshot): string {
  if (line.noBaseFee) {
    return `${line.name}${line.meta ? ` (${line.meta})` : ''}: No base subscription`
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
    `Account email: ${contact.accountEmail}`,
    `Lead company: ${contact.leadCompanyName}`,
    `Point of contact: ${displayOrNone(contact.pointOfContactName)}`,
    `Point of contact email: ${displayOrNone(contact.pointOfContactEmail)}`,
    notes ? `Notes: ${notes}` : 'Notes: (none)',
    '',
    'Order details',
    `Company size: ${order.employees} employees · ${order.companyBandLabel}`,
    '',
  ]

  if (order.productLines.length > 0) {
    sections.push('Products')
    for (const line of order.productLines) sections.push(`- ${lineText(line)}`)
    if (order.productDiscountRate > 0 && order.productDiscountAmount > 0) {
      sections.push(
        `- Volume discount (${formatPercent(order.productDiscountRate)}): −${formatUsd(order.productDiscountAmount)}`,
      )
    }
    sections.push(`Product total / year: ${formatUsd(order.productTotal)}`)
    sections.push('')
  }

  if (order.conciergeLines.length > 0) {
    sections.push('Concierge')
    for (const line of order.conciergeLines) sections.push(`- ${lineText(line)}`)
    if (
      order.conciergeDiscountRate > 0 &&
      order.conciergeDiscountAmount > 0
    ) {
      sections.push(
        `- Concierge discount (${formatPercent(order.conciergeDiscountRate)}): −${formatUsd(order.conciergeDiscountAmount)}`,
      )
    }
    if (order.conciergeQuarterlyTotal != null) {
      sections.push(
        `Concierge / quarter: ${formatUsd(order.conciergeQuarterlyTotal)}`,
      )
    }
    if (order.conciergeOneTimeTotal != null) {
      sections.push(
        `Concierge one-time: ${formatUsd(order.conciergeOneTimeTotal)}`,
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
        const price = line.noBaseFee
          ? 'No base subscription'
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
         ${
           order.productDiscountRate > 0 && order.productDiscountAmount > 0
             ? `<p style="color:#0a7a3e">Volume discount (${formatPercent(order.productDiscountRate)}): −${formatUsd(order.productDiscountAmount)}</p>`
             : ''
         }
         <p style="font-size:18px;font-weight:700">Product total / year: ${formatUsd(order.productTotal)}</p>`
      : ''

  const conciergeBlock =
    order.conciergeLines.length > 0
      ? `<h3 style="margin:24px 0 8px">Concierge</h3>
         <table style="width:100%;border-collapse:collapse">${renderLines(order.conciergeLines)}</table>
         ${
           order.conciergeDiscountRate > 0 &&
           order.conciergeDiscountAmount > 0
             ? `<p style="color:#0a7a3e">Concierge discount (${formatPercent(order.conciergeDiscountRate)}): −${formatUsd(order.conciergeDiscountAmount)}</p>`
             : ''
         }
         ${
           order.conciergeQuarterlyTotal != null
             ? `<p style="font-size:18px;font-weight:700">Concierge / quarter: ${formatUsd(order.conciergeQuarterlyTotal)}</p>`
             : ''
         }
         ${
           order.conciergeOneTimeTotal != null
             ? `<p style="font-size:18px;font-weight:700">Concierge one-time: ${formatUsd(order.conciergeOneTimeTotal)}</p>`
             : ''
         }`
      : ''

  return `<!doctype html>
<html>
  <body style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;line-height:1.45;max-width:640px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px;margin:0 0 16px">New pricing calculator order</h1>
    <h2 style="font-size:16px;margin:0 0 8px">Account details</h2>
    <p><strong>Account owner:</strong> ${contact.accountOwner.trim() ? esc(contact.accountOwner.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Account email:</strong> ${esc(contact.accountEmail)}</p>
    <p><strong>Lead company:</strong> ${esc(contact.leadCompanyName)}</p>
    <p><strong>Point of contact:</strong> ${contact.pointOfContactName.trim() ? esc(contact.pointOfContactName.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Point of contact email:</strong> ${contact.pointOfContactEmail.trim() ? esc(contact.pointOfContactEmail.trim()) : '<span style="color:#888">(none)</span>'}</p>
    <p><strong>Notes:</strong> ${notes ? esc(notes) : '<span style="color:#888">(none)</span>'}</p>
    <h2 style="font-size:16px;margin:24px 0 8px">Order details</h2>
    <p><strong>Company size:</strong> ${order.employees} employees · ${esc(order.companyBandLabel)}</p>
    ${productBlock}
    ${conciergeBlock}
  </body>
</html>`
}
