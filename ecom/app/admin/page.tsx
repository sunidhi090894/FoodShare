"use client"

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  Utensils,
  UserCheck,
  Leaf,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { AaharSetuLogo } from '@/components/ui/logo'

interface User {
  _id: string
  name: string
  email: string
  role: string
  organization?: string
}

interface VolunteerAssignment {
  _id: string
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED'
  donorOrg: string
  items: string
  donorCity: string
}

const initialPendingOrgs: any[] = []

export default function AdminDataPage() {
  useProtectedRoute('ADMIN')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalMealsRescued, setTotalMealsRescued] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        // Fetch users
        const usersRes = await fetch('/api/admin/users')
        if (!usersRes.ok) {
          throw new Error('Failed to fetch users')
        }
        const userData = await usersRes.json()
        setUsers(userData)

        // Calculate total meals rescued from all completed volunteer assignments
        try {
          const response = await fetch('/api/volunteer-assignments')
          if (response.ok) {
            const assignments: VolunteerAssignment[] = await response.json()
            // Count completed assignments and calculate meals
            const meals = assignments
              .filter(a => a.status === 'COMPLETED')
              .reduce((total, assignment) => {
                // Parse items string to extract quantities
                // Example: "10 kg Biryani, 5 kg Rice"
                const quantities = (assignment.items.match(/\d+/g) || []).map(Number)
                const itemMeals = quantities.reduce((sum, qty) => sum + Math.round(qty * 2.2), 0)
                return total + itemMeals
              }, 0)
            setTotalMealsRescued(meals)
          }
        } catch (err) {
          console.error('Failed to fetch volunteer assignments:', err)
        }
      } catch (err: any) {
        setError(err.message || 'Error loading data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate actual counts from users array
  const donorCount = users.filter(u => u.role === 'DONOR').length
  const recipientCount = users.filter(u => u.role === 'RECIPIENT').length
  const volunteerCount = users.filter(u => u.role === 'VOLUNTEER').length

  const summaryCards = [
    {
      label: 'Total Meals Rescued',
      value: totalMealsRescued.toLocaleString(),
      helper: 'From all completed deliveries',
      icon: Utensils,
    },
    {
      label: 'Active Donors / Recipients / Volunteers',
      value: `${donorCount} / ${recipientCount} / ${volunteerCount}`,
      helper: 'Active organizations',
      icon: Users,
    },
    {
      label: 'CO₂ Saved Total',
      value: `${Math.round(totalMealsRescued * 1.8 / 2.2)} kg`,
      helper: '1 kg food = 1.8 kg CO₂ avoided',
      icon: Leaf,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-[#8c3b3c] shrink-0" />
              <span className="font-bold text-xl text-[#4a1f1f]">AaharSetu</span>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-[#4a1f1f]">
                Admin Dashboard
              </h1>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg md:text-xl text-[#4a1f1f]">
              Monitor the entire AaharSetu network
            </h2>
            <p className="text-[#6b4d3c] max-w-3xl mx-auto mt-2">
              Oversee donors, recipients, volunteers, and track overall impact metrics.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="p-5 border border-[#d9c7aa] bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-[#6b4d3c]">
                  {card.label}
                  <Icon className="w-4 h-4 text-[#8c3b3c]" />
                </div>
                <p className="text-3xl font-semibold text-[#4a1f1f]">{card.value}</p>
                <p className="text-sm text-[#6b4d3c]">{card.helper}</p>
              </Card>
            )
          })}
        </div>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-[#8c3b3c]" />
            <h2 className="text-xl font-semibold text-[#4a1f1f]">Users Overview</h2>
          </div>
          {loading && <p className="text-[#6b4d3c]">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-sm text-[#6b4d3c]">
                  <tr>
                    <th className="border-b p-2">Name</th>
                    <th className="border-b p-2">Email</th>
                    <th className="border-b p-2">Role</th>
                    <th className="border-b p-2">Organization</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#4a1f1f]">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="border-b p-2">{user.name}</td>
                      <td className="border-b p-2">{user.email}</td>
                      <td className="border-b p-2">
                        <Badge variant="outline">{user.role}</Badge>
                      </td>
                      <td className="border-b p-2">{user.organization || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
