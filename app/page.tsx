import Image from "next/image" 
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {}
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 lg:flex lg:items-center lg:justify-center relative"> 
        
        {}
        <div className="relative h-[600px] w-[600px]">
          <Image
            src="/images/web-login.svg" 
            alt="Ilustración de la plataforma digital"
            fill 
            className="object-contain" 
            priority 
          />
        </div>

      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  )
}