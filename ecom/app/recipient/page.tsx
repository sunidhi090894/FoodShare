'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  MapPin,
  Filter,
  Utensils,
  Search,
  Layers,
  Truck,
  Download,
  MessageSquare,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type DietTag = 'VEG' | 'NON_VEG' | 'VEGAN'
type TimeFilter = 'NOW' | 'LATER' | 'TOMORROW'
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'

interface SurplusItem {
  name: string
  quantity: number
  unit: string
  category?: string
  dietaryTags?: string[]
  allergenTags?: string[]
}

interface SurplusOffer {
  id: string
  createdByUserId: string
  items: SurplusItem[]
  pickupWindowStart: string
  pickupWindowEnd: string
  pickupAddress: string
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
  expiryDateTime: string
  totalWeightKg?: number
  organization?: {
    name: string
    city?: string
  }
}

interface RecipientRequest {
  id: string
  surplusId: string
  status: RequestStatus
  surplus?: SurplusOffer
}

interface DeliveryRecord {
  id: string
  date: string
  donor: string
  items: string
  meals: number
  feedback?: string
}

const deliveries: DeliveryRecord[] = [
  {
    id: 'DEL-144',
    date: 'Oct 7',
    donor: 'Urban Feast',
    items: 'Veg thali (40 meals)',
    meals: 40,
    feedback: '',
  },
  {
    id: 'DEL-143',
    date: 'Oct 3',
    donor: 'Downtown Café',
    items: 'Soup + bread (32 meals)',
    meals: 32,
    feedback: 'Reached warm and on time.',
  },
]

const impactCards = [
  {
    label: 'Total meals received',
    value: '1,420',
    helper: 'Since onboarding',
    icon: Utensils,
  },
  {
    label: 'Partner donors',
    value: '18',
    helper: 'Active relationships',
    icon: Layers,
  },
]

export default function RecipientPortal() {
  useProtectedRoute('RECIPIENT')
  const [cityFilter, setCityFilter] = useState('All')
  const [dietFilter, setDietFilter] = useState<DietTag | 'ALL'>('ALL')
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({})

  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>([])
  const [requests, setRequests] = useState<RecipientRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load available surplus
        const offersRes = await fetch('/api/surplus/available')
        if (offersRes.ok) {
          const offers = await offersRes.json()
          setSurplusOffers(offers)
        }

        // Load my requests
        const requestsRes = await fetch('/api/requests/my')
        if (requestsRes.ok) {
          const myRequests = await requestsRes.json()
          setRequests(myRequests)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleRequestSurplus = async (offerId: string) => {
    try {
      const res = await fetch(`/api/surplus/${offerId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedQuantity: 1,
          notes: 'Requesting this surplus offer',
        }),
      })

      if (res.ok) {
        // Reload requests
        const requestsRes = await fetch('/api/requests/my')
        if (requestsRes.ok) {
          const myRequests = await requestsRes.json()
          setRequests(myRequests)
        }
        alert('Request submitted successfully!')
      } else {
        const data = await res.json()
        alert(`Failed: ${data.error}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request surplus')
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel request')
    }
  }

  const filteredOffers = useMemo(() => {
    return surplusOffers.filter((offer) => {
      const matchesCity =
        cityFilter === 'All' || offer.organization?.city === cityFilter
      const matchesDiet = dietFilter === 'ALL' || offer.items.some((item) => item.dietaryTags?.includes(dietFilter))
      return matchesCity && matchesDiet && offer.status === 'OPEN'
    })
  }, [surplusOffers, cityFilter, dietFilter])

  const pendingRequestCount = requests.filter((r) => r.status === 'PENDING').length
  const totalMealsThisMonth = 260
  const totalDonations = 45

  const summaryCards: { label: string; value: string; helper: string; icon: LucideIcon }[] = [
    {
      label: 'Available Surplus Nearby',
      value: filteredOffers.length.toString(),
      helper: 'Within service area',
      icon: Search,
    },
    {
      label: 'Pending Requests',
      value: pendingRequestCount.toString(),
      helper: 'Awaiting donor approval',
      icon: Truck,
    },
    {
      label: 'Meals Received This Month',
      value: totalMealsThisMonth.toString(),
      helper: 'Goal: 400 meals',
      icon: Utensils,
    },
    {
      label: 'Total Donations Received',
      value: totalDonations.toString(),
      helper: 'Since joining AaharSetu',
      icon: Layers,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading recipient dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Recipient Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-[#4a1f1f]">
            <MapPin className="w-7 h-7 text-[#8c3b3c]" />
            Discover surplus nearby and request it fast
          </h1>
          <p className="text-[#6b4d3c] max-w-3xl">
            Browse available surplus, request what you need, and track deliveries.
          </p>
        </header>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="p-5 border border-[#d9c7aa] bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm font-medium text-[#6b4d3c]">
                  {card.label}
                  <Icon className="w-4 h-4 text-[#8c3b3c]" />
                </div>
                <p className="text-3xl font-semibold text-[#4a1f1f]">{card.value}</p>
                <p className="text-sm text-[#6b4d3c]">{card.helper}</p>
              </Card>
            )
          })}
        </div>

        {/* Browse Surplus */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Browse Surplus</h2>
              <p className="text-sm text-[#6b4d3c]">Filter by city or dietary preferences.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-[#6b4d3c]" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="All">All cities</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bandra">Bandra</option>
                <option value="Mahim">Mahim</option>
              </select>
              <select
                value={dietFilter}
                onChange={(e) => setDietFilter(e.target.value as DietTag | 'ALL')}
                className="border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">All dietary</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No surplus available right now. Check back soon!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-3">
                  <div>
                    <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{offer.organization?.name || 'Donor'}</p>
                    <h3 className="text-lg font-semibold text-[#4a1f1f]">
                      {offer.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                    </h3>
                  </div>
                  <p className="text-sm text-[#6b4d3c]">{offer.pickupAddress}</p>
                  <p className="text-sm text-[#6b4d3c]">
                    {new Date(offer.pickupWindowStart).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {offer.items.flatMap((i) => i.dietaryTags || []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30] flex-1">
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#8c3b3c] hover:bg-[#732f30] flex-1"
                      onClick={() => handleRequestSurplus(offer.id)}
                    >
                      Request
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* My Requests */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">My Requests</h2>
              <p className="text-sm text-[#6b4d3c]">Track all your surplus requests.</p>
            </div>
            <Truck className="w-5 h-5 text-[#8c3b3c]" />
          </div>

          {requests.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No requests yet. Browse surplus above to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[#6b4d3c]">
                  <tr className="border-b border-[#f0e3d1]">
                    <th className="py-3 font-medium">Surplus</th>
                    <th className="py-3 font-medium">Donor</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3d1]">
                  {requests.map((row) => (
                    <tr key={row.id}>
                      <td className="py-4 text-[#4a1f1f]">
                        {row.surplus?.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                      </td>
                      <td className="py-4 text-[#6b4d3c]">{row.surplus?.organization?.name || 'Unknown'}</td>
                      <td className="py-4">
                        <Badge
                          variant={
                            row.status === 'APPROVED'
                              ? 'success'
                              : row.status === 'FULFILLED'
                                ? 'default'
                                : row.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {row.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleCancelRequest(row.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Delivery & Feedback */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Delivery & Feedback</h2>
              <p className="text-sm text-[#6b4d3c]">
                Leave feedback for completed deliveries.
              </p>
            </div>
            <MessageSquare className="w-5 h-5 text-[#8c3b3c]" />
          </div>

          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border border-dashed border-[#e6d2b8] rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{delivery.date}</p>
                    <h3 className="text-lg font-semibold text-[#4a1f1f]">{delivery.items}</h3>
                  </div>
                  <Badge variant="secondary">{delivery.meals} meals</Badge>
                </div>
                <p className="text-sm text-[#6b4d3c]">
                  Donor: {delivery.donor}
                </p>
                <textarea
                  value={feedbackDraft[delivery.id] ?? delivery.feedback ?? ''}
                  onChange={(e) =>
                    setFeedbackDraft((prev) => ({ ...prev, [delivery.id]: e.target.value }))
                  }
                  placeholder="Add feedback or notes..."
                  className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
                />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                    Save Feedback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Org Profile */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Org Profile</h2>
              <p className="text-sm text-[#6b4d3c]">
                Keep your organization details up to date.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              Edit organization
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Organization</p>
              <h3 className="text-lg font-semibold text-[#4a1f1f]">Hope Shelter Trust</h3>
              <p className="text-sm text-[#6b4d3c]">Bandra East, Mumbai · +91 90000 12345</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Verification status</p>
              <div className="flex items-center gap-2">
                <Badge variant="success">Verified</Badge>
                <span className="text-sm text-[#6b4d3c]">Renewed Sep 2024</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Storage capability</p>
              <p className="font-medium text-[#4a1f1f]">Cold fridge · Freezer · Dry pantry</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Operating hours</p>
              <p className="font-medium text-[#4a1f1f]">Mon – Sat · 9:00 AM – 9:00 PM</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Building2 className="w-4 h-4 mr-2" />
              Update address
            </Button>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Manage verification
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
