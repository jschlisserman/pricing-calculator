import type { Config } from '@netlify/functions'
import {
  type AccessRequest,
  type AllowType,
  allow,
  domainOf,
  getRequest,
  isPublicEmailDomain,
  listAllowed,
  listRequests,
  normalizeEmail,
  resolveRole,
  revoke,
  saveRequest,
} from '../../server/access'
import { sendAccessApprovedEmail } from '../../server/accessEmails'
import { accessConfigFromEnv, readSession } from '../../server/auth'

/** Access requests + agency allowlist management. Internal (@mastra.ai) users only. */

const env = (key: string) => process.env[key]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/

type AccessAction =
  | { action: 'approve'; email: string; scope: AllowType }
  | { action: 'deny'; email: string }
  | { action: 'revoke'; type: AllowType; value: string }
  | { action: 'add'; type: AllowType; value: string; company?: string }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function appUrl(req: Request): string {
  return env('APP_BASE_URL')?.replace(/\/$/, '') || new URL(req.url).origin
}

/** Returns an error message if this domain can't be approved wholesale. */
function domainError(domain: string): string | null {
  if (!DOMAIN_RE.test(domain)) return `"${domain}" is not a valid domain.`
  if (isPublicEmailDomain(domain)) {
    return `${domain} is a public email provider. Approve individual people instead.`
  }
  if (accessConfigFromEnv(env).internalDomains.includes(domain)) {
    return `${domain} already has internal access.`
  }
  return null
}

async function markDecided(
  request: AccessRequest,
  status: 'approved' | 'denied',
  by: string,
): Promise<void> {
  await saveRequest({
    ...request,
    status,
    decidedBy: by,
    decidedAt: new Date().toISOString(),
  })
}

async function approve(
  req: Request,
  email: string,
  scope: AllowType,
  by: string,
): Promise<Response> {
  const request = await getRequest(email)
  if (!request) return json({ error: 'Request not found.' }, 404)

  const value = scope === 'domain' ? domainOf(request.email) : request.email
  if (scope === 'domain') {
    const error = domainError(value)
    if (error) return json({ error }, 400)
  }

  await allow({
    type: scope,
    value,
    company: request.company,
    approvedBy: by,
    approvedAt: new Date().toISOString(),
  })

  // Approving a domain also clears any other pending requests from it.
  const approved =
    scope === 'domain'
      ? (await listRequests()).filter(
          (r) => r.status === 'pending' && domainOf(r.email) === value,
        )
      : [request]
  for (const r of approved) {
    await markDecided(r, 'approved', by)
    await sendAccessApprovedEmail(env, r.email, appUrl(req))
  }
  return json({ ok: true })
}

async function add(
  req: Request,
  type: AllowType,
  rawValue: string,
  company: string,
  by: string,
): Promise<Response> {
  const value = normalizeEmail(rawValue).replace(/^@/, '')
  if (type === 'email') {
    if (!EMAIL_RE.test(value)) return json({ error: `"${value}" is not a valid email.` }, 400)
    if (accessConfigFromEnv(env).internalDomains.includes(domainOf(value))) {
      return json({ error: `${value} already has internal access.` }, 400)
    }
  } else {
    const error = domainError(value)
    if (error) return json({ error }, 400)
  }

  await allow({
    type,
    value,
    company: company.trim().slice(0, 200),
    approvedBy: by,
    approvedAt: new Date().toISOString(),
  })

  if (type === 'email') {
    const request = await getRequest(value)
    if (request?.status === 'pending') await markDecided(request, 'approved', by)
    await sendAccessApprovedEmail(env, value, appUrl(req))
  }
  return json({ ok: true })
}

export default async function handler(req: Request): Promise<Response> {
  const session = await readSession(req.headers.get('cookie'), env('SESSION_SECRET'))
  if (!session) return json({ error: 'Unauthorized' }, 401)
  if ((await resolveRole(session.email, env)) !== 'internal') {
    return json({ error: 'Forbidden' }, 403)
  }

  try {
    if (req.method === 'GET') {
      const [requests, allowed] = await Promise.all([listRequests(), listAllowed()])
      const newestFirst = (a: AccessRequest, b: AccessRequest) =>
        b.requestedAt.localeCompare(a.requestedAt)
      return json({
        pending: requests.filter((r) => r.status === 'pending').sort(newestFirst),
        decided: requests.filter((r) => r.status !== 'pending').sort(newestFirst),
        allowed: allowed.sort((a, b) => b.approvedAt.localeCompare(a.approvedAt)),
      })
    }

    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const body = (await req.json().catch(() => ({}))) as Partial<AccessAction>
    const by = session.email
    switch (body.action) {
      case 'approve':
        if (!body.email || (body.scope !== 'email' && body.scope !== 'domain')) break
        return approve(req, body.email, body.scope, by)
      case 'deny': {
        if (!body.email) break
        const request = await getRequest(body.email)
        if (!request) return json({ error: 'Request not found.' }, 404)
        await markDecided(request, 'denied', by)
        return json({ ok: true })
      }
      case 'revoke':
        if (!body.value || (body.type !== 'email' && body.type !== 'domain')) break
        await revoke(body.type, body.value)
        return json({ ok: true })
      case 'add':
        if (!body.value || (body.type !== 'email' && body.type !== 'domain')) break
        return add(req, body.type, body.value, body.company ?? '', by)
    }
    return json({ error: 'Invalid request.' }, 400)
  } catch (error) {
    console.error('[access] request failed', error)
    return json({ error: 'Something went wrong.' }, 500)
  }
}

export const config: Config = {
  path: '/api/access',
}
