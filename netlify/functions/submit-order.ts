import type { Handler } from '@netlify/functions'
import {
  accessConfigFromEnv,
  readSession,
  roleForEmail,
} from '../../server/auth'
import { sendOrderEmail } from '../../server/sendOrderEmail'
import type { SubmitOrderRequest } from '../../src/orderSnapshot'

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // The edge gate already blocks anonymous requests; check again here so the
  // function is never callable without a valid session.
  const session = await readSession(
    event.headers.cookie,
    process.env.SESSION_SECRET,
  )
  if (!session) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }
  // Only internal users can submit; agency orders are never emailed.
  // Internal access comes from env alone, so no Blobs lookup is needed.
  const role = roleForEmail(
    session.email,
    accessConfigFromEnv((key) => process.env[key]),
  )
  if (role !== 'internal') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}') as SubmitOrderRequest
    if (!body.order) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order is required.' }),
      }
    }

    const result = await sendOrderEmail({
      order: body.order,
      accountOwner: body.accountOwner,
      leadCompanyName: body.leadCompanyName,
      pointOfContactName: body.pointOfContactName,
      pointOfContactEmail: body.pointOfContactEmail,
      notes: body.notes,
      submitter: { email: session.email, role },
      apiKey: process.env.RESEND_API_KEY || '',
      from: process.env.RESEND_FROM,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, id: result.id }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to submit order.',
      }),
    }
  }
}

export { handler }
