"use client"

import { useEffect, useState } from "react"
import getFirebaseApp, { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient'
import { Bell, Menu } from "lucide-react"
import { ChevronDown } from 'lucide-react'

type User = {
  uid?: string
  name?: string | null
  lastname?: string | null
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(async (json) => {
        if (!mounted) return
        if (json?.ok && json.user) {
          let u = json.user
          // If server returned only fallback (no name/lastname) try client Firestore
          if ((!u.name || !u.lastname) && u.uid) {
            try {
              const firebase = await getFirebaseFirestore()
              const appInstance = await getFirebaseApp()
              if (firebase && appInstance) {
                const { getFirestore, doc, getDoc } = firebase
                const db = getFirestore(appInstance as any)
                const userDoc = await getDoc(doc(db, 'users', u.uid))
                if (userDoc.exists()) {
                  const data = userDoc.data()
                  u = { ...u, name: data.name || u.name, lastname: data.lastname || u.lastname }
                }
              }
            } catch (e) {
              // ignore client firestore errors
            }
          }
          setUser(u)
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const displayName = user ? ([user.name, user.lastname].filter(Boolean).join(' ') || (user as any).utpCode || 'Usuario') : 'Juan Jose'

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      {/* logo at the far left */}
      <div className="flex items-center">
        <img src="/images/login/logo-pao-class.png" alt="UTP+class" className="h-6 w-auto mr-4" />
      </div>

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

        {/* vertical separator */}
        <div className="h-6 w-px bg-gray-900" aria-hidden="true" />

        <div className="relative">
          <button
            className="flex items-center gap-3"
            aria-haspopup="menu"
            onClick={() => { if (!loading) setOpen(v => !v) }}
          >
            <div className="text-right">
              {loading ? (
                <div className="space-y-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200 ml-13" />
                </div>
              ) : (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Hola, </span>
                    <span className="font-bold">{displayName}</span>
                  </p>
                  <p className="text-xs text-gray-500">Estudiante</p>
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" role="img" aria-label="Avatar" />
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {open && (
            <div role="menu" aria-label="Cuenta" className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' })
                      // Sign out client Firebase as well
                          try {
                              const authMod = await getFirebaseAuth()
                              if (authMod) {
                                // getFirebaseAuth returns the auth instance
                                await (authMod.signOut ? authMod.signOut() : Promise.resolve())
                              }
                            } catch (e) {
                              // ignore
                            }
                    } finally {
                      // redirect to login page
                      window.location.href = '/'
                    }
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
