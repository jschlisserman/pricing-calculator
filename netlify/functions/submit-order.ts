import type { Handler } from '@netlify/functions'
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
      accountEmail: body.accountEmail,
      leadCompanyName: body.leadCompanyName,
      pointOfContactName: body.pointOfContactName,
      pointOfContactEmail: body.pointOfContactEmail,
      notes: body.notes,
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
