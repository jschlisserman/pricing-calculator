import type { AccessRequest } from './access.ts'

/**
 * Access-request emails via Resend's HTTP API (plain fetch, so it also runs in
 * edge functions). Missing config is logged and skipped: the request is still
 * saved and visible in the Access tab.
 */

type EnvGetter = (key: string) => string | undefined

const DEFAULT_FROM = 'Mastra Pricing <onboarding@resend.dev>'

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function recipients(env: EnvGetter): string[] {
  return (env('ACCESS_REQUEST_RECIPIENTS') ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

async function send(
  env: EnvGetter,
  message: { to: string[]; subject: string; text: string; html: string },
): Promise<void> {
  const apiKey = env('RESEND_API_KEY')
  if (!apiKey || message.to.length === 0) {
    console.warn('[access] email skipped (RESEND_API_KEY or recipients not set)', {
      subject: message.subject,
    })
    return
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env('RESEND_FROM') || DEFAULT_FROM, ...message }),
    })
    if (!response.ok) {
      console.error('[access] email failed', response.status, await response.text())
    }
  } catch (error) {
    console.error('[access] email failed', error)
  }
}

export function sendAccessRequestEmail(
  env: EnvGetter,
  request: AccessRequest,
  appUrl: string,
): Promise<void> {
  const reviewUrl = `${appUrl}/#access`
  const rows: [string, string][] = [
    ['Email', request.email],
    ['Name', request.name || '(none)'],
    ['Company', request.company],
    ['Mastra contact', request.mastraContact || '(none)'],
    ['Message', request.message || '(none)'],
  ]
  return send(env, {
    to: recipients(env),
    subject: `Pricing calculator access request · ${request.company} · ${request.email}`,
    text: [
      'New agency access request for the Mastra pricing calculator.',
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      `Review: ${reviewUrl}`,
    ].join('\n'),
    html: `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;line-height:1.45;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 16px">New access request</h1>
  ${rows.map(([label, value]) => `<p style="margin:0 0 8px"><strong>${esc(label)}:</strong> ${esc(value)}</p>`).join('')}
  <p style="margin:24px 0 0"><a href="${esc(reviewUrl)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#111;color:#fff;text-decoration:none">Review request</a></p>
</body></html>`,
  })
}

export function sendAccessApprovedEmail(
  env: EnvGetter,
  email: string,
  appUrl: string,
): Promise<void> {
  return send(env, {
    to: [email],
    subject: 'Your Mastra pricing calculator access is approved',
    text: `You now have access to the Mastra pricing calculator.\n\nSign in: ${appUrl}`,
    html: `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;line-height:1.45;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 16px">You're approved</h1>
  <p>You now have access to the Mastra pricing calculator.</p>
  <p style="margin:24px 0 0"><a href="${esc(appUrl)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#111;color:#fff;text-decoration:none">Sign in</a></p>
</body></html>`,
  })
}
