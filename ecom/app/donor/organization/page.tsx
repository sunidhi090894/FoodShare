'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function AddOrganization() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address: '',
    phone: '',
    capacity: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: 40.7128,
          longitude: -74.0060
        })
      })
      if (res.ok) {
        window.location.href = '/donor'
      }
    } catch (error) {
      console.log('[v0] Error adding organization:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/donor" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>

        <Card className="p-8 border border-border">
          <h1 className="text-3xl font-bold mb-2">Register Your Organization</h1>
          <p className="text-foreground/70 mb-8">Add your restaurant, grocery store, or food business to start sharing surplus food</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Fresh Market Downtown"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Organization Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-border rounded px-3 py-2 bg-background"
              >
                <option value="restaurant">Restaurant</option>
                <option value="grocery">Grocery Store</option>
                <option value="bakery">Bakery</option>
                <option value="catering">Catering</option>
                <option value="farm">Farm</option>
                <option value="other">Other Food Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main Street, City, State"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Average Daily Food Capacity (kg)</label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder="100"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register Organization'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
