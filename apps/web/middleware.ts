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
