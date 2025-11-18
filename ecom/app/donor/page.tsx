'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Leaf,
  Package,
  Utensils,
  Recycle,
  CheckCircle2,
  ClipboardList,
  MapPin,
  AlertCircle,
  Building2,
  Download,
  Info,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type OfferStatus = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

interface BackendUser {
  name: string | null
  organization?: string | null
  email?: string | null
}

interface ActiveOffer {
  id: string
  summary: string
  pickupWindow: string
  status: OfferStatus
  requestCount: number
  expiresLabel: string
  location: string
  storage: string
  isToday: boolean
  pickupProbability: number
}

interface RequestCard {
  id: string
  offerId: string
  offerSummary: string
  recipient: string
  status: RequestStatus
  distance: string
  city: string
  volunteer?: string | null
  notes?: string
}

interface DonationRecord {
  id: string
  date: string
  items: string
  recipient: string
  meals: number
  co2Saved: number
}

const initialOffers: ActiveOffer[] = [
  {
    id: 'FS-4821',
    summary: 'Biryani (30 plates)',
    pickupWindow: 'Today · 2:00 – 4:00 PM',
    status: 'OPEN',
    requestCount: 3,
    expiresLabel: 'Expires in 4 hours',
    location: 'Bandra West · Mumbai',
    storage: 'Hot meals · insulated pickup required',
    isToday: true,
    pickupProbability: 0.87,
  },
  {
    id: 'FS-4818',
    summary: 'Bakery box (18 assorted pastries)',
    pickupWindow: 'Today · 7:30 – 9:00 PM',
    status: 'MATCHED',
    requestCount: 1,
    expiresLabel: 'Volunteer pickup scheduled 7:30 PM',
    location: 'Lower Parel · Mumbai',
    storage: 'Room temp · store flat',
    isToday: true,
    pickupProbability: 0.62,
  },
  {
    id: 'FS-4790',
    summary: 'Cut fruit (12 kg, chilled)',
    pickupWindow: 'Tomorrow · 10:00 – 11:30 AM',
    status: 'FULFILLED',
    requestCount: 4,
    expiresLabel: 'Fulfilled yesterday • 28 meals',
    location: 'BKC · Mumbai',
    storage: 'Cold chain · refrigerated',
    isToday: false,
    pickupProbability: 0.32,
  },
]

const initialRequests: RequestCard[] = [
  {
    id: 'REQ-901',
    offerId: 'FS-4821',
    offerSummary: 'Biryani (30 plates)',
    recipient: 'Hope Kitchen',
    status: 'PENDING',
    distance: '2.4 km',
    city: 'Bandra East',
    volunteer: null,
    notes: 'Can pick up before 3 PM',
  },
  {
    id: 'REQ-877',
    offerId: 'FS-4821',
    offerSummary: 'Biryani (30 plates)',
    recipient: 'Seva Meals Collective',
    status: 'APPROVED',
    distance: '4.1 km',
    city: 'Mahim',
    volunteer: 'Rahul - +91 90000 11122',
    notes: 'Volunteer confirmed 2:30 PM pickup',
  },
  {
    id: 'REQ-812',
    offerId: 'FS-4818',
    offerSummary: 'Bakery box (18 assorted pastries)',
    recipient: 'Night Shelter Network',
    status: 'PENDING',
    distance: '6.3 km',
    city: 'Worli',
    volunteer: null,
    notes: 'Prefers pickup slot 8:45 PM',
  },
]

const donationHistory: DonationRecord[] = [
  {
    id: 'H-1201',
    date: 'Oct 7',
    items: 'Veg thali trays (45 meals)',
    recipient: 'Shelter One',
    meals: 45,
    co2Saved: 130,
  },
  {
    id: 'H-1194',
    date: 'Oct 3',
    items: 'Salad bowls (28 meals)',
    recipient: 'Care Foundation',
    meals: 28,
    co2Saved: 75,
  },
  {
    id: 'H-1186',
    date: 'Sep 29',
    items: 'Bread & soup (60 meals)',
    recipient: 'Community Kitchens',
    meals: 60,
    co2Saved: 185,
  },
]

const offerStatusVariant: Record<OfferStatus, 'default' | 'success' | 'secondary' | 'warning' | 'destructive'> = {
  OPEN: 'default',
  MATCHED: 'secondary',
  FULFILLED: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'destructive',
}

const requestStatusVariant: Record<RequestStatus, 'default' | 'success' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'default',
}

const probabilityVariant = (value: number): { label: string; variant: 'success' | 'warning' | 'destructive'; warning?: string } => {
  if (value >= 0.75) {
    return { label: `High (${Math.round(value * 100)}%)`, variant: 'success' }
  }
  if (value >= 0.5) {
    return { label: `Medium (${Math.round(value * 100)}%)`, variant: 'warning' }
  }
  return { label: `Low (${Math.round(value * 100)}%)`, variant: 'destructive', warning: 'Low predicted pickup chance — try extending pickup window or posting earlier.' }
}

export default function DonorPage() {
  useProtectedRoute('DONOR')
  const [user, setUser] = useState<BackendUser | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState(initialOffers)
  const [requests, setRequests] = useState(initialRequests)
  const [suggestionApplied, setSuggestionApplied] = useState(false)

  const forecast = {
    range: '18 – 24 kg',
    window: '9:00 – 11:00 PM',
    confidence: 0.82,
    description: 'Based on your past 30 days, day-of-week trends, and upcoming city events.',
  }

  const smartSuggestion = {
    windowStart: '9:00 PM',
    windowEnd: '10:30 PM',
    quantity: '≈20 kg cooked food',
    categories: ['Rice', 'Dal', 'Biryani'],
  }

  const donorInsights = [
    {
      title: 'Top surplus categories',
      detail: 'Bread • Rice • Curry',
    },
    {
      title: 'Most waste day',
      detail: 'Saturday nights spike by 18%',
    },
    {
      title: 'Pickup success rate',
      detail: '82% (highest in your area cluster)',
    },
    {
      title: 'Pattern cluster',
      detail: 'Late-night restaurant donors (9–11 PM surpluses)',
    },
  ]

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) {
          throw new Error('Unable to load your profile.')
        }
        const data = await res.json()
        setUser(data)
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const todayOffers = offers.filter((offer) => offer.isToday).length
  const openOffers = offers.filter((offer) => offer.status === 'OPEN').length
  const mealsThisMonth = donationHistory.reduce((total, record) => total + record.meals, 0)
  const co2SavedThisMonth = donationHistory.reduce((total, record) => total + record.co2Saved, 0)

  const summaryCards: { label: string; value: string; helper: string; icon: LucideIcon }[] = [
    {
      label: 'Today’s Surplus Posted',
      value: todayOffers.toString(),
      helper: `${openOffers} active pickup ${openOffers === 1 ? 'window' : 'windows'}`,
      icon: Package,
    },
    {
      label: 'Meals Donated This Month',
      value: mealsThisMonth.toLocaleString(),
      helper: '+120 vs last month',
      icon: Utensils,
    },
    {
      label: 'CO₂ Saved This Month',
      value: `${co2SavedThisMonth.toLocaleString()} kg`,
      helper: 'FoodShare conversion factor',
      icon: Recycle,
    },
    {
      label: 'Total Pickups Completed',
      value: donationHistory.length.toString(),
      helper: 'Confirmed in last 30 days',
      icon: CheckCircle2,
    },
  ]

  const requestsGrouped = useMemo(() => {
    return requests.reduce<Record<string, { offerSummary: string; rows: RequestCard[] }>>((acc, request) => {
      if (!acc[request.offerId]) {
        acc[request.offerId] = { offerSummary: request.offerSummary, rows: [] }
      }
      acc[request.offerId].rows.push(request)
      return acc
    }, {})
  }, [requests])

  const handleRequestAction = (requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status } : request))
    )
  }

  const handleCancelOffer = (offerId: string) => {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, status: 'CANCELLED' } : offer)))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading donor dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Donor Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-[#4a1f1f]">
            <Leaf className="w-8 h-8 text-[#8c3b3c]" />
            Post surplus quickly{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[#6b4d3c] max-w-3xl">
            Manage every offer, approve recipient requests, and keep a pulse on your impact.
          </p>
        </header>

        <Card className="p-6 border border-[#d9c7aa] bg-white/80 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">Surplus forecast</p>
              <h2 className="text-2xl font-semibold text-[#4a1f1f]">
                Predicted surplus today: {forecast.range}
              </h2>
              <p className="text-sm text-[#6b4d3c]">
                Expect peak between {forecast.window}. Confidence {Math.round(forecast.confidence * 100)}%.
              </p>
            </div>
            <div className="text-sm text-[#6b4d3c] max-w-md">
              {forecast.description}
              <div className="mt-2 flex items-center gap-2 text-xs text-[#8c3b3c]">
                <Info className="w-4 h-4" />
                Based on past 30 days + weekday patterns + events.
              </div>
            </div>
          </div>
        </Card>

        {fetchError && (
          <Card className="p-4 border border-red-200 bg-red-50 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{fetchError}</span>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="p-5 border border-[#d9c7aa] bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#6b4d3c]">{card.label}</p>
                  <span className="p-2 rounded-full bg-[#f0d8c0] text-[#8c3b3c]">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-semibold text-[#4a1f1f]">{card.value}</p>
                <p className="text-sm text-[#6b4d3c]">{card.helper}</p>
              </Card>
            )
          })}
        </div>

        <Card className="p-6 border border-[#d9c7aa] bg-white flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#4a1f1f]">Primary Actions</h2>
            <p className="text-sm text-[#6b4d3c]">Post surplus or review your pipeline.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#8c3b3c] hover:bg-[#732f30]">Create Surplus Offer</Button>
            <Button variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              View All Surplus
            </Button>
          </div>
        </Card>

        <Card className="p-5 border border-dashed border-[#d9c7aa] bg-[#fdf8f0] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#4a1f1f]">Smart suggestion ready</h3>
              <p className="text-sm text-[#6b4d3c]">
                We anticipate {smartSuggestion.quantity} between {smartSuggestion.windowStart} and {smartSuggestion.windowEnd}. Common
                categories: {smartSuggestion.categories.join(', ')}.
              </p>
            </div>
            <Button
              disabled={suggestionApplied}
              className="bg-[#8c3b3c] hover:bg-[#732f30] disabled:opacity-60"
              onClick={() => setSuggestionApplied(true)}
            >
              {suggestionApplied ? 'Suggestion Applied' : 'Apply Suggestion'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Active Surplus Offers</h2>
              <p className="text-sm text-[#6b4d3c]">Track pickup windows, requests, and statuses.</p>
            </div>
            <Button variant="ghost" className="text-[#8c3b3c] px-0" size="sm">
              Refresh list
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6b4d3c]">
                <tr>
                  <th className="py-3 font-medium">Item summary</th>
                  <th className="py-3 font-medium">Pickup window</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Pickup likelihood</th>
                  <th className="py-3 font-medium text-center">Requests</th>
                  <th className="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d1]">
                {offers.map((offer) => (
                  <tr key={offer.id} className="align-top">
                    <td className="py-4">
                      <p className="font-semibold text-[#4a1f1f]">{offer.summary}</p>
                      <p className="text-xs text-[#6b4d3c] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {offer.location}
                      </p>
                      <p className="text-xs text-[#6b4d3c] mt-1">{offer.storage}</p>
                    </td>
                    <td className="py-4 text-[#6b4d3c]">{offer.pickupWindow}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={offerStatusVariant[offer.status]}>{offer.status}</Badge>
                        <span className="text-xs text-[#6b4d3c]">{offer.expiresLabel}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {(() => {
                        const view = probabilityVariant(offer.pickupProbability)
                        return (
                          <div className="space-y-1 max-w-[160px]">
                            <Badge variant={view.variant}>{view.label}</Badge>
                            {view.warning && (
                              <p className="text-[11px] text-[#8c3b3c] flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5" />
                                {view.warning}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-4 text-center">
                      <span className="font-semibold">{offer.requestCount}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" className="text-[#8c3b3c]">
                          View Requests
                        </Button>
                        <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                          Edit
                        </Button>
                        {offer.status === 'OPEN' && (
                          <Button variant="destructive" size="sm" onClick={() => handleCancelOffer(offer.id)}>
                            Cancel Offer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Requests Management</h2>
              <p className="text-sm text-[#6b4d3c]">
                Approve recipients, share pickup details, and flag volunteer needs.
              </p>
            </div>
            <ClipboardList className="w-6 h-6 text-[#8c3b3c]" />
          </div>
          <div className="space-y-5">
            {Object.entries(requestsGrouped).map(([offerId, group]) => (
              <div key={offerId} className="rounded-xl border border-[#f0e3d1] bg-[#fffdf9] p-5 space-y-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Offer {offerId}</p>
                  <h3 className="text-lg font-semibold text-[#4a1f1f]">{group.offerSummary}</h3>
                </div>
                <div className="space-y-3">
                  {group.rows.map((request) => (
                    <div
                      key={request.id}
                      className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto] items-center border border-dashed border-[#e6d2b8] rounded-lg p-4"
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-[#4a1f1f]">{request.recipient}</p>
                        <p className="text-sm text-[#6b4d3c]">
                          {request.city} • {request.distance} away
                        </p>
                        {request.notes && <p className="text-sm text-[#6b4d3c]">{request.notes}</p>}
                      </div>
                      <div className="space-y-2">
                        <Badge variant={requestStatusVariant[request.status]}>{request.status}</Badge>
                        {request.status === 'APPROVED' && (
                          <p className="text-xs text-[#6b4d3c]">
                            {request.volunteer ? `Volunteer: ${request.volunteer}` : 'Volunteer pending'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAction(request.id, 'APPROVED')}
                          disabled={request.status === 'APPROVED'}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleRequestAction(request.id, 'REJECTED')}
                          disabled={request.status === 'REJECTED'}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Impact & History</h2>
              <p className="text-sm text-[#6b4d3c]">
                Past donations feed into impact certificates and CO₂ savings.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6b4d3c]">
                <tr>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Items</th>
                  <th className="py-3 font-medium">Recipient org</th>
                  <th className="py-3 font-medium text-center">Meals donated</th>
                  <th className="py-3 font-medium text-center">CO₂ saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d1]">
                {donationHistory.map((record) => (
                  <tr key={record.id}>
                    <td className="py-4 text-[#6b4d3c]">{record.date}</td>
                    <td className="py-4 text-[#4a1f1f]">{record.items}</td>
                    <td className="py-4 text-[#6b4d3c]">{record.recipient}</td>
                    <td className="py-4 text-center font-semibold text-[#4a1f1f]">{record.meals}</td>
                    <td className="py-4 text-center text-[#6b4d3c]">{record.co2Saved} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {donorInsights.map((insight) => (
              <Card key={insight.title} className="p-4 border border-[#d9c7aa] bg-[#fdf8f0]">
                <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{insight.title}</p>
                <p className="text-lg font-semibold text-[#4a1f1f]">{insight.detail}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Organization & Notifications</h2>
              <p className="text-sm text-[#6b4d3c]">
                Keep donor details updated so volunteers can reach the right contact.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              Edit Organization
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Organization</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">
                {user?.organization ?? 'Not provided'}
              </p>
              <p className="text-sm text-[#6b4d3c]">Address: Bandra West, Mumbai</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Verification</p>
              <div className="flex items-center gap-2">
                <Badge variant="success">Verified</Badge>
                <span className="text-sm text-[#6b4d3c]">GST + FSSAI on file</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Storage capability</p>
              <p className="font-medium text-[#4a1f1f]">Hot holding · Cold chain · Dry pantry</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Notification preferences</p>
              <p className="font-medium text-[#4a1f1f]">Email + SMS alerts</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Building2 className="w-4 h-4" />
              Update address
            </Button>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              Manage notifications
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
