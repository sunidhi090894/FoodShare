'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Award, LogOut, Menu, Check, AlertCircle } from 'lucide-react'

interface Delivery {
  _id: string
  matchId: string
  status: string
  estimatedTime: string
  createdAt: string
  location: { latitude: number; longitude: number }
}

export default function VolunteerPortal() {
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([])
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({ completed: 0, meals: 0, hours: 0 })

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries')
      if (res.ok) {
        const data = await res.json()
        setMyDeliveries(data.filter((d: any) => d.status !== 'completed'))
      }
    } catch (error) {
      console.log('[v0] Error fetching deliveries:', error)
    }
  }

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          status: 'assigned'
        })
      })
      if (res.ok) {
        fetchDeliveries()
      }
    } catch (error) {
      console.log('[v0] Error accepting delivery:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Volunteer Portal</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <MapPin className="w-4 h-4" /> Find Deliveries
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Check className="w-4 h-4" /> My Deliveries
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Award className="w-4 h-4" /> Impact
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
          <h1 className="text-2xl font-bold">Delivery Opportunities</h1>
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
              <p className="text-foreground/70 mb-2">Deliveries Completed</p>
              <p className="text-4xl font-bold text-primary">{stats.completed}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Meals Delivered</p>
              <p className="text-4xl font-bold text-accent">{stats.meals}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Hours Contributed</p>
              <p className="text-4xl font-bold text-primary">{stats.hours}</p>
            </Card>
          </div>

          {/* Available Deliveries */}
          <h2 className="text-xl font-bold mb-6">Available Delivery Routes</h2>
          <div className="grid gap-6 mb-12">
            {availableDeliveries.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70">Check back soon for new delivery opportunities</p>
              </Card>
            ) : (
              availableDeliveries.map(delivery => (
                <Card key={delivery._id} className="p-6 border border-border hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3">Delivery Route</h3>
                      <div className="space-y-2 text-sm text-foreground/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Pickup & Delivery Available
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Est. Time: {new Date(delivery.estimatedTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleAcceptDelivery(delivery._id)}>
                      Accept Delivery
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* My Deliveries */}
          <h2 className="text-xl font-bold mb-6">My Active Deliveries</h2>
          <div className="grid gap-6">
            {myDeliveries.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <p className="text-foreground/70">No active deliveries</p>
              </Card>
            ) : (
              myDeliveries.map(delivery => (
                <Card key={delivery._id} className="p-6 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold mb-2">Delivery #{delivery._id.toString().slice(0, 8)}</h3>
                      <p className="text-sm text-foreground/70">{new Date(delivery.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      delivery.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
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
