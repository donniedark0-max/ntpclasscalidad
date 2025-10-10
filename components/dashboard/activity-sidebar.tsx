import type { Activity } from "@/lib/types"
import { Clock, AlertCircle } from "lucide-react"

export default function ActivitySidebar({ activities }: { activities: Activity[] }) {
  return (
    <div className="w-80 rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
          <Clock className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">Actividades semanales</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="rounded-lg p-3 bg-[#EFF6FE]">
            <div className="mb-2 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.type}</p>
                <p className="text-sm text-blue-600">{activity.title}</p>
              </div>
            </div>

            <p className="mb-2 text-xs text-gray-600">{activity.course}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Vence: {activity.deadline}</span>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Por entregar
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
