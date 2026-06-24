import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Brand Roadmap — public lead-gen funnel, no authenticated routes.
// Middleware exists only to redirect the root `/` to `/start`. Long-term,
// we may move /start to the root URL, at which point this can be removed.

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Send root to /start
  if (pathname === '/' || pathname === '') {
    const redirectUrl = new URL('/start', request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl, 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip static assets, API routes, _next internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
}
