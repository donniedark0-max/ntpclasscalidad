"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User } from "lucide-react"

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate login
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="bg-black px-2 py-1 text-xl font-bold text-white">UTP</span>
            <span className="text-xl font-bold text-red-600">+class</span>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">La nueva experiencia digital de aprendizaje</h1>
        <p className="text-lg text-gray-600">Cercana, dinámica y flexible</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm">
          Ingresa tus datos para <strong>iniciar sesión.</strong>
        </p>

        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium">
            Código UTP
          </label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              placeholder="Ingresa tu usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="pr-10"
            />
            <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">Ejemplo de usuario: U1533148 (no digitar el @utp.edu.pe)</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Restablecer contraseña
          </a>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          Iniciar sesión
        </Button>
      </form>
    </div>
  )
}
