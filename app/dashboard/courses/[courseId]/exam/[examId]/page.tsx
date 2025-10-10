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
    } else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Fallback: use Firestore REST API to list weeks and find the matching exam
      try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/weeks?key=${apiKey}`
        const r = await fetch(url)
        if (r.ok) {
          const json = await r.json()
          const docs = json.documents || []
          for (const d of docs) {
            try {
              // d.name is like: projects/{projectId}/databases/(default)/documents/weeks/{docId}
              const docNameParts = String(d.name || '').split('/')
              const docId = docNameParts[docNameParts.length - 1]
              const fields = d.fields || {}
              const eField = fields.exam?.mapValue?.fields
              const e = eField ? {
                id: eField.id?.stringValue,
                title: eField.title?.stringValue,
                courseId: eField.courseId?.stringValue,
                weekId: eField.weekId?.stringValue,
                timeLimit: eField.timeLimit?.integerValue,
                questions: null,
              } : null
              if (e && (e.id === examId || docId === examId)) {
                // try to parse questions if present (best-effort)
                const questionsRaw = eField?.questions?.arrayValue?.values || []
                const questions = questionsRaw.map((q: any) => {
                  const qf = q.mapValue?.fields || {}
                  return {
                    id: qf.id?.stringValue,
                    type: qf.type?.stringValue,
                    question: qf.question?.stringValue,
                    options: qf.options?.arrayValue?.values?.map((v: any) => v.stringValue) || undefined,
                  }
                })
                exam = { ...e, weekId: docId, week: fields.week?.stringValue || fields.week?.integerValue || null, questions }
                break
              }
            } catch (innerErr) {
              // ignore malformed doc and continue
            }
          }
        }
      } catch (restErr) {
        console.error('Failed to load weeks via REST fallback', restErr)
      }
    }
  } catch (err) {
    console.error('Error loading exam from Firestore:', err)
    exam = null
  }

  // If no exam found in Firestore or via REST, only fall back to mock when the exact mock key exists.
  if (!exam) {
    exam = mockExams[examId] || null
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
      // Use REST API only (avoid firebase-admin in production). The document path is:
      // projects/{projectId}/databases/(default)/documents/{colName}/{utpCode}
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
          const docPath = `projects/${projectId}/databases/(default)/documents/${encodeURIComponent(colName)}/${encodeURIComponent(utpCode)}`
          const url = `https://firestore.googleapis.com/v1/${docPath}?key=${apiKey}`
          const r = await fetch(url)
          if (r.ok) {
            const json = await r.json()
            // Only accept this as an actual submission if the stored examId matches the current exam id
            // or matches common legacy formats like `exam-week-<n>` or `exam-<n>` or the stored weekId.
            // This prevents false positives where a document exists for the user but for a different exam/week
            const foundExamId = json?.fields?.examId?.stringValue
            const expectedIds: string[] = []
            if (exam && exam.id) expectedIds.push(String(exam.id))
            if (exam && (exam.weekId || exam.week)) {
              const m = String(exam.weekId || exam.week).match(/(\d+)/)
              const weekNum = m ? m[1] : null
              if (weekNum) {
                expectedIds.push(`exam-week-${weekNum}`)
                expectedIds.push(`exam-${weekNum}`)
              }
              if (exam.weekId) expectedIds.push(String(exam.weekId))
            }
            if (json && json.fields && foundExamId && expectedIds.includes(String(foundExamId))) {
              initialSubmissionExists = true
              const data: any = {}
              if (json.fields.examId?.stringValue) data.examId = json.fields.examId.stringValue
              if (json.fields.courseId?.stringValue) data.courseId = json.fields.courseId.stringValue
              if (json.fields.submittedAt?.stringValue) data.submittedAt = json.fields.submittedAt.stringValue
              if (json.fields.status?.stringValue) data.status = json.fields.status.stringValue
              if (json.fields.answers?.mapValue) data.answers = json.fields.answers.mapValue.fields || {}
              initialSubmission = data
            } else if (json && json.fields) {
              // There is a document but it doesn't match this exam id — ignore it (not submitted for this exam)
              console.debug('Found submission document but examId does not match current exam', { foundExamId, currentExamId: exam?.id })
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
