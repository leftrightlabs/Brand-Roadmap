import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Brand Elevation Profile: public lead-gen funnel, no authenticated routes.
// Middleware exists only to redirect the root `/` to `/start`. Long-term,
// we may move /start to the root URL, at which point this can be removed.

// Funnel steps + per-lead reports must never be indexed. The public /start
// landing stays indexable for marketing.
const NOINDEX_PREFIXES = ['/start/report', '/start/analyzing', '/start/info', '/start/expired']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Canonical-host redirect (domain move) ──
  // Inert until CANONICAL_HOST is set, so this can ship before DNS is cut over
  // and be rolled back by clearing the variable. Once set, any other public
  // host 301s to the same path here, which is what keeps already-emailed
  // report links alive after the move.
  //
  // Two exclusions matter. Railway's own *.up.railway.app hostname is left
  // alone so platform health checks aren't redirected, and /api/* never
  // reaches this file at all (see the matcher below) so Stripe's webhook POST
  // is never answered with a 301 — Stripe does not follow redirects and would
  // record it as a delivery failure.
  const canonicalHost = process.env.CANONICAL_HOST?.trim()
  if (canonicalHost) {
    const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()
    if (
      host &&
      host !== canonicalHost.toLowerCase() &&
      !host.endsWith('.up.railway.app') &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonicalHost}`)
      return NextResponse.redirect(target, 301)
    }
  }

  // Send root to /start
  if (pathname === '/' || pathname === '') {
    const redirectUrl = new URL('/start', request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl, 302)
  }

  const res = NextResponse.next()

  // Response-level noindex for the funnel + reports (belt to the meta-tag suspenders).
  if (NOINDEX_PREFIXES.some((p) => pathname.startsWith(p))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  return res
}

export const config = {
  matcher: [
    // Skip static assets, API routes, _next internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
}
