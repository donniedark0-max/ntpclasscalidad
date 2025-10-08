import Link from "next/link"
import type { Course } from "@/lib/types"

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 bg-gray-200">{/* Placeholder for course image */}</div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{course.code}</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            {course.progress}%
          </span>
        </div>

        <h3 className="mb-2 font-semibold group-hover:text-blue-600">{course.name}</h3>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-blue-600" style={{ width: `${course.progress}%` }} />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-600">{course.instructor}</span>
        </div>
      </div>
    </Link>
  )
}
