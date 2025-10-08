import DashboardLayout from "@/components/layout/dashboard-layout"
import CourseTabs from "@/components/courses/course-tabs"
import WeekSection from "@/components/courses/week-section"
import { courses, weeklyContent } from "@/lib/data/mock-data"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const course = courses.find((c) => c.id === params.courseId)

  if (!course) return <div>Curso no encontrado</div>

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Volver a cursos
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">{course.type}</span>
        </div>
        <p className="text-sm text-gray-600">{course.code}</p>
      </div>

      <CourseTabs />

      <div className="mt-6 rounded-lg bg-blue-900 p-4 text-white">
        <p className="text-sm">
          Las clases presenciales serán transmitidas en vivo vía Zoom y quedarán grabadas en la plataforma. No obstante,{" "}
          <strong>recuerda esta clase ha sido diseñada para desarrollarse de manera presencial</strong>, incluyendo
          actividades, evaluaciones, tareas, trabajos, así como las consultas e interacciones con tu docente.
        </p>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">
          Total de semanas <span className="text-gray-600">(18)</span>
        </h2>

        {weeklyContent.map((week) => (
          <WeekSection key={week.id} week={week} />
        ))}
      </div>
    </DashboardLayout>
  )
}
