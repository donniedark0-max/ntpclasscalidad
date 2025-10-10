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
  const [errorType, setErrorType] = useState<'none' | 'required' | 'invalid'>('none')
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({})

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // reset error
    setErrorType('none')
    // mark touched
    setTouched({ username: true, password: true })

    // Validate required
    if (!formData.username || !formData.password) {
      setErrorType('required')
      return
    }

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
          // invalid credentials
          setErrorType('invalid')
          setTouched({ username: true, password: true })
        }
    } catch (err: any) {
      console.error(err);
      setErrorType('invalid')
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
            {(() => {
              const usernameHasError = (errorType !== 'none' && (!formData.username || errorType === 'invalid')) && touched.username
              return (
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={formData.username}
                  onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setErrorType('none') }}
                  onBlur={() => setTouched(t => ({ ...t, username: true }))}
                  className={`pr-10 ${usernameHasError ? 'border-[#f10a32]' : ''}`}
                  style={usernameHasError ? { border: '1px solid #f10a32' } : undefined}
                />
              )
            })()}
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
            {(() => {
              const passwordHasError = (errorType !== 'none' && (!formData.password || errorType === 'invalid')) && touched.password
              return (
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrorType('none') }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  className={`pr-10 ${passwordHasError ? 'border-[#f10a32]' : ''}`}
                  style={passwordHasError ? { border: '1px solid #f10a32' } : undefined}
                />
              )
            })()}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {/* Error message area: show required or invalid message */}
          <div>
            {errorType !== 'none' && (
              <p className="mt-2 flex items-center text-[12px] text-[#e8212b]">
                <svg
                  data-testid="icon"
                  name="someError"
                  className="icon-error mr-1"
                  width="16"
                  height="16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="m9.48 2.865 4.895 8.455c.162.22.224.542.278.825l.014.069c0 .476-.175.893-.525 1.25-.291.357-.757.536-1.223.536H3.012c-.292 0-.583-.06-.816-.238-.816-.477-1.107-1.608-.641-2.442l4.953-8.455a1.42 1.42 0 0 1 .582-.596c.816-.536 1.865-.238 2.39.596zm-6.468 9.944h9.906c.291 0 .582-.298.524-.595 0-.12 0-.239-.058-.298L8.43 3.52c-.175-.238-.525-.358-.816-.179-.039 0-.078.053-.116.106a.7.7 0 0 1-.059.073l-4.953 8.396c-.116.298-.058.655.233.833.117.06.175.06.292.06zm4.954-3.573c.35 0 .582-.238.582-.595V6.259c0-.357-.233-.596-.582-.596-.35 0-.583.239-.583.596V8.64c0 .357.233.595.583.595zm-.583 1.787c0-.358.233-.596.583-.596s.582.238.582.596a.59.59 0 0 1-.582.595.59.59 0 0 1-.583-.595z"
                    fill="#E8212B"
                  />
                </svg>
                {errorType === 'required'
                  ? 'Es necesario ingresar esta información'
                  : 'Los datos ingresados son incorrectos'}
              </p>
            )}
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
