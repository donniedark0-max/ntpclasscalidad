import DashboardLayout from "@/components/layout/dashboard-layout"
import CourseCard from "@/components/courses/course-card"
import ActivitySidebar from "@/components/dashboard/activity-sidebar"
import { courses, activities } from "@/lib/data/mock-data"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex gap-6">
        <div className="flex-1">
          {/* Banner */}
          <div className="mb-6 h-48 w-full overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-red-700">
            <div className="flex h-full items-center justify-between px-8 text-white">
              <div>
                <p className="mb-2 text-sm font-medium">EVITAR DAR CLICK EN ENLACES SOSPECHOSOS</p>
                <h2 className="text-3xl font-bold">PROTEGE TUS DATOS</h2>
                <p className="mt-2 text-xl font-bold">ALERTA DE PHISHING</p>
              </div>
              <div className="h-32 w-32 bg-white/20" />
            </div>
          </div>

          {/* Courses Section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mis cursos</h2>
            <select className="rounded-lg border border-gray-300 px-4 py-2">
              <option>Periodo actual</option>
            </select>
          </div>

          <div className="mb-4 text-sm text-gray-600">2025 - Ciclo 2 Agosto PREG (001) (Actual)</div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Activity Sidebar */}
        <ActivitySidebar activities={activities} />
      </div>
    </DashboardLayout>
  )
}
