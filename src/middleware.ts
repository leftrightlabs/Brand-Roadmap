import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Brand Roadmap — public lead-gen funnel, no authenticated routes.
// Middleware exists only to redirect the root `/` to `/start`. Long-term,
// we may move /start to the root URL, at which point this can be removed.

// Funnel steps + per-lead reports must never be indexed. The public /start
// landing stays indexable for marketing.
const NOINDEX_PREFIXES = ['/start/report', '/start/analyzing', '/start/info', '/start/expired']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

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
