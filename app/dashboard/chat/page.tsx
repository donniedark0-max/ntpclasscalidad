"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import ChatPage from "@/components/chat/chat-page"

export default function ChatRoutePage() {
  return (
    <DashboardLayout>
      <div>
        <ChatPage />
      </div>
    </DashboardLayout>
  )
}