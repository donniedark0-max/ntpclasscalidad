import DashboardLayout from "@/components/layout/dashboard-layout"
import ExamClient from "@/components/courses/exam-client"
import { getFirestore } from "@/lib/firebaseServer"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
import { exams as mockExams } from "@/lib/data/mock-data"

export default async function ExamPage(props: {
  params: Promise<{ courseId: string; examId: string }>
}) {
  const { courseId, examId } = await props.params

  let exam: any = null
  try {
    const db = getFirestore()
    if (db) {
      const snapshot = await db.collection('weeks').get()
      snapshot.forEach((doc: any) => {
        const data = doc.data() || {}
        const e = data.exam
        if (e && (e.id === examId || doc.id === examId)) {
          exam = { ...e, weekId: doc.id, week: data.week }
        }
      })
    }
  } catch (err) {
    console.error('Error loading exam from Firestore:', err)
    exam = null
  }

  if (!exam) {
    exam = mockExams[examId] || Object.values(mockExams)[0]
  }

  // Server-side: check if the current user already submitted this exam
  let initialSubmission: any = null
  let initialSubmissionExists = false
  try {
    const cookieStore = await cookies()
const token = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'utp_session')?.value

    let utpCode: string | null = null
    if (token) {
      try {
        const payload: any = jwt.verify(token, JWT_SECRET)
        utpCode = payload?.utpCode || null
      } catch (e) {
        // ignore invalid token
      }
    }

    if (utpCode) {
      // determine week number
      let weekNumber = 'unknown'
      if (exam.weekId) {
        const m = String(exam.weekId).match(/week-(\d+)/)
        if (m) weekNumber = m[1]
      } else if (exam.week) {
        weekNumber = String(exam.week)
      }

      const colName = `answers_week-${weekNumber}`
      const db = getFirestore()
      if (db) {
        const doc = await db.collection(colName).doc(utpCode).get()
        if (doc.exists) {
          initialSubmissionExists = true
          initialSubmission = doc.data()
        }
      } else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        // REST get document
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
          const docPath = `projects/${projectId}/databases/(default)/documents/${encodeURIComponent(colName)}/${encodeURIComponent(utpCode)}`
          const url = `https://firestore.googleapis.com/v1/${docPath}?key=${apiKey}`
          const r = await fetch(url)
          if (r.ok) {
            const json = await r.json()
            if (json && json.fields) {
              initialSubmissionExists = true
              const data: any = {}
              if (json.fields.examId?.stringValue) data.examId = json.fields.examId.stringValue
              if (json.fields.courseId?.stringValue) data.courseId = json.fields.courseId.stringValue
              if (json.fields.submittedAt?.stringValue) data.submittedAt = json.fields.submittedAt.stringValue
              if (json.fields.status?.stringValue) data.status = json.fields.status.stringValue
              if (json.fields.answers?.mapValue) data.answers = json.fields.answers.mapValue.fields || {}
              initialSubmission = data
            }
          }
        } catch (e) {
          console.error('REST check submission failed', e)
        }
      }
    }
  } catch (e) {
    console.error('Error checking initial submission server-side', e)
  }

  return (
    <DashboardLayout>
      <ExamClient exam={exam} courseId={courseId} initialSubmission={initialSubmission} initialSubmissionExists={initialSubmissionExists} />
    </DashboardLayout>
  )
}
