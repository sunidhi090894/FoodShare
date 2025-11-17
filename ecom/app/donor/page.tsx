'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, MapPin, Clock, Users, TrendingUp, LogOut, Menu, X } from 'lucide-react'

interface Organization {
  _id: string
  name: string
  type: string
  address: string
  activeOffers: number
}

interface SurplusOffer {
  _id: string
  itemType: string
  quantity: number
  unit: string
  description: string
  status: string
  expiryTime: string
  pickupLocation: string
}

export default function DonorPortal() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [showNewOffer, setShowNewOffer] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [formData, setFormData] = useState({
    itemType: '',
    quantity: '',
    unit: 'kg',
    description: '',
    expiryTime: ''
  })

  useEffect(() => {
    fetchOrganizations()
    fetchOffers()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations')
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data)
        if (data.length > 0) setSelectedOrg(data[0]._id)
      }
    } catch (error) {
      console.log('[v0] Error fetching organizations:', error)
    }
  }

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/surplus')
      if (res.ok) {
        const data = await res.json()
        setSurplusOffers(data)
      }
    } catch (error) {
      console.log('[v0] Error fetching offers:', error)
    }
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          ...formData,
          pickupLocation: 'Organization Address',
          latitude: 40.7128,
          longitude: -74.0060
        })
      })
      if (res.ok) {
        setFormData({ itemType: '', quantity: '', unit: 'kg', description: '', expiryTime: '' })
        setShowNewOffer(false)
        fetchOffers()
      }
    } catch (error) {
      console.log('[v0] Error submitting offer:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Donor Portal</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground hover:text-primary font-medium">
              <Plus className="w-4 h-4" /> New Offer
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <MapPin className="w-4 h-4" /> My Locations
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Users className="w-4 h-4" /> Matches
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <TrendingUp className="w-4 h-4" /> Impact
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : ''} transition-all duration-300`}>
        <header className="border-b border-border bg-background p-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-2xl font-bold">Surplus Management</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Active Offers</p>
              <p className="text-4xl font-bold text-primary">{surplusOffers.filter(o => o.status === 'available').length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Matched</p>
              <p className="text-4xl font-bold text-accent">{surplusOffers.filter(o => o.status === 'matched').length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Completed</p>
              <p className="text-4xl font-bold text-primary">{surplusOffers.filter(o => o.status === 'completed').length}</p>
            </Card>
          </div>

          {/* Organization Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Select Organization</h2>
            <div className="flex gap-4 flex-wrap">
              {organizations.map(org => (
                <Button
                  key={org._id}
                  onClick={() => setSelectedOrg(org._id)}
                  variant={selectedOrg === org._id ? 'default' : 'outline'}
                >
                  {org.name}
                </Button>
              ))}
              <Link href="/donor/organization">
                <Button variant="outline" className="border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Add Organization
                </Button>
              </Link>
            </div>
          </div>

          {/* New Offer Form */}
          {showNewOffer && (
            <Card className="p-8 mb-8 border border-border">
              <h3 className="text-xl font-bold mb-6">Post New Surplus Offer</h3>
              <form onSubmit={handleSubmitOffer} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Type</label>
                    <Input
                      value={formData.itemType}
                      onChange={(e) => setFormData({...formData, itemType: e.target.value})}
                      placeholder="e.g., Fresh Vegetables"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0"
                        required
                      />
                      <select className="px-3 py-2 border border-border rounded bg-background">
                        <option>kg</option>
                        <option>lbs</option>
                        <option>units</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Details about the food..."
                    className="w-full border border-border rounded px-3 py-2 bg-background"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.expiryTime}
                    onChange={(e) => setFormData({...formData, expiryTime: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" className="w-full">Post Offer</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewOffer(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {!showNewOffer && (
            <Button onClick={() => setShowNewOffer(true)} size="lg" className="mb-8 w-full">
              <Plus className="w-4 h-4 mr-2" /> Post New Surplus Offer
            </Button>
          )}

          {/* Offers List */}
          <h2 className="text-xl font-bold mb-6">Your Surplus Offers</h2>
          <div className="grid gap-6">
            {surplusOffers.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <p className="text-foreground/70 mb-4">No surplus offers yet</p>
                <Button onClick={() => setShowNewOffer(true)}>Create Your First Offer</Button>
              </Card>
            ) : (
              surplusOffers.map(offer => (
                <Card key={offer._id} className="p-6 border border-border hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{offer.itemType}</h3>
                      <p className="text-foreground/70 mb-3">{offer.quantity} {offer.unit}</p>
                      <p className="text-sm text-foreground/60 mb-4">{offer.description}</p>
                      <div className="flex gap-6 text-sm text-foreground/70">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(offer.expiryTime).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {offer.pickupLocation}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        offer.status === 'available' ? 'bg-green-100 text-green-700' :
                        offer.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
