import DashboardLayout from "@/components/layout/dashboard-layout"
import ProfileForm from "@/components/profile/profile-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/sae" className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Link>

        <ProfileForm />
      </div>
    </DashboardLayout>
  )
}
