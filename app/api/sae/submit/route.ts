import { NextResponse } from 'next/server'
import initFirebaseAdmin, { getFirestore } from '@/lib/firebaseServer'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tipo, telefono, detalle, files } = body || {}
    if (!tipo || !telefono || !detalle) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // read session cookie to identify user
    let utpCode: string | null = null
    try {
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(new RegExp((process.env.SESSION_COOKIE_NAME || 'utp_session') + "=([^;]+)"))
      const token = match ? match[1] : null
      if (token) {
        const payload: any = jwt.verify(token, JWT_SECRET)
        utpCode = payload?.utpCode || null
      }
    } catch (e) {
      // ignore
    }

    const ticketId = `T-${Date.now()}`
    const doc = {
      ticketId,
      tipo,
      telefono,
      detalle,
      files: files || [],
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: utpCode || null,
    }

    // Try admin SDK write first
    try {
      const adminApp = initFirebaseAdmin()
      const db = getFirestore()
      if (db) {
        await db.collection('sae_requests').doc(ticketId).set(doc)
        return NextResponse.json({ ticketId })
      }
    } catch (e) {
      console.warn('Admin write failed, falling back to REST', e)
    }

    // Fallback: REST API write
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const path = `projects/${projectId}/databases/(default)/documents/sae_requests/${encodeURIComponent(ticketId)}`
      // convert doc to Firestore field format
      const toFields = (o: any) => {
        const fields: any = {}
        for (const k of Object.keys(o)) {
          const v = o[k]
          if (v === null) { fields[k] = { nullValue: null }; continue }
          if (typeof v === 'string') fields[k] = { stringValue: v }
          else if (typeof v === 'number') fields[k] = { integerValue: String(v) }
          else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map((x) => ({ stringValue: String(x) })) } }
          else fields[k] = { stringValue: String(v) }
        }
        return fields
      }
      const bodyPayload = { fields: toFields(doc) }
      const url = `https://firestore.googleapis.com/v1/${path}?key=${apiKey}`
      const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) })
      if (!r.ok) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
      return NextResponse.json({ ticketId })
    }

    return NextResponse.json({ error: 'No Firebase configured' }, { status: 500 })
  } catch (e: any) {
    console.error('sae submit error', e)
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 })
  }
}
