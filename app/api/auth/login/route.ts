import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'utp_session';
const COOKIE_MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE || 3600); // seconds
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

async function verifyIdTokenWithRest(idToken: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Invalid idToken');
  }
  const json = await resp.json();
  if (!json.users || !json.users.length) throw new Error('No user info');
  return json.users[0];
}

async function signInWithPassword(email: string, password: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const msg = err?.error?.message || 'Auth failed';
    const e: any = new Error(msg);
    e.code = err?.error?.message || 'auth/failed';
    throw e;
  }
  return await resp.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!FIREBASE_API_KEY) {
      console.error('[api/auth/login] Missing Firebase API key');
      return NextResponse.json({ error: 'Missing Firebase API key. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local' }, { status: 500 });
    }

    let uid: string | undefined;
    let email: string | undefined;

    // Flow A: client sends idToken
    if (body.idToken) {
      const info = await verifyIdTokenWithRest(body.idToken);
      uid = info.localId;
      email = info.email;
    }

    // Flow B: client sends email+password
    if (body.email && body.password) {
      const signin = await signInWithPassword(body.email, body.password);
      uid = signin.localId;
      email = signin.email;
    }

    if (!uid) {
      return NextResponse.json({ error: 'No credentials provided' }, { status: 400 });
    }

    // Create JWT payload from auth info only (no firebase-admin required)
    const utpCode = email ? email.split('@')[0] : uid;
    const payload = { uid, utpCode, role: 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: COOKIE_MAX_AGE });

    const res = NextResponse.json({ ok: true, user: { uid, utpCode } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (err: any) {
    console.error('[api/auth/login] error:', err);
    const message = err?.message || String(err);
    return NextResponse.json({ error: 'Internal error', message }, { status: 500 });
  }
}
