'use client'

import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  MapPin,
  Filter,
  Utensils,
  Search,
  Layers,
  ClipboardList,
  Truck,
  Download,
  MessageSquare,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type DietTag = 'VEG' | 'NON_VEG' | 'VEGAN'
type TimeFilter = 'NOW' | 'LATER' | 'TOMORROW'
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'

interface SurplusOffer {
  id: string
  donor: string
  summary: string
  pickupWindow: string
  distance: string
  city: string
  dietary: DietTag[]
  storage: string
  timeframe: TimeFilter
  matchScore: number
}

interface RecipientRequest {
  id: string
  summary: string
  donor: string
  status: RequestStatus
  expectedPickup?: string
  volunteer?: string
}

interface DeliveryRecord {
  id: string
  date: string
  donor: string
  items: string
  meals: number
  feedback?: string
}

const surplusOffers: SurplusOffer[] = [
  {
    id: 'FS-4821',
    donor: 'Spice Route Café',
    summary: 'Biryani trays (30 plates)',
    pickupWindow: 'Today · 2:00 – 4:00 PM',
    distance: '2.1 km',
    city: 'Bandra',
    dietary: ['NON_VEG'],
    storage: 'Hot meals',
    timeframe: 'NOW',
    matchScore: 0.92,
  },
  {
    id: 'FS-4812',
    donor: 'Fresh Bowl Kitchen',
    summary: 'Salad bowls (20 servings)',
    pickupWindow: 'Today · 7:00 – 8:30 PM',
    distance: '4.4 km',
    city: 'Mahim',
    dietary: ['VEG', 'VEGAN'],
    storage: 'Cold chain',
    timeframe: 'LATER',
    matchScore: 0.81,
  },
  {
    id: 'FS-4798',
    donor: 'Sunrise Bakery',
    summary: 'Bread loaves + pastries (25 packs)',
    pickupWindow: 'Tomorrow · 9:30 – 11:00 AM',
    distance: '7.0 km',
    city: 'Worli',
    dietary: ['VEG'],
    storage: 'Dry storage',
    timeframe: 'TOMORROW',
    matchScore: 0.62,
  },
]

const requestRows: RecipientRequest[] = [
  {
    id: 'REQ-901',
    summary: 'Biryani trays (30 plates)',
    donor: 'Spice Route Café',
    status: 'PENDING',
  },
  {
    id: 'REQ-880',
    summary: 'Salad bowls (20 servings)',
    donor: 'Fresh Bowl Kitchen',
    status: 'APPROVED',
    expectedPickup: 'Today · 7:15 PM',
    volunteer: 'Rahul (Volunteer) · +91 90001 55662',
  },
  {
    id: 'REQ-845',
    summary: 'Assorted bakery (25 packs)',
    donor: 'Sunrise Bakery',
    status: 'FULFILLED',
    expectedPickup: 'Yesterday · 10:00 AM',
  },
]

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter | 'ALL'>('ALL')
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({})

  const demandForecast = {
    range: '220 – 260 meals',
    insight: 'You usually serve 15% more meals on Sundays. Prep extra cold storage for salads.',
  }

  const qualityScore = {
    score: 4.5,
    summary: 'Feedback indicates consistently fresh food and punctual pickups.',
    tags: ['Fresh produce', 'Good hygiene', 'On-time delivery'],
  }

  const filteredOffers = useMemo(() => {
    return surplusOffers.filter((offer) => {
      const matchesCity = cityFilter === 'All' || offer.city === cityFilter
      const matchesDiet = dietFilter === 'ALL' || offer.dietary.includes(dietFilter)
      const matchesTime = timeFilter === 'ALL' || offer.timeframe === timeFilter
      return matchesCity && matchesDiet && matchesTime
    }).sort((a, b) => b.matchScore - a.matchScore)
  }, [cityFilter, dietFilter, timeFilter])

  const recommendedOffers = filteredOffers.slice(0, 2)
  const otherOffers = filteredOffers.slice(2)

  const pendingRequestCount = requestRows.filter((row) => row.status === 'PENDING').length
  const totalMealsThisMonth = 260
  const totalDonations = 45

  const summaryCards: { label: string; value: string; helper: string; icon: LucideIcon }[] = [
    {
      label: 'Available Surplus Nearby',
      value: filteredOffers.length.toString(),
      helper: 'Within 10 km',
      icon: Search,
    },
    {
      label: 'Pending Requests',
      value: pendingRequestCount.toString(),
      helper: 'Awaiting donor approval',
      icon: ClipboardList,
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
      helper: 'Since joining FoodShare',
      icon: Layers,
    },
  ]

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
            Track every request from approval to pickup, confirm deliveries, and keep your organization profile verified.
          </p>
        </header>

        <Card className="p-5 border border-[#d9c7aa] bg-white/90 space-y-2">
          <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">Demand forecast</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#4a1f1f]">{demandForecast.range}</h2>
            <p className="text-sm text-[#6b4d3c]">{demandForecast.insight}</p>
          </div>
        </Card>

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

        <Card className="p-6 border border-[#d9c7aa] bg-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#4a1f1f]">Primary Actions</h2>
            <p className="text-sm text-[#6b4d3c]">Browse surplus or review your active requests.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#8c3b3c] hover:bg-[#732f30]">Browse Surplus</Button>
            <Button variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              View My Requests
            </Button>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Browse Surplus</h2>
              <p className="text-sm text-[#6b4d3c]">Filter by city, pickup window, or dietary tags.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-[#6b4d3c]" />
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="All">All cities</option>
                <option value="Bandra">Bandra</option>
                <option value="Mahim">Mahim</option>
                <option value="Worli">Worli</option>
              </select>
              <select
                value={dietFilter}
                onChange={(event) => setDietFilter(event.target.value as DietTag | 'ALL')}
                className="border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">All dietary tags</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="VEGAN">Vegan</option>
              </select>
              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value as TimeFilter | 'ALL')}
                className="border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">Any time</option>
                <option value="NOW">Available now</option>
                <option value="LATER">Later today</option>
                <option value="TOMORROW">Tomorrow</option>
              </select>
            </div>
          </div>

          {recommendedOffers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8c3b3c]" />
                <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Recommended for you</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedOffers.map((offer) => (
                  <Card key={offer.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{offer.donor}</p>
                        <h3 className="text-lg font-semibold text-[#4a1f1f]">{offer.summary}</h3>
                      </div>
                      <Badge variant="success">{offer.matchScore > 0.9 ? 'Best Match' : 'High Match'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-[#6b4d3c]">
                      <span>{offer.distance} away</span>
                      <span>•</span>
                      <span>{offer.city}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {offer.dietary.map((tag) => (
                        <Badge key={`${offer.id}-${tag}`} variant="outline">
                          {tag === 'NON_VEG' ? 'Non-veg' : tag === 'VEGAN' ? 'Vegan' : 'Veg'}
                        </Badge>
                      ))}
                      <Badge variant="outline">{offer.storage}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30]">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                        Request Surplus
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {otherOffers.map((offer) => (
              <Card key={offer.id} className="border border-[#d9c7aa] bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-[#8c3b3c] tracking-wide">{offer.donor}</p>
                    <h3 className="text-lg font-semibold text-[#4a1f1f]">{offer.summary}</h3>
                  </div>
                  <Badge variant="secondary">{offer.pickupWindow}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-[#6b4d3c]">
                  <span>{offer.distance} away</span>
                  <span>•</span>
                  <span>{offer.city}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offer.dietary.map((tag) => (
                    <Badge key={`${offer.id}-${tag}`} variant="outline">
                      {tag === 'NON_VEG' ? 'Non-veg' : tag === 'VEGAN' ? 'Vegan' : 'Veg'}
                    </Badge>
                  ))}
                  <Badge variant="outline">{offer.storage}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30]">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                    Request Surplus
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">My Requests</h2>
              <p className="text-sm text-[#6b4d3c]">Track approvals, rejections, and fulfilled donations.</p>
            </div>
            <Truck className="w-5 h-5 text-[#8c3b3c]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6b4d3c]">
                <tr>
                  <th className="py-3 font-medium">Surplus summary</th>
                  <th className="py-3 font-medium">Donor</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Details</th>
                  <th className="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d1]">
                {requestRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-4 text-[#4a1f1f]">{row.summary}</td>
                    <td className="py-4 text-[#6b4d3c]">{row.donor}</td>
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
                    <td className="py-4 text-sm text-[#6b4d3c]">
                      {row.expectedPickup ? row.expectedPickup : 'Awaiting update'}
                      {row.volunteer && (
                        <div className="mt-1">{row.volunteer}</div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {row.status === 'PENDING' && (
                          <Button size="sm" variant="ghost" className="text-destructive">
                            Cancel Request
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                          View Details
                        </Button>
                        {row.status === 'FULFILLED' && (
                          <Button size="sm" className="bg-[#8c3b3c] hover:bg-[#732f30]">Confirm Delivery</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Delivery & Feedback</h2>
              <p className="text-sm text-[#6b4d3c]">
                Confirm deliveries and leave notes for donors or volunteers.
              </p>
            </div>
            <MessageSquare className="w-5 h-5 text-[#8c3b3c]" />
          </div>
          <Card className="p-4 border border-[#d9c7aa] bg-[#fffdf9] space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">Food quality score</p>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-2xl font-semibold text-[#4a1f1f]">{qualityScore.score.toFixed(1)} / 5</h3>
              <p className="text-sm text-[#6b4d3c]">{qualityScore.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {qualityScore.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
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
                  onChange={(event) =>
                    setFeedbackDraft((prev) => ({ ...prev, [delivery.id]: event.target.value }))
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

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Impact & Reports</h2>
              <p className="text-sm text-[#6b4d3c]">Download reports to share with partners and funders.</p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Download className="w-4 h-4" />
              Export report
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {impactCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="p-5 border border-[#d9c7aa] bg-[#fffdf9] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[#6b4d3c] text-sm">
                    {card.label}
                    <Icon className="w-4 h-4 text-[#8c3b3c]" />
                  </div>
                  <p className="text-3xl font-semibold text-[#4a1f1f]">{card.value}</p>
                  <p className="text-sm text-[#6b4d3c]">{card.helper}</p>
                </Card>
              )
            })}
          </div>
        </Card>

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Org Profile</h2>
              <p className="text-sm text-[#6b4d3c]">
                Keep address, storage capability, and operating hours up to date to get matched faster.
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
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Notification preference</p>
              <p className="font-medium text-[#4a1f1f]">Email + SMS</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <Building2 className="w-4 h-4" />
              Update address
            </Button>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              <CheckCircle2 className="w-4 h-4" />
              Manage verification
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
