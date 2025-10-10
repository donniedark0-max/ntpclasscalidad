import DashboardLayout from "@/components/layout/dashboard-layout"
import CourseCard from "@/components/courses/course-card"
import ActivitySidebar from "@/components/dashboard/activity-sidebar"
import Carousel from '@/components/dashboard/carousel'
import { courses, activities } from "@/lib/data/mock-data"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Full-width carousel centered above content */}
      <div className="mb-6">
        <Carousel className="px-4" />
      </div>

      <div className="flex gap-6">
        <div className="flex-1">

          {/* Courses Section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold">Mis cursos</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filtrar por</span>
              <select aria-label="Seleccionar periodo" className="rounded-lg border bg-white border-gray-300 ml-4 py-2 pr-20">
                <option>Periodo actual</option>
              </select>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">2025 - Ciclo 2 Agosto PREG (001) (Actual)</div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="">
          <ActivitySidebar activities={activities} />
        </div>
      </div>
    </DashboardLayout>
  )
}
