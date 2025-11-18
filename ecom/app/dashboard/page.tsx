'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, LogOut, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { requiresOrganizationCompletion } from '@/lib/auth-redirect'

interface BackendUser {
  _id: string
  email: string
  name: string
  role: 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN'
  organizationId?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const user = await res.json()
        setBackendUser(user)

        if (requiresOrganizationCompletion(user)) {
          router.replace('/onboarding/organization')
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
        router.replace('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
    } catch (err) {
      console.error('Sign out failed:', err)
      setError('Failed to sign out')
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/70">Loading...</p>
      </div>
    )
  }

  if (!backendUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">FoodShare</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-medium text-foreground">{backendUser.name}</p>
                <span className="text-sm text-foreground/70">{backendUser.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome back{backendUser.name ? `, ${backendUser.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-foreground/70 mt-2">Here's what's happening with your food sharing activity</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {backendUser.role === 'DONOR' && (
              <Card className="p-6 border border-border cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/donor/surplus/new')}>
                <p className="font-semibold text-foreground mb-2">List Surplus Food</p>
                <p className="text-sm text-foreground/70">Share excess food from your organization</p>
                <ChevronRight className="w-5 h-5 text-primary mt-4" />
              </Card>
            )}

            <Card className="p-6 border border-border cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/donor')}>
              <p className="font-semibold text-foreground mb-2">View Activity</p>
              <p className="text-sm text-foreground/70">See your recent donations and impact</p>
              <ChevronRight className="w-5 h-5 text-primary mt-4" />
            </Card>

            <Card className="p-6 border border-border cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/volunteer/tasks')}>
              <p className="font-semibold text-foreground mb-2">Browse Opportunities</p>
              <p className="text-sm text-foreground/70">Find ways to help in your community</p>
              <ChevronRight className="w-5 h-5 text-primary mt-4" />
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Activity Overview</h2>
            <div className="w-full h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-foreground/50">Chart will be displayed here</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
