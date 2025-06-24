"use client"

import AdminControlPanel from "@/components/admin-control-panel"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <AdminControlPanel />
      </div>
    </div>
  )
}
