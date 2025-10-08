"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 space-y-2">
        <div className="mb-4">
          <Image
            src="/images/logo-class.webp" // Asegúrate de que esta ruta sea correcta
            alt="UTP Class Logo"
            width={158}
            height={38}
            priority
          />
        </div>

        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
          La nueva experiencia digital de aprendizaje
        </h1>
        <p className="text-lg text-gray-600">
          Cercana, dinámica y flexible
        </p>
      </div>

      <div className="mb-4">
        <p className="text-base text-gray-700">
          Ingresa tus datos para <strong className="font-bold">iniciar sesión.</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-bold text-gray-800">
            Código UTP
          </label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              placeholder="Ingresa tu usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="peer pr-10 h-11 border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base"
            />
            <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-blue-600 transition-colors" />
          </div>
          <p className="mt-2 text-xs text-gray-600 font-medium flex items-start">
            <AlertCircle className="h-4 w-4 mr-1.5 mt-[1px] text-gray-400 flex-shrink-0" />
            <span className="leading-tight">
              Ejemplo de usuario: U1533148 (no digitar el @utp.edu.pe)
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-800">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="peer pr-10 h-11 border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 peer-focus:text-blue-600 transition-colors"
              aria-label="Mostrar u ocultar contraseña"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <div className="text-right -mt-2">
          <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Restablecer contraseña
          </a>
        </div>

        <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
            >
              Iniciar sesión
            </Button>
        </div>
      </form>
    </div>
  )
}