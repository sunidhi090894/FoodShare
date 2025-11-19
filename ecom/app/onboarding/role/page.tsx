'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import removed: auth-context no longer exists
import { requiresOrganizationCompletion } from '@/lib/auth-redirect'
import type { UserRole } from '@/lib/users'
import { Users, Leaf, HeartHandshake } from 'lucide-react'

type OnboardingRole = Extract<UserRole, 'DONOR' | 'RECIPIENT' | 'VOLUNTEER'>

const ROLE_OPTIONS: Array<{
  value: OnboardingRole
  title: string
  description: string
  icon: typeof Users
}> = [
  {
    value: 'DONOR',
    title: 'Food Donor',
    description: 'Restaurants, grocers, cafeterias, or farms with surplus food to share.',
    icon: Leaf,
  },
  {
    value: 'RECIPIENT',
    title: 'Recipient Organization',
    description: 'Shelters, community fridges, and nonprofits distributing meals.',
    icon: HeartHandshake,
  },
  {
    value: 'VOLUNTEER',
    title: 'Volunteer Driver',
    description: 'Help move food between donors and recipients on your schedule.',
    icon: Users,
  },
]

export default function RoleOnboardingPage() {
  const router = useRouter()
  // Removed useAuth: backendUser, authLoading, refreshBackendUser are not available
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Removed useEffect logic for backendUser and authLoading

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // TODO: Implement role selection logic (e.g., save to DB or context)
      if (selectedRole === 'VOLUNTEER') {
        router.push('/dashboard')
      } else {
        router.push(`/onboarding/organization?type=${selectedRole}`)
      }
    } catch (err) {
      console.error('Failed to set role', err)
      setError('We could not save your selection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-wide text-primary font-semibold">Step 1 of 2</p>
          <h1 className="text-3xl font-bold">Tell us how you&apos;ll use AaharSetu</h1>
          <p className="text-muted-foreground">Choose the role that best describes your organization or contribution.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon
            const isActive = selectedRole === role.value
            return (
              <Card
                key={role.value}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRole(role.value)}
                className={`cursor-pointer border-2 transition ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/40'
                }`}
              >
                <div className="p-6 space-y-4">
                  <Icon className={`w-8 h-8 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <h2 className="text-xl font-semibold">{role.title}</h2>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button size="lg" onClick={handleContinue} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
