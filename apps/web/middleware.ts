/**
 * Next.js edge middleware — route-level session guard.
 *
 * Uses the presence of the HttpOnly `refresh_token` cookie as a lightweight session signal.
 * The cookie is set by the auth-service and is not readable by client JavaScript, so this
 * middleware cannot validate its contents — it only checks existence.
 *
 * Behaviour:
 * - Public paths (/login, auth API routes): allowed through; if a session cookie already
 *   exists and the user tries to navigate to /login they are redirected to /projects.
 * - All other paths: redirect to /login if no session cookie is present.
 *
 * The matcher excludes Next.js static assets and locale JSON files to avoid unnecessary
 * middleware invocations on non-page requests.
 */

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/refresh'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const hasSession = req.cookies.has('refresh_token');
    if (hasSession && pathname === '/login') {
      return NextResponse.redirect(new URL('/projects', req.url));
    }
    return NextResponse.next();
  }

  const hasSession = req.cookies.has('refresh_token');
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|locales).*)'],
};
