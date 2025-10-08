"use client"

import { Bell, Menu } from "lucide-react"

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <button className="lg:hidden">
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button className="relative">
          <Bell className="h-6 w-6 text-gray-600" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            2
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Hola, Juan Jose</p>
            <p className="text-xs text-gray-500">Estudiante</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
        </div>
      </div>
    </header>
  )
}
