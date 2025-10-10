"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User } from "lucide-react"
import { getFirebaseAuth } from '@/lib/firebaseClient'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true)
  const auth = await getFirebaseAuth();

        // Build email from username if user entered a utpCode without @
        let email = formData.username;
        if (!email.includes('@')) {
          email = `${email}@utp.edu.pe`;
        }

        const cred = await signInWithEmailAndPassword(auth, email, formData.password);
        const user = cred.user;

        const idToken = await user.getIdToken();

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include',
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          // Force a full navigation so the browser sends/reads cookies immediately
          window.location.href = '/dashboard'
        } else {
          alert(data.error || 'Error al iniciar sesión');
        }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <img src="/images/login/logo-pao-class.png" alt="UTP+class" className="h-10 w-auto" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">La nueva experiencia digital de aprendizaje</h1>
        <p className="text-2xl text-[#3e4558] font-light">Cercana, dinámica y flexible</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-[16px] text-[#72767b]">
          Ingresa tus datos para <strong className="font-bold text-[#161D1F]">iniciar sesión.</strong>
        </p>  

        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-bold text-[#161D1F]">
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
          <p className="mt-1 text-xs text-[#000f37] flex items-center">
            <svg
              data-testid="icon"
              viewBox="0 0 1024 1024"
              name="Mail"
              className="text-info-icon mr-2 h-4 w-4"
            >
              <path d="M512 981.333c-260.267 0-469.333-209.067-469.333-469.333s209.067-469.333 469.333-469.333 469.333 209.067 469.333 469.333-209.067 469.333-469.333 469.333zM512 128c-213.333 0-384 170.667-384 384s170.667 384 384 384c213.333 0 384-170.667 384-384s-170.667-384-384-384z M512 725.333c-25.6 0-42.667-17.067-42.667-42.667v-170.667c0-25.6 17.067-42.667 42.667-42.667s42.667 17.067 42.667 42.667v170.667c0 25.6-17.067 42.667-42.667 42.667z M512 384c-4.267 0-12.8 0-17.067-4.267s-8.533-4.267-12.8-8.533c-8.533-8.533-12.8-17.067-12.8-29.867 0-4.267 0-4.267 0-8.533s0-4.267 4.267-8.533c0-4.267 4.267-4.267 4.267-8.533s4.267-4.267 4.267-4.267c4.267-4.267 8.533-8.533 12.8-8.533 17.067-8.533 34.133-4.267 46.933 8.533 0 0 4.267 4.267 4.267 4.267 0 4.267 4.267 4.267 4.267 8.533s0 4.267 4.267 8.533c0 4.267 0 4.267 0 8.533 0 12.8-4.267 21.333-12.8 29.867-4.267 0-4.267 4.267-4.267 4.267-4.267 0-4.267 4.267-8.533 4.267s-4.267 0-8.533 4.267c-4.267 0-4.267 0-8.533 0z"></path>
            </svg>
            Ejemplo de usuario: U1533148 (no digitar el @utp.edu.pe)
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#161D1F]">
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
          <a href="#" className="text-sm font-semibold text-[#0661FC] hover:text-[#0099d3]">
            Restablecer contraseña
          </a>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Iniciando...
            </span>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </form>
    </div>
  )
}
