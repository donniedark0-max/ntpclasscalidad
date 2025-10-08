import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Illustration */}
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 lg:flex lg:items-center lg:justify-center">
        <div className="h-[600px] w-[600px] bg-gray-200 rounded-lg" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  )
}
