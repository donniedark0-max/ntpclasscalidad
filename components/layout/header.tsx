"use client"

import { useEffect, useState } from "react"
import { Bell, Menu } from "lucide-react"

type User = {
  uid?: string
  name?: string | null
  lastname?: string | null
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((json) => {
        if (!mounted) return
        if (json?.ok && json.user) setUser(json.user)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const displayName = user ? ([user.name, user.lastname].filter(Boolean).join(' ') || (user as any).utpCode || 'Usuario') : 'Juan Jose'

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <button className="lg:hidden" aria-label="Abrir menú">
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button className="relative" aria-label="Notificaciones">
          <Bell className="h-6 w-6 text-gray-600" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            2
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Hola, {displayName}</p>
            <p className="text-xs text-gray-500">Estudiante</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" role="img" aria-label="Avatar" />
        </div>
      </div>
    </header>
  )
}
