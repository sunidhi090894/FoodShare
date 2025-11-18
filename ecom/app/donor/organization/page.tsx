'use client'

import { useProtectedRoute } from '@/hooks/use-protected-route'

export default function AddOrganization() {
  useProtectedRoute('DONOR')
  
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground">Add Organization</h1>
      <p className="text-foreground/70 mt-2">Register your organization to start sharing food</p>
    </div>
  )
}
