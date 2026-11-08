import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { sendOrderEmail } from './server/sendOrderEmail'
import type { OrderSubmitter, SubmitOrderRequest } from './src/orderSnapshot'

/**
 * Plain `vite` dev has no WorkOS login. Act as a fixed local user instead;
 * set AUTH_DEV_ROLE=agency in .env to preview the agency experience.
 * Use `npm run dev:auth` (netlify dev) to exercise the real sign-in flow.
 */
function devSubmitter(env: Record<string, string>): OrderSubmitter {
  return {
    email: 'dev@localhost',
    role: env.AUTH_DEV_ROLE === 'agency' ? 'agency' : 'internal',
  }
}

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
        const pathname = req.url?.split('?')[0]
        if (pathname === '/auth/me') {
          const env = loadEnv(server.config.mode, server.config.root, '')
          const { email, role } = devSubmitter(env)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ email, name: 'Local dev', role }))
          return
        }

        if (pathname === '/auth/logout') {
          res.statusCode = 302
          res.setHeader('Location', '/')
          res.end()
          return
        }

        if (pathname !== '/api/submit-order') {
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
          // Agency orders are never emailed.
          if (devSubmitter(env).role !== 'internal') {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
          }
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
            leadCompanyName: body.leadCompanyName,
            pointOfContactName: body.pointOfContactName,
            pointOfContactEmail: body.pointOfContactEmail,
            notes: body.notes,
            submitter: devSubmitter(env),
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
