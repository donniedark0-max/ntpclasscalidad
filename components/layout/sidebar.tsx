"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, MessageCircle, Calendar, HelpCircle, Settings, Mail, Library, FileText } from "lucide-react"

const menuItems = [
  { icon: BookOpen, label: "Cursos", href: "/dashboard" },
  { icon: MessageCircle, label: "Chat", href: "/dashboard/chat" },
  { icon: Calendar, label: "Calendario", href: "/dashboard/calendario" },
  { icon: HelpCircle, label: "Ayuda", href: "/dashboard/ayuda" },
  { icon: FileText, label: "SAE", href: "/dashboard/sae" },
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
  { icon: Mail, label: "Correo UTP", href: "/dashboard/correo" },
  { icon: Library, label: "UTP+biblio", href: "/dashboard/biblioteca" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-20 flex-col items-center gap-4 bg-blue-950 py-6 text-white">
      <div className="mb-4 flex items-center gap-1 text-sm font-bold">
        <span className="bg-white px-1 text-blue-950">UTP</span>
        <span className="text-red-500">+</span>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 text-xs transition-colors ${
                isActive ? "bg-blue-900" : "hover:bg-blue-900/50"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-center leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
