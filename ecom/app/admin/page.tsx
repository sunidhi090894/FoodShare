'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarChart3, Users, AlertCircle, TrendingUp, LogOut, Menu, X } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  activeOffers: number
  completedMatches: number
  totalMeals: number
  totalWaste: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    activeOffers: 0,
    completedMatches: 0,
    totalMeals: 0,
    totalWaste: 0
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // In production, fetch from API
    setStats({
      totalUsers: 1250,
      totalOrganizations: 148,
      activeOffers: 342,
      completedMatches: 1892,
      totalMeals: 156400,
      totalWaste: 24550
    })
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Admin Dashboard</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <BarChart3 className="w-4 h-4" /> Overview
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Users className="w-4 h-4" /> Users
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <AlertCircle className="w-4 h-4" /> Flagged Items
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <TrendingUp className="w-4 h-4" /> Reports
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
          <h1 className="text-2xl font-bold">System Overview</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          {/* Key Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Total Users</p>
              <p className="text-4xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Organizations</p>
              <p className="text-4xl font-bold text-accent">{stats.totalOrganizations}</p>
            </Card>
            <Card className="p-6 border border-border">
              <p className="text-foreground/70 mb-2">Active Offers</p>
              <p className="text-4xl font-bold text-primary">{stats.activeOffers}</p>
            </Card>
          </div>

          {/* Impact Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border border-border bg-green-50/50">
              <p className="text-foreground/70 mb-2">Completed Matches</p>
              <p className="text-4xl font-bold text-green-600">{stats.completedMatches.toLocaleString()}</p>
            </Card>
            <Card className="p-6 border border-border bg-blue-50/50">
              <p className="text-foreground/70 mb-2">Total Meals Delivered</p>
              <p className="text-4xl font-bold text-blue-600">{stats.totalMeals.toLocaleString()}</p>
            </Card>
            <Card className="p-6 border border-border bg-purple-50/50">
              <p className="text-foreground/70 mb-2">Food Waste Reduced (kg)</p>
              <p className="text-4xl font-bold text-purple-600">{stats.totalWaste.toLocaleString()}</p>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <h2 className="text-xl font-bold mb-6">System Health</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border border-border">
              <h3 className="font-bold mb-4">Network Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Average Match Time</span>
                  <span className="font-semibold">12 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Success Rate</span>
                  <span className="font-semibold text-green-600">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Active Volunteers</span>
                  <span className="font-semibold">524</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="font-bold mb-4">Flagged Items</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Under Review</span>
                  <span className="font-semibold bg-yellow-100 px-2 py-1 rounded text-yellow-700">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Unverified Donors</span>
                  <span className="font-semibold bg-orange-100 px-2 py-1 rounded text-orange-700">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Quality Issues</span>
                  <span className="font-semibold bg-red-100 px-2 py-1 rounded text-red-700">1</span>
                </div>
              </div>
            </Card>
          </div>

          {/* User Management */}
          <h2 className="text-xl font-bold mt-12 mb-6">Recent Users</h2>
          <Card className="p-6 border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">User</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Pizza Hut Boston', role: 'Donor', status: 'Verified', joined: '2025-01-10' },
                  { name: 'Community Food Bank', role: 'Recipient', status: 'Verified', joined: '2025-01-08' },
                  { name: 'John Volunteer', role: 'Volunteer', status: 'Active', joined: '2025-01-15' },
                ].map((user, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.role}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/70">{user.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </main>
      </div>
    </div>
  )
}
