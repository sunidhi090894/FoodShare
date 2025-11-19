"use client"

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  Utensils,
  Activity,
  ClipboardList,
  MapPin,
  Truck,
  Download,
  Settings,
  UserCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProtectedRoute } from '@/hooks/use-protected-route'

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

const volunteerNeeds: VolunteerNeed[] = [
  {
    id: 'TASK-4821',
    donorLocation: 'Bandra West',
    recipientLocation: 'Bandra East',
    window: '2:00 – 4:00 PM',
    volunteers: ['Aisha (3 km away)', 'Vikram (5 km away)'],
  },
  {
    id: 'TASK-4823',
    donorLocation: 'Koramangala',
    recipientLocation: 'Indiranagar',
    window: '7:00 – 8:30 PM',
    volunteers: ['Meera (Available 6-9 PM)'],
  },
]

const heatmapInsight = {
  surplusHotspots: ['Bandra West', 'Lower Parel'],
  demandHotspots: ['Kurla', 'Thane'],
  summary: 'South Mumbai shows 20% more predicted surplus than demand; Central suburbs need extra donor outreach.',
}

const policySimulation = {
  pickupWindowGain: '+6% fulfilled offers if window extends by 30 min',
  volunteerGain: '+9% fulfillment when volunteer pool grows 20%',
}

const matchingInsights = [
  'Distance under 3 km increases fulfillment likelihood by 28%',
  'Pickup windows over 60 min reduce expiries by 17%',
  'Cold-storage match is the top driver for perishable offers',
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

  const summaryCards = [
    {
      label: 'Total Meals Rescued',
      value: '12,480',
      helper: '+8% vs last month',
      icon: Utensils,
    },
    {
      label: 'Active Donors / Recipients / Volunteers',
      value: '64 / 72 / 210',
      helper: '4 orgs pending verification',
      icon: Users,
    },
    {
      label: 'Surplus Offers Today',
      value: '38',
      helper: '12 need matching support',
      icon: Activity,
    },
    {
      label: 'Pickup Success Rate',
      value: '94%',
      helper: 'Goal ≥ 92%',
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Admin Control Panel</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#4a1f1f]">Monitor the entire AaharSetu network</h1>
          <p className="text-[#6b4d3c] max-w-3xl">
            Approve organizations, oversee surplus, coordinate volunteers, and keep impact analytics up to date.
          </p>
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

        <Card className="p-6 border border-[#d9c7aa] bg-[#fffdf9] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Demand – Supply Heatmap</h2>
              <p className="text-sm text-[#6b4d3c]">{heatmapInsight.summary}</p>
            </div>
            <Badge variant="secondary">Forecasted</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-[#6b4d3c]">
            <div>
              <p className="uppercase text-xs tracking-wide text-[#8c3b3c]">Surplus hotspots</p>
              <p>{heatmapInsight.surplusHotspots.join(', ')}</p>
            </div>
            <div>
              <p className="uppercase text-xs tracking-wide text-[#8c3b3c]">Demand hotspots</p>
              <p>{heatmapInsight.demandHotspots.join(', ')}</p>
            </div>
          </div>
        </Card>

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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Surplus Management</h2>
                <p className="text-sm text-[#6b4d3c]">Track every surplus offer and force close if needed.</p>
              </div>
              <ClipboardList className="w-5 h-5 text-[#8c3b3c]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[#6b4d3c]">
                  <tr>
                    <th className="py-2 font-medium">Donor org</th>
                    <th className="py-2 font-medium">City</th>
                    <th className="py-2 font-medium">Items</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Expiry risk</th>
                    <th className="py-2 font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3d1]">
                  {surplusMonitoring.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3">
                        <p className="font-medium text-[#4a1f1f]">{row.donor}</p>
                        <p className="text-xs text-[#6b4d3c]">#{row.id}</p>
                      </td>
                      <td className="py-3 text-[#6b4d3c]">{row.city}</td>
                      <td className="py-3 text-[#6b4d3c]">{row.items}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            row.status === 'OPEN'
                              ? 'secondary'
                              : row.status === 'MATCHED'
                                ? 'success'
                                : 'warning'
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={expiryRiskVariant[row.expiryRisk]}>
                          {row.expiryRisk === 'LOW' ? 'Low' : row.expiryRisk === 'MEDIUM' ? 'Medium' : 'High'} risk
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-[#6b4d3c]">{row.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Requests Monitoring</h2>
                <p className="text-sm text-[#6b4d3c]">Intervene when donors are inactive or delayed.</p>
              </div>
              <MapPin className="w-5 h-5 text-[#8c3b3c]" />
            </div>
            <div className="space-y-3">
              {requestsMonitoring.map((row) => (
                <div key={row.id} className="border border-[#d9c7aa] rounded-lg p-4 flex flex-col gap-2 bg-[#fffdf9]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{row.id}</p>
                      <p className="font-semibold text-[#4a1f1f]">{row.recipient}</p>
                    </div>
                    <Badge
                      variant={
                        row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'destructive' : 'secondary'
                      }
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#6b4d3c]">Surplus: {row.surplus}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                      Contact donor
                    </Button>
                    <Button size="sm" variant="ghost" className="text-[#8c3b3c] hover:bg-[#f7ebe0]">
                      Reassign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Volunteer Assignment Dashboard</h2>
              <p className="text-sm text-[#6b4d3c]">
                Highlight offers with approved recipients but missing volunteers.
              </p>
            </div>
            <Truck className="w-5 h-5 text-[#8c3b3c]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {volunteerNeeds.map((need) => (
              <Card key={need.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{need.id}</p>
                    <p className="font-semibold text-[#4a1f1f]">
                      {need.donorLocation} → {need.recipientLocation}
                    </p>
                  </div>
                  <Badge variant="warning">{need.window}</Badge>
                </div>
                <p className="text-sm text-[#6b4d3c]">Available volunteers:</p>
                <ul className="text-sm text-[#6b4d3c] list-disc pl-4">
                  {need.volunteers.map((volunteer) => (
                    <li key={volunteer}>{volunteer}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30]">Assign volunteer</Button>
                  <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                    Contact backup
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Policy Simulator</h2>
              <p className="text-sm text-[#6b4d3c]">
                Rapid what-if insights using historical completions and current forecasts.
              </p>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-[#6b4d3c]">
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9]">
              <p className="font-semibold text-[#4a1f1f]">Extend pickup windows +30 min</p>
              <p>{policySimulation.pickupWindowGain}</p>
            </Card>
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9]">
              <p className="font-semibold text-[#4a1f1f]">Add 20% volunteer capacity</p>
              <p>{policySimulation.volunteerGain}</p>
            </Card>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Impact & Analytics</h2>
              <p className="text-sm text-[#6b4d3c]">
                City-wise breakdown and top contributors help inform outreach.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Download className="w-4 h-4" />
              Export report
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9]">
              <p className="text-sm text-[#6b4d3c]">Meals rescued this week</p>
              <p className="text-2xl font-semibold text-[#4a1f1f]">2,340</p>
              <p className="text-xs text-[#6b4d3c]">+6% vs last week</p>
            </Card>
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9]">
              <p className="text-sm text-[#6b4d3c]">CO₂ saved</p>
              <p className="text-2xl font-semibold text-[#4a1f1f]">6.8 tons</p>
              <p className="text-xs text-[#6b4d3c]">Converted via AaharSetu factor</p>
            </Card>
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9]">
              <p className="text-sm text-[#6b4d3c]">Top donor city</p>
              <p className="text-2xl font-semibold text-[#4a1f1f]">Mumbai</p>
              <p className="text-xs text-[#6b4d3c]">42% of this week’s surplus</p>
            </Card>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">System Settings & Policies</h2>
              <p className="text-sm text-[#6b4d3c]">
                Manage conversion factors, notification templates, and administrator accounts.
              </p>
            </div>
            <Settings className="w-5 h-5 text-[#8c3b3c]" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9] space-y-2">
              <p className="text-sm text-[#6b4d3c]">Meal conversion factor</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">1 kg = 2.2 meals</p>
              <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                Update factor
              </Button>
            </Card>
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9] space-y-2">
              <p className="text-sm text-[#6b4d3c]">CO₂ conversion</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">1 kg food = 3.5 kg CO₂</p>
              <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                Update policy
              </Button>
            </Card>
            <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9] space-y-2">
              <p className="text-sm text-[#6b4d3c]">Notification templates</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">7 active automations</p>
              <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                Review templates
              </Button>
            </Card>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-[#fffdf9] space-y-3">
          <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Auto-tuned matching insights</p>
          <ul className="list-disc pl-5 text-sm text-[#6b4d3c] space-y-1">
            {matchingInsights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
