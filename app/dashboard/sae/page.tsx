import DashboardLayout from "@/components/layout/dashboard-layout"
import Link from "next/link"

export default function SAEPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">SAE - Servicios Académicos Estudiantiles</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/dashboard/sae/solicitudes"
            className="rounded-lg border-2 border-gray-200 p-6 transition-all hover:border-blue-600 hover:shadow-lg"
          >
            <h2 className="mb-2 text-xl font-semibold">Solicitudes SAE</h2>
            <p className="text-gray-600">Realiza solicitudes de trámites académicos, becas y autenticaciones</p>
          </Link>

          <Link
            href="/dashboard/profile"
            className="rounded-lg border-2 border-gray-200 p-6 transition-all hover:border-blue-600 hover:shadow-lg"
          >
            <h2 className="mb-2 text-xl font-semibold">Editar Perfil</h2>
            <p className="text-gray-600">Actualiza tu información personal y datos de contacto</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
