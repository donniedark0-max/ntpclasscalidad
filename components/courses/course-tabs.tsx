"use client"

import { useState } from "react"

const tabs = ["Sílabo", "Contenido", "Evaluaciones", "Tareas", "Foros", "Notas", "Anuncios", "Zoom"]

export default function CourseTabs() {
  const [activeTab, setActiveTab] = useState("Contenido")

  return (
    <div className="border-b">
      <div className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
