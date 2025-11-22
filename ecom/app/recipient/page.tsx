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
  Leaf,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AaharSetuLogo } from '@/components/ui/logo'

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

// Deliveries loaded from API - no hardcoded data

export default function RecipientPortal() {
  useProtectedRoute('RECIPIENT')
  const [cityFilter, setCityFilter] = useState('All')
  const [dietFilter, setDietFilter] = useState<DietTag | 'ALL'>('ALL')
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({})
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState<SurplusOffer | null>(null)
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState<RecipientRequest | null>(null)
  const [orgFormData, setOrgFormData] = useState({ name: '', address: '', city: '', contact: '' })

  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>([])
  const [requests, setRequests] = useState<RecipientRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userOrg, setUserOrg] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load user organization
        const userRes = await fetch('/api/users/me')
        if (!userRes.ok) {
          throw new Error('Failed to load user profile')
        }
        
        const userData = await userRes.json()
        setUserOrg(userData)
        
        if (userData?.organizationId) {
          try {
            const orgRes = await fetch(`/api/organizations/${userData.organizationId}`)
            if (orgRes.ok) {
              const orgData = await orgRes.json()
              setOrgFormData({
                name: orgData.name || '',
                address: orgData.address || '',
                city: orgData.city || '',
                contact: orgData.contact || '',
              })
            } else {
              console.error('Failed to load organization:', orgRes.status)
            }
          } catch (err) {
            console.error('Error loading organization details:', err)
          }
        } else {
          console.warn('User has no organization assigned')
        }
        
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
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data'
        console.error('Data loading error:', err)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
    
    // Do NOT auto-refresh - only refresh on explicit user action
    // Users can click the "Refresh" button to manually reload data
    
    return () => {}
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
        // Reload requests and surplus offers to update UI
        const [requestsRes, offersRes] = await Promise.all([
          fetch('/api/requests/my'),
          fetch('/api/surplus/available'),
        ])

        if (requestsRes.ok) {
          const myRequests = await requestsRes.json()
          setRequests(myRequests)
        }

        if (offersRes.ok) {
          const offers = await offersRes.json()
          setSurplusOffers(offers)
        }

        setShowDetailsModal(null)
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

  const handleEditOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!userOrg?.organizationId) {
        throw new Error('Organization ID not found. Please refresh the page.')
      }

      const res = await fetch(`/api/organizations/${userOrg.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgFormData.name,
          address: orgFormData.address,
          city: orgFormData.city,
          contact: orgFormData.contact,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to update organization`)
      }

      const updated = await res.json()
      setOrgFormData({
        name: updated.name || '',
        address: updated.address || '',
        city: updated.city || '',
        contact: updated.contact || '',
      })
      setShowEditOrgModal(false)
      alert('Organization updated successfully!')
    } catch (err) {
      console.error('Edit organization error:', err)
      alert(err instanceof Error ? err.message : 'Failed to update organization')
    }
  }

  const handleSaveFeedback = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackDraft[requestId] || '' }),
      })

      if (res.ok) {
        alert('Feedback saved successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save feedback')
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

  // Calculate real metrics from requests
  const pendingRequestCount = requests.filter((r) => r.status === 'PENDING').length
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED')
  
  // Calculate meals this month from fulfilled requests
  const mealsThisMonth = fulfilledRequests.reduce((total, req) => {
    if (req.surplus?.items) {
      const weight = req.surplus.items.reduce((sum, item) => {
        return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
      }, 0)
      return total + Math.round(weight * 2.2)
    }
    return total
  }, 0)

  // Count unique donor organizations
  const uniqueDonors = new Set(fulfilledRequests.map((r) => r.surplus?.organization?.name)).size
  
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
      value: mealsThisMonth.toString(),
      helper: 'Goal: 400 meals',
      icon: Utensils,
    },
    {
      label: 'Total Donations Received',
      value: fulfilledRequests.length.toString(),
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
        <header className="space-y-2">
          <div className="flex items-start gap-3">
            <Leaf className="w-8 h-8 text-[#8c3b3c] shrink-0 mt-1" />
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-[#4a1f1f]">
                Recipient Dashboard
              </h1>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg md:text-xl text-[#4a1f1f]">
              Discover surplus nearby{userOrg?.name ? ` from ${userOrg.name}` : ''}
            </h2>
            <p className="text-[#6b4d3c] max-w-3xl mx-auto mt-2">
              Browse available surplus, request what you need, and track your donations.
            </p>
          </div>
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
                    <Button 
                      size="sm" 
                      className="bg-[#8c3b3c] hover:bg-[#732f30] flex-1"
                      onClick={() => setShowDetailsModal(offer)}
                    >
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
                            onClick={() => setShowRequestDetailsModal(row)}
                          >
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

          {fulfilledRequests.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No completed deliveries yet.</p>
          ) : (
            <div className="space-y-4">
              {fulfilledRequests.map((request) => {
                const totalWeight = request.surplus?.items.reduce((sum, item) => {
                  return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
                }, 0) || 0
                const meals = Math.round(totalWeight * 2.2)
                const date = new Date(request.surplus?.pickupWindowStart || '').toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })

                return (
                  <div key={request.id} className="border border-dashed border-[#e6d2b8] rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{date}</p>
                        <h3 className="text-lg font-semibold text-[#4a1f1f]">
                          {request.surplus?.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                        </h3>
                      </div>
                      <Badge variant="secondary">{meals} meals</Badge>
                    </div>
                    <p className="text-sm text-[#6b4d3c]">
                      Donor: {request.surplus?.organization?.name || 'Unknown'}
                    </p>
                    <textarea
                      value={feedbackDraft[request.id] ?? ''}
                      onChange={(e) =>
                        setFeedbackDraft((prev) => ({ ...prev, [request.id]: e.target.value }))
                      }
                      placeholder="Add feedback or notes..."
                      className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm bg-white"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
                        onClick={() => handleSaveFeedback(request.id)}
                      >
                        Save Feedback
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Org Profile */}
        {userOrg?.organizationId ? (
          <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Organization Profile</h2>
                <p className="text-sm text-[#6b4d3c]">
                  Keep your organization details up to date.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
                onClick={() => setShowEditOrgModal(true)}
              >
                Edit organization
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-[#6b4d3c]">Organization</p>
                <h3 className="text-lg font-semibold text-[#4a1f1f]">{orgFormData.name || 'Not set'}</h3>
                <p className="text-sm text-[#6b4d3c]">{orgFormData.address} · {orgFormData.contact || 'No contact'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[#6b4d3c]">Verification status</p>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Verified</Badge>
                  <span className="text-sm text-[#6b4d3c]">Renewed Sep 2024</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[#6b4d3c]">City</p>
                <p className="font-medium text-[#4a1f1f]">{orgFormData.city || 'Not set'}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border border-[#d9c7aa] bg-[#fef9f3] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Organization Profile</h2>
                <p className="text-sm text-[#6b4d3c]">
                  Set up your organization to start requesting surplus food.
                </p>
              </div>
            </div>
            <div className="p-4 bg-white border border-[#e8d7c3] rounded-lg">
              <p className="text-sm text-[#6b4d3c] mb-4">
                You haven't set up your organization yet. Create or join an organization to request surplus food from donors.
              </p>
              <Button 
                className="bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                onClick={() => window.location.href = '/recipient/organization'}
              >
                Set Up Organization
              </Button>
            </div>
          </Card>
        )}

        {/* Edit Organization Modal */}
        {showEditOrgModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Edit Organization</h2>
                <form onSubmit={handleEditOrganization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={orgFormData.name}
                      onChange={(e) => setOrgFormData({...orgFormData, name: e.target.value})}
                      className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">Address</label>
                    <input
                      type="text"
                      value={orgFormData.address}
                      onChange={(e) => setOrgFormData({...orgFormData, address: e.target.value})}
                      className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">City</label>
                    <input
                      type="text"
                      value={orgFormData.city}
                      onChange={(e) => setOrgFormData({...orgFormData, city: e.target.value})}
                      className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">Contact</label>
                    <input
                      type="text"
                      value={orgFormData.contact}
                      onChange={(e) => setOrgFormData({...orgFormData, contact: e.target.value})}
                      className="w-full border border-[#d9c7aa] rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowEditOrgModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">Surplus Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(null)}
                    className="absolute top-4 right-4 text-[#6b4d3c] hover:text-[#4a1f1f]"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Donor</p>
                    <p className="text-lg font-semibold text-[#4a1f1f]">{showDetailsModal.organization?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Items</p>
                    <p className="text-lg font-semibold text-[#4a1f1f]">
                      {showDetailsModal.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Pickup Address</p>
                    <p className="text-sm text-[#4a1f1f]">{showDetailsModal.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Pickup Window</p>
                    <p className="text-sm text-[#4a1f1f]">
                      {new Date(showDetailsModal.pickupWindowStart).toLocaleString()} - {new Date(showDetailsModal.pickupWindowEnd).toLocaleString()}
                    </p>
                  </div>
                  {showDetailsModal.items.flatMap((i) => i.dietaryTags || []).length > 0 && (
                    <div>
                      <p className="text-sm text-[#6b4d3c] font-semibold mb-2">Dietary Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {showDetailsModal.items.flatMap((i) => i.dietaryTags || []).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#d9c7aa]"
                    onClick={() => setShowDetailsModal(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                    onClick={() => {
                      handleRequestSurplus(showDetailsModal.id)
                    }}
                  >
                    Request Surplus
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* View Request Details Modal */}
        {showRequestDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">Request Details</h2>
                  <button
                    onClick={() => setShowRequestDetailsModal(null)}
                    className="absolute top-4 right-4 text-[#6b4d3c] hover:text-[#4a1f1f]"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Donor Organization</p>
                    <p className="text-lg font-semibold text-[#4a1f1f]">{showRequestDetailsModal.surplus?.organization?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Items</p>
                    <p className="text-sm text-[#4a1f1f]">
                      {showRequestDetailsModal.surplus?.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Pickup Address</p>
                    <p className="text-sm text-[#4a1f1f]">{showRequestDetailsModal.surplus?.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Pickup Window</p>
                    <p className="text-sm text-[#4a1f1f]">
                      {showRequestDetailsModal.surplus?.pickupWindowStart ? new Date(showRequestDetailsModal.surplus.pickupWindowStart).toLocaleString() : 'N/A'} - {showRequestDetailsModal.surplus?.pickupWindowEnd ? new Date(showRequestDetailsModal.surplus.pickupWindowEnd).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6b4d3c] font-semibold">Request Status</p>
                    <Badge 
                      variant={
                        showRequestDetailsModal.status === 'APPROVED'
                          ? 'success'
                          : showRequestDetailsModal.status === 'FULFILLED'
                            ? 'default'
                            : showRequestDetailsModal.status === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                      }
                    >
                      {showRequestDetailsModal.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                  onClick={() => setShowRequestDetailsModal(null)}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
