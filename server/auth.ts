import { SignJWT, jwtVerify } from 'jose'

/**
 * Shared auth helpers. Runtime-agnostic (Web Crypto + jose) so the same code
 * runs in Netlify Edge Functions (Deno) and Netlify Functions (Node).
 */

export type Role = 'internal' | 'agency'

export interface Session {
  email: string
  name: string
  /** WorkOS session id (`sid`), used to end the AuthKit session on logout. */
  workosSessionId: string | null
}

export interface AccessConfig {
  internalDomains: string[]
  agencyDomains: string[]
  agencyEmails: string[]
}

export const SESSION_COOKIE = 'mp_session'
export const TX_COOKIE = 'mp_auth_tx'
export const SESSION_TTL_SECONDS = 60 * 60 * 12
export const TX_TTL_SECONDS = 60 * 10

type EnvGetter = (key: string) => string | undefined

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function accessConfigFromEnv(get: EnvGetter): AccessConfig {
  const internalDomains = parseList(get('INTERNAL_DOMAINS'))
  return {
    internalDomains: internalDomains.length > 0 ? internalDomains : ['mastra.ai'],
    agencyDomains: parseList(get('AGENCY_DOMAINS')),
    agencyEmails: parseList(get('AGENCY_EMAILS')),
  }
}

/**
 * Role is derived from the email on every request (not stored in the cookie),
 * so removing an agency from the allowlist takes effect immediately.
 */
export function roleForEmail(email: string, config: AccessConfig): Role | null {
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1] ?? ''
  if (!domain) return null
  if (config.internalDomains.includes(domain)) return 'internal'
  if (
    config.agencyEmails.includes(normalized) ||
    config.agencyDomains.includes(domain)
  ) {
    return 'agency'
  }
  return null
}

function secretKey(secret: string | undefined): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters.')
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(
  payload: Record<string, unknown>,
  secret: string | undefined,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey(secret))
}

export async function verifyToken(
  token: string | null | undefined,
  secret: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ['HS256'],
    })
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

export function createSessionToken(
  session: Session,
  secret: string | undefined,
): Promise<string> {
  return signToken({ ...session }, secret, SESSION_TTL_SECONDS)
}

export async function readSession(
  cookieHeader: string | null | undefined,
  secret: string | undefined,
): Promise<Session | null> {
  const payload = await verifyToken(
    getCookie(cookieHeader, SESSION_COOKIE),
    secret,
  )
  if (!payload || typeof payload.email !== 'string') return null
  return {
    email: payload.email,
    name: typeof payload.name === 'string' ? payload.name : '',
    workosSessionId:
      typeof payload.workosSessionId === 'string'
        ? payload.workosSessionId
        : null,
  }
}

export function getCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function serializeCookie(
  name: string,
  value: string,
  { maxAge, secure }: { maxAge: number; secure: boolean },
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (value.startsWith('/auth/')) return '/'
  return value
}
