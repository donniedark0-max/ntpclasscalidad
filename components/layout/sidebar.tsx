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
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-24 flex-col items-center gap-4 bg-[#040F38] py-6 text-white">
      <div className="mb-4 flex items-center gap-1 text-sm font-bold">
        {/* Burger menu button replacing UTP+ */}
        <button
          aria-label="Abrir menú lateral"
          className="flex h-8 w-8 items-center justify-center rounded bg-transparent text-white"
          onClick={() => {
            try {
              const html = document.documentElement
              if (html.classList.contains('sidebar-collapsed')) html.classList.remove('sidebar-collapsed')
              else html.classList.add('sidebar-collapsed')
            } catch (e) {
              // ignore (server-side rendering won't run this)
            }
          }}
        >
          <svg
            width="22"
            height="20"
            viewBox="0 0 18 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <rect y="0" width="18" height="2.5" rx="1" fill="#ffffff" />
            <rect y="5" width="18" height="2.5" rx="1" fill="#ffffff" />
            <rect y="10" width="18" height="2.5" rx="1" fill="#ffffff" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")

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
