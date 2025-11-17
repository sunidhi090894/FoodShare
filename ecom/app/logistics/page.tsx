'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Truck, Navigation, LogOut, Menu, AlertCircle } from 'lucide-react'

interface Delivery {
  _id: string
  matchId: string
  volunteerId?: string
  status: 'pending' | 'assigned' | 'in_transit' | 'completed'
  estimatedTime: string
  actualTime?: string
  location: { latitude: number; longitude: number }
}

export default function LogisticsPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [routeOptimized, setRouteOptimized] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries')
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data)
      }
    } catch (error) {
      console.log('[v0] Error fetching deliveries:', error)
    }
  }

  const optimizeRoutes = async () => {
    setOptimizing(true)
    try {
      const res = await fetch('/api/route-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveries: deliveries.filter(d => d.status === 'pending' || d.status === 'assigned')
        })
      })
      if (res.ok) {
        const data = await res.json()
        setRouteOptimized(data)
      }
    } catch (error) {
      console.log('[v0] Error optimizing routes:', error)
    } finally {
      setOptimizing(false)
    }
  }

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, status })
      })
      if (res.ok) {
        fetchDeliveries()
      }
    } catch (error) {
      console.log('[v0] Error updating delivery:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'assigned':
        return 'bg-blue-100 text-blue-700'
      case 'in_transit':
        return 'bg-orange-100 text-orange-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Logistics</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <Truck className="w-4 h-4" /> Active Routes
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Navigation className="w-4 h-4" /> Optimize
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Clock className="w-4 h-4" /> History
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
          <h1 className="text-2xl font-bold">Delivery Management</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Total Deliveries</p>
              <p className="text-4xl font-bold text-primary">{deliveries.length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Pending</p>
              <p className="text-4xl font-bold text-orange-600">{deliveries.filter(d => d.status === 'pending').length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">In Transit</p>
              <p className="text-4xl font-bold text-blue-600">{deliveries.filter(d => d.status === 'in_transit').length}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Completed</p>
              <p className="text-4xl font-bold text-green-600">{deliveries.filter(d => d.status === 'completed').length}</p>
            </Card>
          </div>

          {/* Route Optimization */}
          <Card className="p-6 border border-border mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Route Optimization</h3>
                <p className="text-foreground/70">Optimize delivery routes to save time and emissions</p>
              </div>
              <Button onClick={optimizeRoutes} disabled={optimizing}>
                <Navigation className="w-4 h-4 mr-2" />
                {optimizing ? 'Optimizing...' : 'Optimize Routes'}
              </Button>
            </div>
            {routeOptimized && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-900 mb-2">Optimization Results</p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Total Distance</p>
                    <p className="font-bold text-green-900">{routeOptimized.totalDistance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-green-700">Estimated Time</p>
                    <p className="font-bold text-green-900">{routeOptimized.estimatedTime} minutes</p>
                  </div>
                  <div>
                    <p className="text-green-700">Stops</p>
                    <p className="font-bold text-green-900">{routeOptimized.route.length}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Active Deliveries */}
          <h2 className="text-xl font-bold mb-6">Active Deliveries</h2>
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70">No active deliveries</p>
              </Card>
            ) : (
              deliveries.map(delivery => (
                <Card key={delivery._id} className="p-6 border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold mb-2">Delivery #{delivery._id.toString().slice(0, 8)}</h3>
                      <div className="flex gap-6 text-sm text-foreground/70">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Est. {new Date(delivery.estimatedTime).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Coordinates: {delivery.location.latitude.toFixed(4)}, {delivery.location.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {delivery.status === 'pending' && (
                      <Button size="sm" onClick={() => updateDeliveryStatus(delivery._id, 'assigned')}>
                        Assign Volunteer
                      </Button>
                    )}
                    {delivery.status === 'assigned' && (
                      <Button size="sm" onClick={() => updateDeliveryStatus(delivery._id, 'in_transit')}>
                        Mark In Transit
                      </Button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <Button size="sm" onClick={() => updateDeliveryStatus(delivery._id, 'completed')}>
                        Mark Completed
                      </Button>
                    )}
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
