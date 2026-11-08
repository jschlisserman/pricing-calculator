import { getStore } from '@netlify/blobs'
import { accessConfigFromEnv, roleForEmail, type Role } from './auth.ts'

/**
 * Agency access requests and approvals, stored in Netlify Blobs so sales can
 * manage them from the app without editing env vars or redeploying.
 * Runtime-agnostic: used by edge functions (Deno) and functions (Node).
 */

export type RequestStatus = 'pending' | 'approved' | 'denied'
export type AllowType = 'email' | 'domain'

export interface AccessRequest {
  email: string
  name: string
  company: string
  mastraContact: string
  message: string
  requestedAt: string
  status: RequestStatus
  decidedBy?: string
  decidedAt?: string
}

export interface AllowEntry {
  type: AllowType
  value: string
  company: string
  approvedBy: string
  approvedAt: string
}

type EnvGetter = (key: string) => string | undefined

/** Free/consumer email providers. Approving one of these as a domain would let anyone in. */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'hey.com',
  'fastmail.com',
  'privaterelay.appleid.com',
])

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function domainOf(email: string): string {
  return normalizeEmail(email).split('@')[1] ?? ''
}

export function isPublicEmailDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.has(domain.trim().toLowerCase())
}

function store() {
  return getStore({ name: 'access', consistency: 'strong' })
}

const requestKey = (email: string) =>
  `request/${encodeURIComponent(normalizeEmail(email))}`
const allowKey = (type: AllowType, value: string) =>
  `allow/${type}/${encodeURIComponent(value.trim().toLowerCase())}`

async function listJson<T>(prefix: string): Promise<T[]> {
  const s = store()
  const { blobs } = await s.list({ prefix })
  const values = (await Promise.all(
    blobs.map((blob) => s.get(blob.key, { type: 'json' })),
  )) as (T | null)[]
  return values.filter((value): value is T => value != null)
}

// Role lookups run on every gated request, so cache approvals briefly. Only
// positive results are cached: a new approval applies on the next sign-in,
// while removing access takes up to the TTL.
const ROLE_CACHE_TTL_MS = 30_000
const roleCache = new Map<string, number>()

function clearRoleCache() {
  roleCache.clear()
}

async function isAllowedInStore(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)
  const expires = roleCache.get(normalized)
  if (expires && expires > Date.now()) return true

  const s = store()
  const [byEmail, byDomain] = await Promise.all([
    s.get(allowKey('email', normalized)),
    s.get(allowKey('domain', domainOf(normalized))),
  ])
  const allowed = byEmail != null || byDomain != null
  if (allowed) roleCache.set(normalized, Date.now() + ROLE_CACHE_TTL_MS)
  else roleCache.delete(normalized)
  return allowed
}

/** Internal by domain, agency by env allowlist or an approval in Blobs, else no access. */
export async function resolveRole(
  email: string,
  env: EnvGetter,
): Promise<Role | null> {
  const role = roleForEmail(email, accessConfigFromEnv(env))
  if (role) return role
  try {
    return (await isAllowedInStore(email)) ? 'agency' : null
  } catch (error) {
    console.error('[access] role lookup failed', error)
    return null
  }
}

export async function getRequest(email: string): Promise<AccessRequest | null> {
  return (await store().get(requestKey(email), {
    type: 'json',
  })) as AccessRequest | null
}

export async function saveRequest(request: AccessRequest): Promise<void> {
  await store().setJSON(requestKey(request.email), request)
}

export function listRequests(): Promise<AccessRequest[]> {
  return listJson<AccessRequest>('request/')
}

export function listAllowed(): Promise<AllowEntry[]> {
  return listJson<AllowEntry>('allow/')
}

export async function allow(entry: AllowEntry): Promise<void> {
  await store().setJSON(allowKey(entry.type, entry.value), entry)
  clearRoleCache()
}

export async function revoke(type: AllowType, value: string): Promise<void> {
  await store().delete(allowKey(type, value))
  clearRoleCache()
}
