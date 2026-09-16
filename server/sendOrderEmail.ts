import { Resend } from 'resend'
import {
  ORDER_EMAIL_RECIPIENTS,
  formatOrderEmailHtml,
  formatOrderEmailText,
  type OrderContactDetails,
  type OrderSnapshot,
} from '../src/orderSnapshot'

export interface SendOrderEmailInput extends OrderContactDetails {
  order: OrderSnapshot
  apiKey: string
  from?: string
}

function optionalField(value: string | undefined): string {
  return value?.trim() ?? ''
}

function requireField(label: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    throw new Error(`${label} is required.`)
  }
  return trimmed
}

export async function sendOrderEmail({
  order,
  accountOwner,
  leadCompanyName,
  pointOfContactName,
  pointOfContactEmail,
  notes = '',
  apiKey,
  from = process.env.RESEND_FROM || 'Mastra Pricing <onboarding@resend.dev>',
}: SendOrderEmailInput): Promise<{ id: string }> {
  const contact: OrderContactDetails = {
    accountOwner: requireField('Account owner', accountOwner),
    leadCompanyName: requireField('Lead company name', leadCompanyName),
    pointOfContactName: optionalField(pointOfContactName),
    pointOfContactEmail: optionalField(pointOfContactEmail),
    notes,
  }

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.')
  }

  const resend = new Resend(apiKey)
  const subject = `Pricing order · ${contact.leadCompanyName} · ${contact.accountOwner}`
  const { data, error } = await resend.emails.send({
    from,
    to: [...ORDER_EMAIL_RECIPIENTS],
    subject,
    text: formatOrderEmailText(order, contact),
    html: formatOrderEmailHtml(order, contact),
  })

  if (error) {
    throw new Error(error.message || 'Failed to send order email.')
  }

  return { id: data?.id ?? '' }
}
