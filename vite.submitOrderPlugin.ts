import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { sendOrderEmail } from './server/sendOrderEmail'
import type { SubmitOrderRequest } from './src/orderSnapshot'

async function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

export function submitOrderApiPlugin(): Plugin {
  return {
    name: 'submit-order-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/submit-order') {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const env = loadEnv(server.config.mode, server.config.root, '')
          const body = (await readJsonBody(req)) as SubmitOrderRequest
          if (!body.order) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Order is required.' }))
            return
          }

          const result = await sendOrderEmail({
            order: body.order,
            accountOwner: body.accountOwner,
            accountEmail: body.accountEmail,
            leadCompanyName: body.leadCompanyName,
            pointOfContactName: body.pointOfContactName,
            pointOfContactEmail: body.pointOfContactEmail,
            notes: body.notes,
            apiKey: env.RESEND_API_KEY || process.env.RESEND_API_KEY || '',
            from: env.RESEND_FROM || process.env.RESEND_FROM,
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, id: result.id }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to submit order.',
            }),
          )
        }
      })
    },
  }
}
