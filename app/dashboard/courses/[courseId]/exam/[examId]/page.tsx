import DashboardLayout from "@/components/layout/dashboard-layout"
import ExamClient from "@/components/courses/exam-client"
import { getFirestore } from "@/lib/firebaseServer"
import { exams as mockExams } from "@/lib/data/mock-data"

export default async function ExamPage({ params }: any) {
  const { courseId, examId } = params

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

  return (
    <DashboardLayout>
      <ExamClient exam={exam} courseId={courseId} />
    </DashboardLayout>
  )
}
