import { NextResponse } from 'next/server';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'utp_session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
