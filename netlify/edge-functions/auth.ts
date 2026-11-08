import type { Config } from '@netlify/edge-functions'
import { decodeJwt } from 'jose'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  TX_COOKIE,
  TX_TTL_SECONDS,
  createSessionToken,
  getCookie,
  readSession,
  safeReturnTo,
  serializeCookie,
  signToken,
  verifyToken,
} from '../../server/auth.ts'
import {
  type AccessRequest,
  getRequest,
  normalizeEmail,
  resolveRole,
  saveRequest,
} from '../../server/access.ts'
import { sendAccessRequestEmail } from '../../server/accessEmails.ts'

const WORKOS_API = 'https://api.workos.com'

interface WorkOSUser {
  email: string
  email_verified: boolean
  first_name: string | null
  last_name: string | null
}

interface WorkOSAuthenticateResponse {
  user: WorkOSUser
  access_token: string
}

const env = (key: string) => Netlify.env.get(key)

/** Verified identity of a signed-in user who has no access yet (for the request form). */
const PENDING_COOKIE = 'mp_pending'
const PENDING_TTL_SECONDS = 60 * 60

interface PendingIdentity {
  email: string
  name: string
  workosSessionId: string | null
}

function baseUrl(request: Request): string {
  return env('APP_BASE_URL')?.replace(/\/$/, '') || new URL(request.url).origin
}

function isSecure(request: Request): boolean {
  return baseUrl(request).startsWith('https://')
}

function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// Always 200: `netlify dev` treats non-2xx edge responses as misses and retries
// the path as `.html` / `index.html` variants, which ends in a 404.
function layout(title: string, body: string, cookies: string[] = []): Response {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>${escapeHtml(title)} · Mastra Pricing</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
        background: #020202; color: #f0f0f0;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
      main { max-width: 360px; padding: 24px; }
      .brand { display: flex; align-items: center; gap: 10px; font-size: 20px;
        font-weight: 700; letter-spacing: -0.03em; margin-bottom: 24px; }
      .brand img { width: 32px; height: 32px; object-fit: contain; }
      h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
      p { color: #939393; line-height: 1.5; margin: 0 0 24px; }
      a.button, button { display: block; width: 100%; box-sizing: border-box;
        text-align: center; padding: 10px 16px; border: none;
        border-radius: 999px; background: #f0f0f0; color: #020202;
        text-decoration: none; font: inherit; font-weight: 500; cursor: pointer; }
      a.secondary { display: block; margin-top: 16px; text-align: center;
        color: #939393; font-size: 14px; }
      form { display: grid; gap: 14px; margin-bottom: 8px; }
      label { display: grid; gap: 6px; font-size: 13px; color: #939393; }
      label .hint { color: #5c5c5c; }
      input, textarea { box-sizing: border-box; width: 100%; padding: 10px 12px;
        border-radius: 10px; border: 1px solid #2b2b2b; background: #111;
        color: #f0f0f0; font: inherit; font-size: 14px; }
      input[readonly] { color: #939393; }
      textarea { min-height: 80px; resize: vertical; }
      .error { color: #ff4758; margin: 0 0 12px; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <div class="brand"><img src="/mastra-logo.png" alt="" />mastra</div>
      <h1>${escapeHtml(title)}</h1>
      ${body}
    </main>
  </body>
</html>`
  return new Response(html, { headers })
}

function page(
  title: string,
  message: string,
  action: { href: string; label: string },
  cookies: string[] = [],
  secondary?: { href: string; label: string },
): Response {
  return layout(
    title,
    `<p>${escapeHtml(message)}</p>
      <a class="button" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>
      ${secondary ? `<a class="secondary" href="${escapeHtml(secondary.href)}">${escapeHtml(secondary.label)}</a>` : ''}`,
    cookies,
  )
}

interface RequestFormValues {
  company: string
  mastraContact: string
  message: string
}

function requestFormPage(
  request: Request,
  identity: PendingIdentity,
  cookies: string[] = [],
  error?: string,
  values: RequestFormValues = { company: '', mastraContact: '', message: '' },
): Response {
  return layout(
    'Request access',
    `<p>${escapeHtml(identity.email)} doesn't have access to the Mastra pricing calculator yet. Tell us who you're with and the Mastra team will review your request.</p>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
      <form method="post" action="/auth/request-access">
        <label>Email
          <input type="email" value="${escapeHtml(identity.email)}" readonly />
        </label>
        <label>Company
          <input name="company" required maxlength="200" autocomplete="organization" value="${escapeHtml(values.company)}" />
        </label>
        <label><span>Your Mastra contact <span class="hint">Optional</span></span>
          <input name="mastraContact" maxlength="200" placeholder="Who you work with at Mastra" value="${escapeHtml(values.mastraContact)}" />
        </label>
        <label><span>Message <span class="hint">Optional</span></span>
          <textarea name="message" maxlength="2000">${escapeHtml(values.message)}</textarea>
        </label>
        <button type="submit">Request access</button>
      </form>
      <a class="secondary" href="${escapeHtml(workosLogoutUrl(request, identity.workosSessionId))}">Use a different account</a>`,
    cookies,
  )
}

function workosLogoutUrl(request: Request, sessionId: string | null): string {
  const signedOut = `${baseUrl(request)}/auth/signed-out`
  if (!sessionId) return signedOut
  const url = new URL(`${WORKOS_API}/user_management/sessions/logout`)
  url.searchParams.set('session_id', sessionId)
  url.searchParams.set('return_to', signedOut)
  return url.toString()
}

function sessionIdFromAccessToken(accessToken: string): string | null {
  try {
    const { sid } = decodeJwt(accessToken)
    return typeof sid === 'string' ? sid : null
  } catch {
    return null
  }
}

async function login(request: Request): Promise<Response> {
  console.info('[auth] login', { returnTo: new URL(request.url).searchParams.get('returnTo') })
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnTo'))
  const state = crypto.randomUUID()
  const tx = await signToken(
    { state, returnTo },
    env('SESSION_SECRET'),
    TX_TTL_SECONDS,
  )

  const authorize = new URL(`${WORKOS_API}/user_management/authorize`)
  authorize.searchParams.set('client_id', env('WORKOS_CLIENT_ID') ?? '')
  authorize.searchParams.set('redirect_uri', `${baseUrl(request)}/auth/callback`)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('provider', 'authkit')
  authorize.searchParams.set('state', state)

  return redirect(authorize.toString(), [
    serializeCookie(TX_COOKIE, tx, {
      maxAge: TX_TTL_SECONDS,
      secure: isSecure(request),
    }),
  ])
}

async function callback(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const secure = isSecure(request)
  const clearTx = serializeCookie(TX_COOKIE, '', { maxAge: 0, secure })
  const retry = { href: '/auth/login', label: 'Try again' }

  const tx = await verifyToken(
    getCookie(request.headers.get('cookie'), TX_COOKIE),
    env('SESSION_SECRET'),
  )
  const code = url.searchParams.get('code')
  if (!tx || !code || tx.state !== url.searchParams.get('state')) {
    console.warn('[auth] callback rejected', {
      hasTx: Boolean(tx),
      hasCode: Boolean(code),
      error: url.searchParams.get('error'),
    })
    return page(
      'Sign-in expired',
      'Your sign-in attempt expired or was interrupted. Please try again.',
      retry,
      [clearTx],
    )
  }

  const response = await fetch(`${WORKOS_API}/user_management/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env('WORKOS_CLIENT_ID'),
      client_secret: env('WORKOS_API_KEY'),
      grant_type: 'authorization_code',
      code,
    }),
  })
  if (!response.ok) {
    console.error('WorkOS authenticate failed', response.status, await response.text())
    return page('Sign-in failed', 'We could not complete sign-in.', retry, [clearTx])
  }

  const { user, access_token } = (await response.json()) as WorkOSAuthenticateResponse
  const workosSessionId = sessionIdFromAccessToken(access_token)
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const role = user.email_verified ? await resolveRole(user.email, env) : null

  if (!role) {
    console.info('[auth] access denied', { email: user.email, verified: user.email_verified })
    const switchAccount = {
      href: workosLogoutUrl(request, workosSessionId),
      label: 'Use a different account',
    }
    if (!user.email_verified) {
      return page(
        'Verify your email',
        `Verify ${user.email} with WorkOS before requesting access.`,
        switchAccount,
        [clearTx],
      )
    }

    const existing = await getRequest(user.email)
    if (existing?.status === 'pending') {
      return page(
        'Request pending',
        `Your request for ${user.email} is waiting for review. We'll email you when it's approved.`,
        switchAccount,
        [clearTx],
      )
    }
    // Denied requests stay denied. An approval that was later removed can
    // request again.
    if (existing?.status === 'denied') {
      return page(
        'No access',
        `${user.email} doesn't have access to the Mastra pricing calculator. If you think this is a mistake, contact your Mastra representative.`,
        switchAccount,
        [clearTx],
      )
    }

    const pending = await signToken(
      { email: user.email, name, workosSessionId } satisfies PendingIdentity,
      env('SESSION_SECRET'),
      PENDING_TTL_SECONDS,
    )
    return requestFormPage(
      request,
      { email: user.email, name, workosSessionId },
      [clearTx, serializeCookie(PENDING_COOKIE, pending, { maxAge: PENDING_TTL_SECONDS, secure })],
    )
  }

  console.info('[auth] signed in', { email: user.email, role })
  const session = await createSessionToken(
    { email: user.email, name, workosSessionId },
    env('SESSION_SECRET'),
  )

  return redirect(safeReturnTo(String(tx.returnTo ?? '/')), [
    clearTx,
    serializeCookie(SESSION_COOKIE, session, {
      maxAge: SESSION_TTL_SECONDS,
      secure,
    }),
  ])
}

async function requestAccess(request: Request): Promise<Response> {
  if (request.method !== 'POST') return redirect('/auth/login')

  const payload = await verifyToken(
    getCookie(request.headers.get('cookie'), PENDING_COOKIE),
    env('SESSION_SECRET'),
  )
  if (!payload || typeof payload.email !== 'string') {
    return page(
      'Sign-in expired',
      'Please sign in again to request access.',
      { href: '/auth/login', label: 'Sign in' },
    )
  }
  const identity: PendingIdentity = {
    email: normalizeEmail(payload.email),
    name: typeof payload.name === 'string' ? payload.name : '',
    workosSessionId:
      typeof payload.workosSessionId === 'string' ? payload.workosSessionId : null,
  }

  const form = await request.formData()
  const field = (key: string, max: number) =>
    String(form.get(key) ?? '').trim().slice(0, max)
  const values: RequestFormValues = {
    company: field('company', 200),
    mastraContact: field('mastraContact', 200),
    message: field('message', 2000),
  }
  if (!values.company) {
    return requestFormPage(request, identity, [], 'Company is required.', values)
  }

  const switchAccount = {
    href: workosLogoutUrl(request, identity.workosSessionId),
    label: 'Use a different account',
  }
  const clearPending = serializeCookie(PENDING_COOKIE, '', {
    maxAge: 0,
    secure: isSecure(request),
  })

  // Don't let a resubmission reset a pending or denied request. A request
  // whose approval was later removed starts over as a new request.
  const existing = await getRequest(identity.email)
  if (!existing || existing.status === 'approved') {
    const accessRequest: AccessRequest = {
      email: identity.email,
      name: identity.name,
      ...values,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    }
    await saveRequest(accessRequest)
    console.info('[auth] access requested', { email: identity.email, company: values.company })
    await sendAccessRequestEmail(env, accessRequest, baseUrl(request))
  }

  return page(
    'Request sent',
    `Thanks! The Mastra team will review access for ${identity.email}. We'll email you when it's approved.`,
    switchAccount,
    [clearPending],
  )
}

async function logout(request: Request): Promise<Response> {
  const session = await readSession(
    request.headers.get('cookie'),
    env('SESSION_SECRET'),
  )
  return redirect(workosLogoutUrl(request, session?.workosSessionId ?? null), [
    serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: isSecure(request) }),
  ])
}

async function me(request: Request): Promise<Response> {
  const session = await readSession(
    request.headers.get('cookie'),
    env('SESSION_SECRET'),
  )
  const role = session ? await resolveRole(session.email, env) : null
  if (!session || !role) return json({ error: 'Unauthorized' }, 401)
  return json({ email: session.email, name: session.name, role })
}

export default async function handler(request: Request): Promise<Response> {
  switch (new URL(request.url).pathname) {
    case '/auth/login':
      return login(request)
    case '/auth/callback':
      return callback(request)
    case '/auth/logout':
      return logout(request)
    case '/auth/me':
      return me(request)
    case '/auth/request-access':
      return requestAccess(request)
    case '/auth/signed-out':
      return page('Signed out', 'You have been signed out.', {
        href: '/auth/login',
        label: 'Sign in again',
      })
    default:
      console.warn('[auth] unknown route', new URL(request.url).pathname)
      return json({ error: 'Not found' }, 404)
  }
}

export const config: Config = {
  path: '/auth/*',
}
