import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getFirestore } from '@/lib/firebaseServer'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'utp_session'

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => {
      const [k, ...v] = c.split('=')
      return [k?.trim(), v.join('=')]
    }).filter(Boolean) as [string, string][])

    const token = cookies[COOKIE_NAME]
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 })

    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
    }

    const uid = payload?.uid
    if (!uid) return NextResponse.json({ ok: false, error: 'Invalid token payload' }, { status: 401 })

    // Build a minimal user from the JWT payload as a safe fallback
    const fallbackUser = {
      uid,
      utpCode: (payload as any)?.utpCode || null,
      email: (payload as any)?.email || null,
      name: null,
      lastname: null,
      number: null,
    }

    // Try to read user doc from Firestore. If admin credentials are missing, return fallback with a warning.
    try {
      const db = getFirestore()
      const doc = await db.collection('users').doc(uid).get()
      if (!doc.exists) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })

      const data = doc.data() || {}
      // Map stored fields to a safe response shape
      const user = {
        uid,
        email: data.email || null,
        name: data.name || null,
        lastname: data.lastname || null,
        number: data.number || null,
        utpCode: data.email ? String(data.email).split('@')[0] : fallbackUser.utpCode,
      }

      return NextResponse.json({ ok: true, user })
    } catch (err: any) {
      // If credentials missing, return fallback info with a helpful warning instead of 500
      const msg = String(err?.message || err)
      if (msg.includes('Could not load the default credentials')) {
        return NextResponse.json({ ok: true, user: fallbackUser, warning: 'Missing Firebase admin credentials. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS to enable Firestore access.' })
      }
      throw err
    }
  } catch (err: any) {
    console.error('/api/auth/me error', err)
    return NextResponse.json({ ok: false, error: 'Server error', message: err?.message }, { status: 500 })
  }
}
