'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Check, X, LogOut, Menu } from 'lucide-react'

interface SurplusOffer {
  _id: string
  itemType: string
  quantity: number
  unit: string
  description: string
  pickupLocation: string
  expiryTime: string
  organizationId: string
}

interface Match {
  _id: string
  surplusId: string
  quantity: number
  status: string
  createdAt: string
}

export default function RecipientPortal() {
  const [availableOffers, setAvailableOffers] = useState<SurplusOffer[]>([])
  const [myMatches, setMyMatches] = useState<Match[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [latitude, setLatitude] = useState(40.7128)
  const [longitude, setLongitude] = useState(-74.0060)
  const [radius, setRadius] = useState(5)

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
      })
    }
    fetchOffers()
    fetchMatches()
  }, [])

  useEffect(() => {
    if (latitude && longitude) {
      fetchOffers()
    }
  }, [radius])

  const fetchOffers = async () => {
    try {
      const res = await fetch(`/api/surplus?status=available&latitude=${latitude}&longitude=${longitude}&radius=${radius}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableOffers(data)
      }
    } catch (error) {
      console.log('[v0] Error fetching offers:', error)
    }
  }

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches')
      if (res.ok) {
        const data = await res.json()
        setMyMatches(data)
      }
    } catch (error) {
      console.log('[v0] Error fetching matches:', error)
    }
  }

  const handleRequestMatch = async (surplusId: string) => {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surplusId,
          recipientId: 'current-user',
          quantity: 1
        })
      })
      if (res.ok) {
        fetchMatches()
        fetchOffers()
      }
    } catch (error) {
      console.log('[v0] Error requesting match:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Recipient Portal</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <MapPin className="w-4 h-4" /> Browse Surplus
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Check className="w-4 h-4" /> My Requests
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Clock className="w-4 h-4" /> Scheduled
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : ''} transition-all duration-300`}>
        <header className="border-b border-border bg-background p-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Browse Available Food</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          {/* Filter Controls */}
          <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-border">
            <h3 className="font-semibold mb-4">Search Near You</h3>
            <div className="flex gap-4 flex-wrap items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Search Radius (km)</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="px-3 py-2 border border-border rounded bg-background"
                >
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                </select>
              </div>
              <Button onClick={fetchOffers}>Update Search</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Available Offers</p>
              <p className="text-4xl font-bold text-primary">{availableOffers.length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">My Requests</p>
              <p className="text-4xl font-bold text-accent">{myMatches.length}</p>
            </Card>
          </div>

          {/* Offers Grid */}
          <h2 className="text-xl font-bold mb-6">Available Surplus Nearby</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableOffers.length === 0 ? (
              <Card className="p-12 col-span-full text-center border border-border">
                <p className="text-foreground/70">No available surplus in your area</p>
              </Card>
            ) : (
              availableOffers.map(offer => (
                <Card key={offer._id} className="p-6 border border-border hover:shadow-lg transition flex flex-col">
                  <h3 className="font-bold text-lg text-foreground mb-2">{offer.itemType}</h3>
                  <p className="text-sm text-foreground/70 mb-4">Quantity: {offer.quantity} {offer.unit}</p>
                  <p className="text-sm text-foreground/70 mb-4 flex-1">{offer.description}</p>
                  <div className="space-y-2 mb-4 text-xs text-foreground/60">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Available until {new Date(offer.expiryTime).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {offer.pickupLocation}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRequestMatch(offer._id)}
                    className="w-full"
                  >
                    Request This Food
                  </Button>
                </Card>
              ))
            )}
          </div>

          {/* My Requests */}
          <h2 className="text-xl font-bold mt-12 mb-6">My Requests</h2>
          <div className="grid gap-6">
            {myMatches.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <p className="text-foreground/70">No active requests yet</p>
              </Card>
            ) : (
              myMatches.map(match => (
                <Card key={match._id} className="p-6 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold mb-2">Request #{match._id.toString().slice(0, 8)}</h3>
                      <p className="text-sm text-foreground/70">Quantity: {match.quantity}</p>
                      <p className="text-sm text-foreground/70">Requested: {new Date(match.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      match.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      match.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </span>
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
