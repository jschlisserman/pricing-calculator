import { useCallback, useEffect, useState } from 'react'

type AllowType = 'email' | 'domain'

interface AccessRequest {
  email: string
  name: string
  company: string
  mastraContact: string
  message: string
  requestedAt: string
  status: 'pending' | 'approved' | 'denied'
  decidedBy?: string
  decidedAt?: string
}

interface AllowEntry {
  type: AllowType
  value: string
  company: string
  approvedBy: string
  approvedAt: string
}

interface AccessData {
  pending: AccessRequest[]
  decided: AccessRequest[]
  allowed: AllowEntry[]
}

// Mirrors PUBLIC_EMAIL_DOMAINS in server/access.ts (the server enforces it).
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'msn.com', 'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.net',
  'mail.com', 'zoho.com', 'yandex.com', 'hey.com', 'fastmail.com',
  'privaterelay.appleid.com',
])

function domainOf(email: string): string {
  return email.split('@')[1] ?? ''
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface AccessPageProps {
  onPendingCount: (count: number) => void
}

export default function AccessPage({ onPendingCount }: AccessPageProps) {
  const [data, setData] = useState<AccessData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [addType, setAddType] = useState<AllowType>('email')
  const [addValue, setAddValue] = useState('')
  const [addCompany, setAddCompany] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/access')
      const payload = (await res.json()) as AccessData & { error?: string }
      if (!res.ok) throw new Error(payload.error || 'Failed to load access.')
      setData(payload)
      onPendingCount(payload.pending.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access.')
    }
  }, [onPendingCount])

  useEffect(() => {
    void load()
  }, [load])

  async function act(key: string, body: Record<string, string>): Promise<boolean> {
    setBusy(key)
    setError(null)
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(payload.error || 'Something went wrong.')
      await load()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      return false
    } finally {
      setBusy(null)
    }
  }

  async function addAccess() {
    const ok = await act('add', {
      action: 'add',
      type: addType,
      value: addValue.trim(),
      company: addCompany.trim(),
    })
    if (ok) {
      setAddValue('')
      setAddCompany('')
    }
  }

  return (
    <>
      <section className="hero animate-in delay-1">
        <h1>Agency access.</h1>
        <p>
          Approve agencies who request access to the calculator. Approved people
          sign in with agency pricing. Anyone at mastra.ai already has access.
        </p>
      </section>

      <div className="access-stack animate-in delay-2">
        {error && <p className="review-error">{error}</p>}

        <section className="panel">
          <div className="panel-head">
            <h2>Pending requests</h2>
            {data && <span className="category-meta">{data.pending.length}</span>}
          </div>
          {!data ? (
            <p className="access-empty">Loading…</p>
          ) : data.pending.length === 0 ? (
            <p className="access-empty">No pending requests.</p>
          ) : (
            <ul className="access-list">
              {data.pending.map((request) => {
                const domain = domainOf(request.email)
                return (
                  <li className="access-item" key={request.email}>
                    <div className="access-item-body">
                      <span className="order-line-name">
                        {request.company}
                        <span className="access-email"> · {request.email}</span>
                      </span>
                      <span className="order-line-meta">
                        {request.name && `${request.name} · `}Requested{' '}
                        {formatDate(request.requestedAt)}
                        {request.mastraContact &&
                          ` · Mastra contact: ${request.mastraContact}`}
                      </span>
                      {request.message && (
                        <p className="access-message">{request.message}</p>
                      )}
                    </div>
                    <div className="access-actions">
                      <button
                        type="button"
                        className="access-btn approve"
                        disabled={busy != null}
                        onClick={() =>
                          void act(`approve:${request.email}`, {
                            action: 'approve',
                            email: request.email,
                            scope: 'email',
                          })
                        }
                      >
                        Approve person
                      </button>
                      {!PUBLIC_EMAIL_DOMAINS.has(domain) && (
                        <button
                          type="button"
                          className="access-btn"
                          disabled={busy != null}
                          onClick={() =>
                            void act(`domain:${request.email}`, {
                              action: 'approve',
                              email: request.email,
                              scope: 'domain',
                            })
                          }
                        >
                          Approve all @{domain}
                        </button>
                      )}
                      <button
                        type="button"
                        className="access-btn deny"
                        disabled={busy != null}
                        onClick={() =>
                          void act(`deny:${request.email}`, {
                            action: 'deny',
                            email: request.email,
                          })
                        }
                      >
                        Deny
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Approved</h2>
            {data && <span className="category-meta">{data.allowed.length}</span>}
          </div>
          {!data ? (
            <p className="access-empty">Loading…</p>
          ) : data.allowed.length === 0 ? (
            <p className="access-empty">No agencies approved yet.</p>
          ) : (
            <ul className="access-list">
              {data.allowed.map((entry) => (
                <li className="access-item" key={`${entry.type}:${entry.value}`}>
                  <div className="access-item-body">
                    <span className="order-line-name">
                      {entry.type === 'domain' ? `Everyone @${entry.value}` : entry.value}
                    </span>
                    <span className="order-line-meta">
                      {entry.company && `${entry.company} · `}Approved by{' '}
                      {entry.approvedBy} on {formatDate(entry.approvedAt)}
                    </span>
                  </div>
                  <div className="access-actions">
                    <button
                      type="button"
                      className="access-btn deny"
                      disabled={busy != null}
                      onClick={() => {
                        const label =
                          entry.type === 'domain' ? `everyone @${entry.value}` : entry.value
                        if (window.confirm(`Remove access for ${label}?`)) {
                          void act(`revoke:${entry.value}`, {
                            action: 'revoke',
                            type: entry.type,
                            value: entry.value,
                          })
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Add access</h2>
          </div>
          <form
            className="review-form review-form-standalone"
            onSubmit={(e) => {
              e.preventDefault()
              void addAccess()
            }}
          >
            <div className="access-toggle" role="radiogroup" aria-label="Access type">
              {(['email', 'domain'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={addType === type}
                  className={`nav-tab${addType === type ? ' active' : ''}`}
                  onClick={() => setAddType(type)}
                >
                  {type === 'email' ? 'One person' : 'Whole domain'}
                </button>
              ))}
            </div>
            <label className="review-field" htmlFor="access-value">
              {addType === 'email' ? 'Email' : 'Domain'}
              <input
                id="access-value"
                type={addType === 'email' ? 'email' : 'text'}
                placeholder={addType === 'email' ? 'name@agency.com' : 'agency.com'}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                required
              />
            </label>
            <label className="review-field" htmlFor="access-company">
              Company <span className="optional">Optional</span>
              <input
                id="access-company"
                type="text"
                placeholder="Agency name"
                value={addCompany}
                onChange={(e) => setAddCompany(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="clear-btn confirm-btn"
              disabled={busy != null || !addValue.trim()}
            >
              {busy === 'add' ? 'Adding…' : 'Add access'}
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
