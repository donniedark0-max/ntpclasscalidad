"use client"

import { useState } from "react"
import { ChevronDown, FileText, MessageSquare, CheckCircle, XCircle, ClipboardList } from "lucide-react"
import type { WeekContent } from "@/lib/types"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function WeekSection({ week }: { week: WeekContent }) {
  const [isOpen, setIsOpen] = useState(false)
  const params = useParams()

  return (
    <div className="mb-4 overflow-hidden rounded-lg border bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="h-1 w-1 rounded-full bg-blue-600" />
          <span className="font-semibold">{week.title}</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="mb-3 font-semibold">{week.subtitle}</h4>

          <div className="space-y-2">
            {week.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div className="flex items-center gap-3">
                  {item.type === "material" ? (
                    <FileText className="h-5 w-5 text-gray-600" />
                  ) : item.type === "exam" ? (
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <Link
                      href={
                        item.type === "exam"
                          ? `/dashboard/courses/${params.courseId}/exam/${item.id}`
                          : `/dashboard/courses/${week.id}/content/${item.id}`
                      }
                      className="font-medium hover:text-blue-600"
                    >
                      {item.title}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.status === "completed" ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Revisado
                    </span>
                  ) : item.status === "expired" ? (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <XCircle className="h-4 w-4" />
                      Vencido
                    </span>
                  ) : null}
                  {item.deadline && <span className="text-sm text-gray-500">{item.deadline}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
