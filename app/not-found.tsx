import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-6">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[oklch(0.25_0.08_250)]">404</h1>
          <div className="mt-4 h-1 w-32 bg-[oklch(0.55_0.22_25)] mx-auto rounded-full" />
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-4">Página no encontrada</h2>

        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button className="bg-[oklch(0.25_0.08_250)] hover:bg-[oklch(0.20_0.08_250)] text-white px-8">
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
