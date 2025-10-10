import { NextResponse } from 'next/server'
import initFirebaseAdmin, { getFirestore } from '@/lib/firebaseServer'
import { weeklyContent as mockWeeklyContent } from '@/lib/data/mock-data'

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

async function fetchWeeksFromRest() {
  if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) return null
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`
    // build structured query to list documents from collection 'weeks' ordered by 'week'
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'weeks' }],
        orderBy: [{ field: { fieldPath: 'week' }, direction: 'ASCENDING' }]
      }
    }

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) return null
    const arr = await res.json()
    const weeks: any[] = []
    for (const item of arr) {
      if (!item.document) continue
      const doc = item.document
      const id = doc.name?.split('/').pop()
      const fields = doc.fields || {}
      const weekNum = fields.week?.integerValue ? Number(fields.week.integerValue) : null
      const exam = fields.exam ? (fields.exam.mapValue?.fields ? (fields.exam.mapValue.fields as any) : null) : null
      // convert mapValue fields to plain object if needed
      let examObj: any = null
      if (exam) {
        examObj = {}
        for (const k of Object.keys(exam)) {
          const v = exam[k]
          // handle stringValue
          if (v.stringValue !== undefined) examObj[k] = v.stringValue
          else if (v.integerValue !== undefined) examObj[k] = Number(v.integerValue)
          else if (v.mapValue !== undefined) examObj[k] = v.mapValue.fields
        }
      }
      weeks.push({ id, week: weekNum, exam: examObj })
    }
    return weeks
  } catch (err) {
    console.error('Failed to fetch weeks via REST', err)
    return null
  }
}

export async function GET() {
  try {
    // Prefer admin SDK if available
    const db = getFirestore()
    if (db) {
      const snapshot = await db.collection('weeks').orderBy('week').get()
      const arr: any[] = []
      snapshot.forEach((doc: any) => {
        const data = doc.data() || {}
        arr.push({ id: doc.id, week: data.week, exam: data.exam || null })
      })
      return NextResponse.json({ ok: true, weeks: arr })
    }

    // Try REST API using public API key and project id
    const restWeeks = await fetchWeeksFromRest()
    if (restWeeks && restWeeks.length) {
      return NextResponse.json({ ok: true, weeks: restWeeks })
    }

    // Fallback to mock
    return NextResponse.json({ ok: true, weeks: mockWeeklyContent })
  } catch (err: any) {
    console.error('/api/weeks error', err)
    return NextResponse.json({ ok: false, error: 'Server error', message: err?.message })
  }
}
