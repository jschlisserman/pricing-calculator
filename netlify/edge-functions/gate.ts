import type { Config, Context } from '@netlify/edge-functions'
import { readSession } from '../../server/auth.ts'
import { resolveRole } from '../../server/access.ts'

/**
 * Runs before every request (HTML, JS bundle, API). Visitors without a valid
 * session and an allowlisted email never receive the app or its pricing data.
 */
export default async function gate(request: Request, context: Context) {
  const env = (key: string) => Netlify.env.get(key)
  const session = await readSession(
    request.headers.get('cookie'),
    env('SESSION_SECRET'),
  )
  const url = new URL(request.url)
  // Only top-level page loads start a sign-in. Background requests (favicon,
  // assets, API calls) get a 401 so they can't restart the login flow.
  const isNavigation =
    request.headers.get('sec-fetch-mode') === 'navigate' ||
    (!request.headers.has('sec-fetch-mode') &&
      (request.headers.get('accept') ?? '').includes('text/html'))

  const role = session ? await resolveRole(session.email, env) : null
  if (role === 'internal') return context.next()
  if (role === 'agency') {
    // Agencies get the agency build, which has no internal costs or margins.
    if (isInternalOnlyPath(url.pathname)) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (isNavigation && !url.pathname.startsWith('/agency/')) {
      return new URL('/agency/index.html', url)
    }
    return context.next()
  }

  if (url.pathname.startsWith('/api/') || !isNavigation) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const login = new URL('/auth/login', url)
  login.searchParams.set('returnTo', `${url.pathname}${url.search}`)
  return Response.redirect(login.toString(), 302)
}

/** Internal app files: built bundle, plus source paths under the dev server. */
function isInternalOnlyPath(pathname: string): boolean {
  return (
    pathname === '/index.html' ||
    pathname.startsWith('/assets/internal/') ||
    pathname.startsWith('/src/internal/') ||
    pathname.startsWith('/src/main.tsx')
  )
}

export const config: Config = {
  path: '/*',
  // The logo and favicon are public so the sign-in pages can show them.
  excludedPath: ['/auth/*', '/mastra-logo.png', '/favicon.png'],
}
