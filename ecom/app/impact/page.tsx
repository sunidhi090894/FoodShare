'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, Leaf, Users, LogOut, Menu } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ImpactData {
  mealServed: number
  wasteReduced: number
  carbonSaved: number
  costSaved: number
}

const chartData = [
  { month: 'Jan', meals: 240, waste: 45, carbon: 180 },
  { month: 'Feb', meals: 380, waste: 72, carbon: 288 },
  { month: 'Mar', meals: 520, waste: 95, carbon: 380 },
  { month: 'Apr', meals: 890, waste: 162, carbon: 648 },
  { month: 'May', meals: 1240, waste: 224, carbon: 896 },
  { month: 'Jun', meals: 1890, waste: 342, carbon: 1368 }
]

const pieData = [
  { name: 'Restaurants', value: 45 },
  { name: 'Grocery Stores', value: 30 },
  { name: 'Bakeries', value: 15 },
  { name: 'Other', value: 10 }
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

export default function ImpactDashboard() {
  const [impact, setImpact] = useState<ImpactData>({
    mealServed: 1890,
    wasteReduced: 342,
    carbonSaved: 1368,
    costSaved: 4725
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchImpactData()
  }, [])

  const fetchImpactData = async () => {
    try {
      const res = await fetch('/api/impact')
      if (res.ok) {
        const data = await res.json()
        setImpact(data)
      }
    } catch (error) {
      console.log('[v0] Error fetching impact data:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Impact Dashboard</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <BarChart3 className="w-4 h-4" /> Overview
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <TrendingUp className="w-4 h-4" /> Trends
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <Users className="w-4 h-4" /> Contributors
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
          <h1 className="text-2xl font-bold">Community Impact</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 border border-border bg-blue-50/50">
              <p className="text-foreground/70 mb-2 text-sm">Meals Served</p>
              <p className="text-4xl font-bold text-blue-600">{impact.mealServed.toLocaleString()}</p>
              <p className="text-xs text-foreground/60 mt-2">Servings across community</p>
            </Card>
            <Card className="p-6 border border-border bg-green-50/50">
              <p className="text-foreground/70 mb-2 text-sm">Waste Reduced</p>
              <p className="text-4xl font-bold text-green-600">{impact.wasteReduced.toLocaleString()}kg</p>
              <p className="text-xs text-foreground/60 mt-2">Food waste prevented</p>
            </Card>
            <Card className="p-6 border border-border bg-purple-50/50">
              <p className="text-foreground/70 mb-2 text-sm">CO2 Saved</p>
              <p className="text-4xl font-bold text-purple-600">{impact.carbonSaved.toLocaleString()}kg</p>
              <p className="text-xs text-foreground/60 mt-2">Carbon emissions reduced</p>
            </Card>
            <Card className="p-6 border border-border bg-orange-50/50">
              <p className="text-foreground/70 mb-2 text-sm">Cost Saved</p>
              <p className="text-4xl font-bold text-orange-600">${(impact.costSaved / 1000).toFixed(1)}k</p>
              <p className="text-xs text-foreground/60 mt-2">Community value created</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart */}
            <Card className="p-6 border border-border">
              <h3 className="font-bold text-lg mb-6">Impact Trend (Last 6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="meals" stroke="#10b981" name="Meals Served" />
                  <Line type="monotone" dataKey="waste" stroke="#3b82f6" name="Waste Reduced (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Pie Chart */}
            <Card className="p-6 border border-border">
              <h3 className="font-bold text-lg mb-6">Contributors by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Bar Chart */}
            <Card className="p-6 border border-border lg:col-span-2">
              <h3 className="font-bold text-lg mb-6">Monthly Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="meals" fill="#10b981" name="Meals Served" />
                  <Bar dataKey="carbon" fill="#8b5cf6" name="CO2 Saved (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border border-border">
              <h3 className="font-bold mb-4">Average Per Donation</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Meals</span>
                  <span className="font-semibold">156 servings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Waste Reduced</span>
                  <span className="font-semibold">34.2kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">People Helped</span>
                  <span className="font-semibold">12 individuals</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="font-bold mb-4">Network Growth</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Active Donors</span>
                  <span className="font-semibold text-green-600">↑ 148</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Recipients</span>
                  <span className="font-semibold text-green-600">↑ 287</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Volunteers</span>
                  <span className="font-semibold text-green-600">↑ 524</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="font-bold mb-4">Environmental Impact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Trees Saved</span>
                  <span className="font-semibold">~45 trees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Water Saved</span>
                  <span className="font-semibold">~2.1M liters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Landfill Reduced</span>
                  <span className="font-semibold">~342 tons</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
