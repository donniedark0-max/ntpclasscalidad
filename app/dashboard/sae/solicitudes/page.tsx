import DashboardLayout from "@/components/layout/dashboard-layout"
import SAERequestForm from "@/components/sae/sae-request-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SAESolicitudesPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/sae" className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Link>

        <h1 className="mb-6 text-2xl font-bold">Solicitudes SAE</h1>

        <SAERequestForm />
      </div>
    </DashboardLayout>
  )
}
