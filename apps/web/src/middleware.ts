// Next.js middleware that guards the dashboard.
// It runs before a /dashboard page renders and redirects to /login if there is
// no access-token cookie. This gives a clean server-side gate so protected
// content never flashes before a client-side check.
//
// Note: it only checks for the cookie's presence, not its validity. If the
// token is expired, the API will still reject data calls with 401 and the
// client can react. That is a fine trade-off for this project.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('access_token');
  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// Only run this middleware on dashboard routes.
export const config = {
  matcher: ['/dashboard/:path*'],
};
