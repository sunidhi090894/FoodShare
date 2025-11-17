'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Leaf, LogOut, Menu, X, Home, Plus, BarChart3, Users, MapPin, Settings } from 'lucide-react'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole] = useState('donor')

  const menuItems = [
    { icon: Home, label: 'Overview', href: '#' },
    { icon: Plus, label: 'Post Surplus', href: '#' },
    { icon: MapPin, label: 'Active Matches', href: '#' },
    { icon: BarChart3, label: 'Analytics', href: '#' },
    { icon: Users, label: 'Network', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' }
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-card border-r border-border transition-all duration-300 overflow-hidden`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-2 mb-8">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">FoodShare</span>
          </div>
          <nav className="flex-1 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground transition"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground/70 hover:text-foreground"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/70">john@restaurant.com</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl space-y-6">
            {/* Welcome */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome to FoodShare</h1>
              <p className="text-foreground/70">Manage your surplus food, track impact, and connect with the community</p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Surplus Posted', value: '12', unit: 'items' },
                { label: 'Matches', value: '8', unit: 'active' },
                { label: 'Meals Shared', value: '240', unit: 'servings' },
                { label: 'Carbon Saved', value: '48', unit: 'kg CO2' }
              ].map((stat, idx) => (
                <Card key={idx} className="p-4 border border-border">
                  <p className="text-foreground/70 text-sm mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{stat.value}</span>
                    <span className="text-foreground/60 text-sm">{stat.unit}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { type: 'match', text: 'Matched with Community Kitchen - 20 servings', time: '2 hours ago' },
                  { type: 'posted', text: 'Posted fresh vegetables - 15 lbs available', time: '4 hours ago' },
                  { type: 'delivery', text: 'Pickup completed by volunteer James', time: '1 day ago' }
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                    <p className="text-foreground/80">{activity.text}</p>
                    <span className="text-xs text-foreground/60">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button className="h-16 text-base">
                <Plus className="w-5 h-5 mr-2" />
                Post New Surplus
              </Button>
              <Button variant="outline" className="h-16 text-base">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Full Analytics
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
