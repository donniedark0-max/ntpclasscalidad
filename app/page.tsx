import LoginForm from "@/components/auth/login-form"


export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Illustration */}
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-50 to-[#EFF6FF] lg:flex lg:items-center lg:justify-center">
        
        <div className="relative h-[600px] w-[600px] pt-15">
<img
          src="/images/login/web-login-pao.svg"
          alt="Ilustración de la plataforma digital"
          className="object-contain w-full h-auto"
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
