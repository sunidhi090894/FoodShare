"use client"

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  Utensils,
  Activity,
  ClipboardList,
  Download,
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

interface PendingOrganization {
  id: string
  name: string
  type: 'Donor' | 'Recipient'
  city: string
  submittedBy: string
  documents: string[]
}

interface SurplusRow {
  id: string
  donor: string
  city: string
  items: string
  status: 'OPEN' | 'MATCHED' | 'EXPIRED'
  expiry: string
  expiryRisk: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface RequestRow {
  id: string
  recipient: string
  surplus: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface VolunteerNeed {
  id: string
  donorLocation: string
  recipientLocation: string
  window: string
  volunteers: string[]
}

const initialPendingOrgs: PendingOrganization[] = [
  {
    id: 'ORG-120',
    name: 'Sunrise Café',
    type: 'Donor',
    city: 'Mumbai',
    submittedBy: 'anika@sunrise.com',
    documents: ['GST certificate', 'FSSAI license'],
  },
  {
    id: 'ORG-121',
    name: 'City Hope Shelter',
    type: 'Recipient',
    city: 'Hyderabad',
    submittedBy: 'rahul@cityhope.org',
    documents: ['12A certificate'],
  },
]

const surplusMonitoring: SurplusRow[] = [
  {
    id: 'FS-4821',
    donor: 'Spice Route Café',
    city: 'Mumbai',
    items: 'Biryani trays (30)',
    status: 'OPEN',
    expiry: 'Today · 6:00 PM',
    expiryRisk: 'MEDIUM',
  },
  {
    id: 'FS-4818',
    donor: 'Night Owl Bakery',
    city: 'Delhi',
    items: 'Pastries (25)',
    status: 'MATCHED',
    expiry: 'Pickup 8:00 PM',
    expiryRisk: 'LOW',
  },
  {
    id: 'FS-4801',
    donor: 'Fresh Greens',
    city: 'Pune',
    items: 'Salad bowls (18)',
    status: 'EXPIRED',
    expiry: 'Expired 10:00 AM',
    expiryRisk: 'HIGH',
  },
]

const requestsMonitoring: RequestRow[] = [
  { id: 'REQ-901', recipient: 'Hope Shelter', surplus: 'Biryani trays', status: 'PENDING' },
  { id: 'REQ-880', recipient: 'Care Foundation', surplus: 'Salad bowls', status: 'APPROVED' },
  { id: 'REQ-812', recipient: 'Night Shelter', surplus: 'Pastry boxes', status: 'REJECTED' },
]

const expiryRiskVariant: Record<'LOW' | 'MEDIUM' | 'HIGH', 'success' | 'warning' | 'destructive'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'destructive',
}

export default function AdminDataPage() {
  useProtectedRoute('ADMIN')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingOrgs, setPendingOrgs] = useState(initialPendingOrgs)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/admin/users')
        if (!res.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await res.json()
        setUsers(data)
      } catch (err: any) {
        setError(err.message || 'Error loading users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleOrgDecision = (orgId: string) => {
    setPendingOrgs((prev) => prev.filter((org) => org.id !== orgId))
  }

  // Calculate actual counts from users array and other data
  const donorCount = users.filter(u => u.role === 'DONOR').length
  const recipientCount = users.filter(u => u.role === 'RECIPIENT').length
  const volunteerCount = users.filter(u => u.role === 'VOLUNTEER').length
  const pendingOrgCount = pendingOrgs.length

  // Calculate meals from surplus monitoring (matched offers)
  const mealsRescued = surplusMonitoring
    .filter(s => s.status === 'MATCHED')
    .reduce((total, s) => {
      const quantity = parseInt(s.items.match(/\d+/)?.[0] || '0')
      return total + Math.round(quantity * 2.2) // 1kg = 2.2 meals
    }, 0)

  // Count today's surplus offers
  const todaySurplusCount = surplusMonitoring.filter(s => s.status === 'OPEN').length

  const summaryCards = [
    {
      label: 'Total Meals Rescued',
      value: mealsRescued.toLocaleString(),
      helper: 'From completed deliveries',
      icon: Utensils,
    },
    {
      label: 'Active Donors / Recipients / Volunteers',
      value: `${donorCount} / ${recipientCount} / ${volunteerCount}`,
      helper: 'Active organizations',
      icon: Users,
    },
    {
      label: 'Surplus Offers Today',
      value: todaySurplusCount.toString(),
      helper: 'Posted today',
      icon: Activity,
    },
    {
      label: 'CO₂ Saved This Month',
      value: '12.4 tons',
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
              Approve organizations, oversee surplus, coordinate volunteers, and keep impact analytics up to date.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Pending Approvals</h2>
              <p className="text-sm text-[#6b4d3c]">Review new organizations and role change requests.</p>
            </div>
            <Badge variant="secondary">{pendingOrgs.length} awaiting review</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrgs.map((org) => (
              <Card key={org.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{org.id}</p>
                    <h3 className="text-lg font-semibold text-[#4a1f1f]">{org.name}</h3>
                  </div>
                  <Badge variant="outline">{org.type}</Badge>
                </div>
                <p className="text-sm text-[#6b4d3c]">
                  {org.city} • Submitted by {org.submittedBy}
                </p>
                <ul className="text-sm text-[#6b4d3c] list-disc pl-4">
                  {org.documents.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30]" onClick={() => handleOrgDecision(org.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleOrgDecision(org.id)}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

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
