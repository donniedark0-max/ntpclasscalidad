import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/tests', '/favicon.ico', '/images', '/images/']
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'utp_session'
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow next internals and public assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.startsWith('/public') || pathname.startsWith('/images') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Allow explicitly public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (!cookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Lightweight JWT decode (no signature verification) to check expiration (exp)
  try {
    const parts = cookie.split('.')
    if (parts.length !== 3) throw new Error('invalid')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    const exp = payload.exp
    if (typeof exp === 'number') {
      const now = Math.floor(Date.now() / 1000)
      if (exp < now) {
        const url = req.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    // If no exp, allow (fallback)
    return NextResponse.next()
  } catch (err) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
}

export const config = {
  // don't match static assets under /_next, /static, /images, or favicon
  matcher: '/((?!_next/static|_next/image|favicon.ico|images|static).*)',
}
