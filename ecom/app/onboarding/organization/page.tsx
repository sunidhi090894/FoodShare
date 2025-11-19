'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { requiresOrganizationCompletion } from '@/lib/auth-redirect'
import type { OrganizationResponse, OrganizationType } from '@/lib/organizations'

const STORAGE_OPTIONS = [
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'DRY', label: 'Dry Storage' },
  { value: 'FROZEN', label: 'Frozen' },
]

function OrganizationOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // TODO: Replace with actual user context if needed
  const [existingOrg, setExistingOrg] = useState<OrganizationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    type: (searchParams.get('type')?.toUpperCase() as OrganizationType) || 'DONOR',
    address: '',
    city: '',
    pincode: '',
    latitude: '',
    longitude: '',
    contactPerson: '',
    contactPhone: '',
    storageCapabilities: [] as string[],
    serviceStart: '09:00',
    serviceEnd: '17:00',
  })

  useEffect(() => {
    // TODO: Add authentication/user context if needed
    // Example: fetch organization profile if user context is available
    // Example: redirect to login if user context is missing
    setLoading(false)
  }, [])

  const toggleStorageCapability = (capability: string) => {
    setFormData((prev) => {
      const exists = prev.storageCapabilities.includes(capability)
      return {
        ...prev,
        storageCapabilities: exists
          ? prev.storageCapabilities.filter((item) => item !== capability)
          : [...prev.storageCapabilities, capability],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add authentication/user context if needed
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        geoLocation:
          formData.latitude && formData.longitude
            ? {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
              }
            : undefined,
        storageCapabilities: formData.storageCapabilities,
        serviceHours: [
          {
            day: 'DAILY',
            open: formData.serviceStart,
            close: formData.serviceEnd,
          },
        ],
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
      }
      const endpoint = existingOrg ? `/api/organizations/${existingOrg.id}` : '/api/organizations'
      const method = existingOrg ? 'PATCH' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to save organization information')
      }
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to save organization', err)
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your onboarding steps...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-wide text-primary font-semibold">Step 2 of 2</p>
          <h1 className="text-3xl font-bold">Tell us about your organization</h1>
          <p className="text-muted-foreground">We use these details to match you with the right partners in your community.</p>
        </div>

        <Card className="p-8 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Community Kitchen Inc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Type</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as OrganizationType }))}
                >
                  <option value="DONOR">Donor</option>
                  <option value="RECIPIENT">Recipient</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  required
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pincode / ZIP</label>
                <Input
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Street Address</label>
              <Input
                required
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude (optional)</label>
                <Input
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="40.7128"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude (optional)</label>
                <Input
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="-74.0060"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Storage Capabilities</p>
              <div className="grid gap-3 md:grid-cols-3">
                {STORAGE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={formData.storageCapabilities.includes(option.value)}
                      onChange={() => toggleStorageCapability(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Hours - Start</label>
                <Input
                  type="time"
                  value={formData.serviceStart}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Hours - End</label>
                <Input
                  type="time"
                  value={formData.serviceEnd}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceEnd: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <Input
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+1 555-123-4567"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => router.push('/onboarding/role')}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : existingOrg ? 'Update Organization' : 'Save and Continue'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function OrganizationOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrganizationOnboardingContent />
    </Suspense>
  )
}
