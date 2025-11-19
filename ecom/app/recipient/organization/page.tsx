'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProtectedRoute } from '@/hooks/use-protected-route'

export default function RecipientOrganizationPage() {
  useProtectedRoute('RECIPIENT')
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    contact: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create organization
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: 'RECIPIENT',
          address: formData.address,
          city: formData.city,
          contactPhone: formData.contact,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create organization')
      }

      // Redirect to recipient dashboard
      router.push('/recipient')
    } catch (err) {
      console.error('Organization creation error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create organization. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-12 px-4">
      <div className="max-w-md mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#4a1f1f]">Set Up Organization</h1>
          <p className="text-[#6b4d3c]">Create your organization profile to start requesting surplus food.</p>
        </div>

        <Card className="p-8 border border-[#d9c7aa] bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-[#4a1f1f]">
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Community Kitchen, Food Bank, etc."
                className="w-full border border-[#d9c7aa] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c3b3c] focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-[#4a1f1f]">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                className="w-full border border-[#d9c7aa] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c3b3c] focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-[#4a1f1f]">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Mumbai, Bangalore, etc."
                className="w-full border border-[#d9c7aa] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c3b3c] focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact" className="block text-sm font-medium text-[#4a1f1f]">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="+91 90000 12345"
                className="w-full border border-[#d9c7aa] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c3b3c] focus:border-transparent"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8c3b3c] hover:bg-[#732f30] text-white py-2.5 rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? 'Creating Organization...' : 'Create Organization'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[#d9c7aa] text-[#8c3b3c] hover:bg-[#f7ebe0]"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
