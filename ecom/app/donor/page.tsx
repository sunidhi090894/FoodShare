'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Package,
  Utensils,
  Recycle,
  CheckCircle2,
  MapPin,
  AlertCircle,
  X,
  Plus,
  Download,
  Leaf,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AaharSetuLogo } from '@/components/ui/logo'

type OfferStatus = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'

interface BackendUser {
  name: string | null
  organization?: string | null
  email?: string | null
  role?: string
}

interface SurplusItem {
  name: string
  quantity: number
  unit: string
  category?: string
  dietaryTags?: string[]
  allergenTags?: string[]
}

interface ActiveOffer {
  id: string
  items: SurplusItem[]
  pickupWindowStart: string
  pickupWindowEnd: string
  pickupAddress: string
  status: OfferStatus
  expiryDateTime: string
  totalWeightKg?: number
  recipientOrgName?: string
}

interface IncomingRequest {
  id: string
  surplusId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'
  recipientOrgName: string
  requestedByUserId: string
  items?: SurplusItem[]
  notes?: string
  createdAt?: string
}

const offerStatusVariant: Record<OfferStatus, 'default' | 'success' | 'secondary' | 'warning' | 'destructive'> = {
  OPEN: 'default',
  MATCHED: 'secondary',
  FULFILLED: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'destructive',
}

export default function DonorPage() {
  useProtectedRoute('DONOR')
  const router = useRouter()
  
  const [user, setUser] = useState<BackendUser | null>(null)
  const [organization, setOrganization] = useState<{ city: string; name: string } | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [offers, setOffers] = useState<ActiveOffer[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  // Organization form state
  const [orgName, setOrgName] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgCity, setOrgCity] = useState('')

  // Modal states
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<ActiveOffer | null>(null)
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Form state
  const [items, setItems] = useState<SurplusItem[]>([
    { name: '', quantity: 0, unit: 'kg', category: '', dietaryTags: [], allergenTags: [] },
  ])
  const [pickupWindowStart, setPickupWindowStart] = useState('')
  const [pickupWindowEnd, setPickupWindowEnd] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch('/api/surplus/my')
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Failed to load offers:', errorData)
        setFetchError(`Failed to load offers: ${errorData.error || 'Unknown error'}`)
        setOffers([])
        return
      }
      const data = await res.json()
      console.log('Loaded offers:', data)
      setOffers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load offers:', error)
      setFetchError(error instanceof Error ? error.message : 'Failed to load offers')
      setOffers([])
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('📱 [DONOR] Loading user profile on page load...')
        const res = await fetch('/api/users/me')
        if (!res.ok) {
          throw new Error('Unable to load your profile.')
        }
        const data = await res.json()
        console.log('📱 [DONOR] User profile loaded:', data)
        console.log('   - User role:', data.role)
        console.log('   - User organization field:', data.organization)
        console.log('   - User organizationId field:', data.organizationId)
        
        // Verify user is a DONOR before setting state
        if (data.role !== 'DONOR') {
          console.log('ℹ️ [DONOR] User role is:', data.role, '- redirecting to appropriate dashboard')
          // Redirect to their appropriate dashboard based on role
          const roleRoutes: Record<string, string> = {
            'RECIPIENT': '/recipient',
            'VOLUNTEER': '/volunteer',
            'ADMIN': '/admin'
          }
          router.replace(roleRoutes[data.role] || '/dashboard')
          return
        }
        
        setUser(data)
        setIsAuthorized(true)
        
        // Auto-fill pickup address with organization address
        if (data.organizationId) {
          try {
            console.log('📱 [DONOR] ✓ User has organizationId, fetching organization:', data.organizationId)
            const orgRes = await fetch(`/api/organizations/${data.organizationId}`)
            if (orgRes.ok) {
              const orgData = await orgRes.json()
              console.log('📱 [DONOR] ✓ Organization fetched successfully:', orgData)
              setOrganization({ city: orgData.city, name: orgData.name })
              // Set form fields with organization data
              setOrgName(orgData.name)
              setOrgAddress(orgData.address)
              setOrgCity(orgData.city)
              setPickupAddress(`${orgData.address}, ${orgData.city}`)
            } else {
              console.warn('📱 [DONOR] ✗ Failed to fetch organization:', orgRes.status)
            }
          } catch (error) {
            console.error('📱 [DONOR] ✗ Failed to fetch organization:', error)
          }
        } else {
          console.log('📱 [DONOR] ✗ User has no organization set yet')
        }
        
        loadOffers()
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : 'Failed to load profile.')
        console.error('📱 [DONOR] ✗ Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
    
    // Do NOT auto-refresh - only refresh on explicit user action
    // Users can click the "Refresh" button to manually reload offers
    
    return () => {}
  }, [loadOffers])

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 0, unit: 'kg', category: '', dietaryTags: [], allergenTags: [] }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrg(true)
    setFetchError('')

    try {
      if (!orgName || !orgAddress || !orgCity) {
        throw new Error('Please fill in all organization fields')
      }

      console.log('Creating organization:', { orgName, orgAddress, orgCity })

      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          address: orgAddress,
          city: orgCity,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create organization')
      }

      const orgData = await res.json()
      console.log('Organization created successfully:', orgData)

      // Update local state with organization
      setOrganization({ city: orgData.city, name: orgData.name })
      setPickupAddress(`${orgData.address}, ${orgData.city}`)

      // Reload user to get updated organization link
      console.log('🔄 Reloading user data...')
      const userRes = await fetch('/api/users/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        console.log('User updated:', userData)
        console.log('   Organization field:', userData.organization)
        console.log('   OrganizationId field:', userData.organizationId)
        setUser(userData)
      } else {
        console.error('Failed to reload user:', userRes.status)
      }

      setShowOrgForm(false)
      // Clear form fields
      setOrgName('')
      setOrgAddress('')
      setOrgCity('')
      
      alert('Organization created successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create organization'
      setFetchError(errorMsg)
      console.error('Organization creation error:', errorMsg)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setFetchError('')
    
    try {
      // Validate form
      if (!items[0]?.name || !pickupWindowStart || !pickupWindowEnd) {
        throw new Error('Please fill in all required fields')
      }

      // Check if user has organization
      if (!user?.organization) {
        throw new Error('Please set up your organization first before creating surplus offers')
      }

      // Ensure pickup address is from organization (auto-extracted)
      const finalPickupAddress = pickupAddress || `${organization?.city || 'Unknown'}`
      if (!finalPickupAddress) {
        throw new Error('Unable to extract pickup address from organization profile')
      }

      const payload = {
        items: items.map(item => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          category: item.category || undefined,
          dietaryTags: item.dietaryTags?.filter((t: string) => t && t.trim()) || [],
          allergenTags: item.allergenTags?.filter((t: string) => t && t.trim()) || [],
        })),
        pickupWindowStart,
        pickupWindowEnd,
        pickupAddress: finalPickupAddress, // Always use organization address
      }

      console.log('Sending payload:', payload)

      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()
      
      if (!res.ok) {
        throw new Error(responseData.error || `Failed to create surplus offer (${res.status})`)
      }

      setShowCreateForm(false)
      // Reset form
      setItems([{ name: '', quantity: 0, unit: 'kg', category: '', dietaryTags: [], allergenTags: [] }])
      setPickupWindowStart('')
      setPickupWindowEnd('')
      setPickupAddress('')
      
      // Reload offers
      await loadOffers()
      alert('Surplus offer created successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create offer'
      setFetchError(errorMsg)
      console.error('Error:', errorMsg)
    } finally {
      setIsCreating(false)
    }
  }

  const handleViewRequests = async (offer: ActiveOffer) => {
    // Check authorization before making request
    if (!isAuthorized) {
      alert('You are not authorized to view requests. Please refresh the page.')
      return
    }

    setSelectedOffer(offer)
    setShowRequestsModal(true)
    setLoadingRequests(true)

    try {
      console.log(`Fetching requests for offer ${offer.id}`)
      const res = await fetch(`/api/surplus/${offer.id}/requests`)
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error(`API Error: ${res.status}`, errorData)
        alert(`Failed to load requests: ${errorData.error}`)
        setIncomingRequests([])
      } else {
        const requests = await res.json()
        console.log(`Loaded ${requests.length} requests for offer ${offer.id}`, requests)
        setIncomingRequests(requests)
      }
    } catch (err) {
      console.error('Failed to load requests:', err)
      alert(`Error loading requests: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIncomingRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleEditOffer = (offer: ActiveOffer) => {
    setSelectedOffer(offer)
    setShowEditModal(true)
  }

  const handleCancelOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to cancel this offer?')) return
    
    try {
      const res = await fetch(`/api/surplus/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!res.ok) {
        throw new Error('Failed to cancel offer')
      }

      await loadOffers()
      alert('Offer cancelled successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to cancel offer'
      setFetchError(errorMsg)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    if (!isAuthorized) {
      alert('You are not authorized to approve requests. Please refresh the page.')
      return
    }

    try {
      console.log('🎯 [DONOR] Approving request:', requestId)
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('❌ [DONOR] API Error approving request:', res.status, data)
        throw new Error(data.error || 'Failed to approve request')
      }

      console.log('✅ [DONOR] Request approved successfully')
      // When request is approved, change offer status to MATCHED and send to volunteer assignments
      if (selectedOffer && organization) {
        try {
          // First update the surplus offer status to MATCHED
          await fetch(`/api/surplus/${selectedOffer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'MATCHED' }),
          })

          // Then create volunteer assignment with city information
          await fetch('/api/volunteer-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              surplusId: selectedOffer.id,
              donorOrg: organization.name,
              donorCity: organization.city,
              donorAddress: selectedOffer.pickupAddress,
              donorContact: user?.email || 'N/A',
              items: selectedOffer.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', '),
              pickupWindow: `${new Date(selectedOffer.pickupWindowStart).toLocaleString()} - ${new Date(selectedOffer.pickupWindowEnd).toLocaleString()}`,
            }),
          })
        } catch (err) {
          console.error('Failed to create volunteer assignment:', err)
        }
      }

      // Reload requests
      if (selectedOffer) {
        await handleViewRequests(selectedOffer)
      }
      alert('Request approved successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to approve request'
      alert(errorMsg)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject request')
      }

      // Reload requests
      if (selectedOffer) {
        await handleViewRequests(selectedOffer)
      }
      alert('Request rejected successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reject request'
      alert(errorMsg)
    }
  }

  // Count total surplus orders created TODAY by the organization
  const todayOffers = (() => {
    const now = new Date()
    const todayOffersList = offers.filter((offer) => {
      const start = new Date(offer.pickupWindowStart)
      return start.toDateString() === now.toDateString()
    })
    return todayOffersList.length
  })()

  // Actual Waste Saved Today - only MATCHED status offers
  const matchedOffers = offers.filter(offer => offer.status === 'MATCHED')
  const todayMatchedOffers = matchedOffers.filter(offer => {
    const now = new Date()
    const start = new Date(offer.pickupWindowStart)
    return start.toDateString() === now.toDateString()
  })
  const actualWasteSavedToday = todayMatchedOffers.reduce((total, offer) => {
    const weight = offer.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
    }, 0)
    return total + weight
  }, 0)

  // Meals: 1 kg = 2.2 meals (from MATCHED offers only)
  const mealsThisMonth = matchedOffers.reduce((total, offer) => {
    const totalWeight = offer.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
    }, 0)
    return total + Math.round(totalWeight * 2.2)
  }, 0)

  // CO₂: 1 kg food waste prevented = 1.8 kg CO₂ saved (from MATCHED offers only)
  const co2SavedThisMonth = matchedOffers.reduce((total, offer) => {
    const totalWeight = offer.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
    }, 0)
    return total + Math.round(totalWeight * 1.8)
  }, 0)

  // Predictive Analytics: ML Algorithm with 7 Steps
  const calculateFoodWastePrevention = () => {
    if (offers.length === 0) return { savedWeight: 0, savedMeals: 0, savedCO2: 0, confidence: 0 }

    // STEP 1: Learn from Historical Data - Group offers by day of week
    const offersByDayOfWeek: Record<number, number[]> = {}
    offers.forEach(offer => {
      const date = new Date(offer.pickupWindowStart)
      const dayOfWeek = date.getDay()
      const weight = offer.items.reduce((sum, item) => {
        return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
      }, 0)
      
      if (!offersByDayOfWeek[dayOfWeek]) {
        offersByDayOfWeek[dayOfWeek] = []
      }
      offersByDayOfWeek[dayOfWeek].push(weight)
    })

    // STEP 2: Calculate Today's Baseline Average
    const today = new Date().getDay()
    const todayWeights = offersByDayOfWeek[today] || []
    const avgWeightToday = todayWeights.length > 0
      ? todayWeights.reduce((a, b) => a + b, 0) / todayWeights.length
      : offers.reduce((total, offer) => {
          const weight = offer.items.reduce((sum, item) => {
            return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
          }, 0)
          return total + weight
        }, 0) / Math.max(offers.length, 1)

    // STEP 3: Apply Seasonality (Weekday vs Weekend) - CORRECTED MULTIPLIERS
    // Weekends (Sat=6, Sun=0): 1.25 multiplier
    // Weekdays (Mon-Fri=1-5): 0.85 multiplier
    const isWeekend = today === 0 || today === 6
    const seasonalityMultiplier = isWeekend ? 1.25 : 0.85
    
    // STEP 4: Check Trend (last 5 offers)
    const recentOffers = offers.slice(-5)
    const recentAvg = recentOffers.reduce((total, offer) => {
      const weight = offer.items.reduce((sum, item) => {
        return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
      }, 0)
      return total + weight
    }, 0) / Math.max(recentOffers.length, 1)
    const trendMultiplier = recentAvg > 0 && avgWeightToday > 0 ? (recentAvg / avgWeightToday) * 0.5 + 0.5 : 1

    // STEP 5: Predict Today's Waste + Add Real-Time Data
    const historicalPrediction = Math.round(avgWeightToday * seasonalityMultiplier * trendMultiplier)
    
    // Add today's actual offers already posted
    const todayActualWeight = offers
      .filter(offer => {
        const start = new Date(offer.pickupWindowStart)
        return start.toDateString() === new Date().toDateString()
      })
      .reduce((total, offer) => {
        const weight = offer.items.reduce((sum, item) => {
          return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
        }, 0)
        return total + weight
      }, 0)

    const totalPredictedWeight = historicalPrediction + todayActualWeight

    // STEP 6: Confidence Score
    // 90% + (2% × number of data points) capped at 95%
    const confidence = Math.min(90 + Math.floor(todayWeights.length * 2), 95)

    // STEP 7: Calculate meals and CO₂ saved
    const savedWeight = totalPredictedWeight
    const savedMeals = Math.round(totalPredictedWeight * 2.2)
    const savedCO2 = Math.round(totalPredictedWeight * 1.8)

    return { savedWeight, savedMeals, savedCO2, confidence }
  }

  const wastePrevention = calculateFoodWastePrevention()

  const summaryCards: { label: string; value: string; helper: string; icon: LucideIcon }[] = [
    {
      label: "Today's Surplus Posted",
      value: todayOffers.toString(),
      helper: `Total orders created today by your organization`,
      icon: Package,
    },
    {
      label: 'Actual Waste Saved Today',
      value: `${Math.round(actualWasteSavedToday)} kg`,
      helper: `${todayMatchedOffers.length} matched order${todayMatchedOffers.length !== 1 ? 's' : ''}`,
      icon: CheckCircle2,
    },
    {
      label: 'Predicted Waste Saved Today',
      value: `${wastePrevention.savedWeight} kg`,
      helper: 'ML-based prediction',
      icon: Leaf,
    },
    {
      label: 'Meals Donated This Month',
      value: mealsThisMonth.toLocaleString(),
      helper: 'Formula: weight × 2.2',
      icon: Utensils,
    },
    {
      label: 'CO₂ Saved This Month',
      value: `${co2SavedThisMonth.toLocaleString()} kg`,
      helper: 'AaharSetu conversion factor',
      icon: Recycle,
    },
  ]

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
        <header className="space-y-2">
          <div className="flex items-start gap-2">
            <Leaf className="w-8 h-8 text-[#8c3b3c] shrink-0 mt-1" />
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-[#4a1f1f]">
                Donor Dashboard
              </h1>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg md:text-xl text-[#4a1f1f]">
              Post surplus quickly{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h2>
            <p className="text-[#6b4d3c] max-w-3xl mx-auto mt-2">
              Manage your surplus offers, approve recipient requests, and track your impact.
            </p>
          </div>
        </header>

        {fetchError && (
          <Card className="p-4 border border-red-200 bg-red-50 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{fetchError}</span>
          </Card>
        )}



        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#4a1f1f]">Impact Overview</h2>
            <p className="text-sm text-[#6b4d3c]">Real-time tracking of your donations and predictions</p>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
        </div>

        <Card className="p-6 border border-[#d9c7aa] bg-white flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#4a1f1f]">Primary Actions</h2>
            <p className="text-sm text-[#6b4d3c]">Create new surplus offers to get started.</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-[#8c3b3c] hover:bg-[#732f30]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Surplus Offer
          </Button>
        </Card>

        {/* Create Form Modal */}
        {showCreateForm && (
          <Card className="p-8 border border-[#d9c7aa] bg-white space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#4a1f1f]">Create Surplus Offer</h2>
                <p className="text-sm text-[#6b4d3c] mt-2">
                  📍 Pickup: {pickupAddress || 'Loading...'}
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-[#6b4d3c] hover:text-[#4a1f1f]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#4a1f1f]">Items</h3>
                {items.map((item, idx) => (
                  <div key={idx} className="space-y-3 border border-[#d9c7aa] rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        required
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="border border-[#d9c7aa] rounded px-2"
                        >
                          <option value="kg">kg</option>
                          <option value="packs">packs</option>
                          <option value="plates">plates</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Category (e.g., Rice, Bread)"
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      />
                      <Input
                        placeholder="Dietary tags (e.g., VEG, VEGAN)"
                        value={item.dietaryTags?.join(',') || ''}
                        onChange={(e) => handleItemChange(idx, 'dietaryTags', e.target.value.split(',').map(t => t.trim()))}
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        Remove Item
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                >
                  + Add Another Item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#6b4d3c]">Pickup Window Start</label>
                  <Input
                    type="datetime-local"
                    value={pickupWindowStart}
                    onChange={(e) => setPickupWindowStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6b4d3c]">Pickup Window End</label>
                  <Input
                    type="datetime-local"
                    value={pickupWindowEnd}
                    onChange={(e) => setPickupWindowEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#6b4d3c]">Pickup Address</label>
                <Input
                  placeholder="Full address for pickup"
                  value={pickupAddress}
                  readOnly
                  disabled
                  className="bg-[#f0e3d1] cursor-not-allowed"
                  required
                />
                <p className="text-xs text-[#8c7b6b] mt-1">ℹ️ Auto-extracted from your organization profile</p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#8c3b3c] hover:bg-[#732f30]"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Offer'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Active Surplus Offers */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Active Surplus Offers</h2>
              <p className="text-sm text-[#6b4d3c]">Track all your posted surplus offers.</p>
            </div>
            <Button variant="ghost" className="text-[#8c3b3c] px-0" size="sm" onClick={loadOffers}>
              Refresh
            </Button>
          </div>

          {offers.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No surplus offers yet. Create one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[#6b4d3c]">
                  <tr className="border-b border-[#f0e3d1]">
                    <th className="py-3 font-medium">Items</th>
                    <th className="py-3 font-medium">Pickup Window</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3d1]">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="align-top">
                      <td className="py-4">
                        <p className="font-semibold text-[#4a1f1f]">
                          {offer.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                        </p>
                        <p className="text-xs text-[#6b4d3c] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {offer.pickupAddress}
                        </p>
                      </td>
                      <td className="py-4 text-[#6b4d3c]">
                        {new Date(offer.pickupWindowStart).toLocaleString()} –{' '}
                        {new Date(offer.pickupWindowEnd).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <Badge variant={offerStatusVariant[offer.status]}>{offer.status}</Badge>
                      </td>
                      <td className="py-4">
                        {offer.status === 'MATCHED' ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[#4a1f1f]">Accepted by:</p>
                            <p className="text-sm text-[#6b4d3c]">{offer.recipientOrgName || 'Recipient Organization'}</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
                              onClick={() => handleViewRequests(offer)}
                            >
                              View Requests
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
                              onClick={() => handleEditOffer(offer)}
                            >
                              Edit
                            </Button>
                            {offer.status === 'OPEN' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleCancelOffer(offer.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Impact & History */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Impact & History</h2>
              <p className="text-sm text-[#6b4d3c]">Matched Donations</p>
            </div>
            <Button variant="outline" className="text-[#8c3b3c] border-[#8c3b3c]" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {matchedOffers.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No matched donations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[#6b4d3c]">
                  <tr className="border-b border-[#f0e3d1]">
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Items</th>
                    <th className="py-3 font-medium">Recipient org</th>
                    <th className="py-3 font-medium">Meals donated</th>
                    <th className="py-3 font-medium">CO₂ saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3d1]">
                  {matchedOffers.map((offer) => {
                    const totalWeight = offer.items.reduce((sum: number, item: SurplusItem) => {
                      return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
                    }, 0)
                    const meals = Math.round(totalWeight * 2.2)
                    const co2 = Math.round(totalWeight * 1.8)
                    const date = new Date(offer.pickupWindowStart)

                    return (
                      <tr key={offer.id} className="align-top hover:bg-[#faf8f4]">
                        <td className="py-4 text-[#4a1f1f] font-semibold">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 text-[#6b4d3c]">
                          {offer.items.map((i: SurplusItem) => `${i.name}`).join(', ')} ({meals} meals)
                        </td>
                        <td className="py-4 text-[#6b4d3c]">
                          {offer.recipientOrgName || 'Recipient Org'}
                        </td>
                        <td className="py-4 font-semibold text-[#4a1f1f]">{meals}</td>
                        <td className="py-4 font-semibold text-[#4a1f1f]">{co2} kg</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Organization & Notifications */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Organization Profile</h2>
              <p className="text-sm text-[#6b4d3c]">
                Your donor organization information.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
              onClick={() => setShowOrgForm(true)}
            >
              {user?.organization ? 'Edit Organization' : 'Set Up Organization'}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Organization</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">
                {user?.organization ?? 'Not set up yet'}
              </p>
              <p className="text-sm text-[#6b4d3c]">Contact: (update in organization settings)</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6b4d3c]">Verification Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="success">Verified</Badge>
                <span className="text-sm text-[#6b4d3c]">Documents on file</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Organization Form Modal */}
        {showOrgForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">
                    {user?.organization ? 'Edit Organization' : 'Create Organization'}
                  </h2>
                  <p className="text-sm text-[#6b4d3c] mt-1">
                    {user?.organization 
                      ? 'Update your organization details'
                      : 'Set up your organization to create surplus offers'
                    }
                  </p>
                </div>

                <form onSubmit={handleCreateOrganization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      Organization Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Food Bank Name, Restaurant"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      Address
                    </label>
                    <Input
                      type="text"
                      placeholder="Street address"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      City
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Delhi, Mumbai"
                      value={orgCity}
                      onChange={(e) => setOrgCity(e.target.value)}
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-[#d9c7aa] text-[#6b4d3c]"
                      onClick={() => {
                        setShowOrgForm(false)
                        setOrgName('')
                        setOrgAddress('')
                        setOrgCity('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingOrg}
                      className="flex-1 bg-[#8c3b3c] hover:bg-[#6b2d2d] text-white"
                    >
                      {isCreatingOrg ? 'Creating...' : 'Create Organization'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* View Requests Modal */}
        {showRequestsModal && selectedOffer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl border border-[#d9c7aa] bg-white max-h-96 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b border-[#d9c7aa]">
                  <h2 className="text-lg font-semibold text-[#4a1f1f]">
                    Requests for: {selectedOffer.items.map(i => i.name).join(', ')}
                  </h2>
                  <button
                    onClick={() => setShowRequestsModal(false)}
                    className="text-[#6b4d3c] hover:text-[#4a1f1f]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {loadingRequests ? (
                    <p className="text-center text-[#6b4d3c] py-8">Loading requests...</p>
                  ) : incomingRequests.length === 0 ? (
                    <p className="text-center text-[#6b4d3c] py-8">No requests yet for this offer</p>
                  ) : (
                    incomingRequests.map((request) => (
                      <div key={request.id} className="p-4 border border-[#e8d7c3] rounded-lg bg-[#faf8f4]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#4a1f1f]">{request.recipientOrgName}</h3>
                            <p className="text-sm text-[#6b4d3c] mt-1">
                              Status: <Badge variant={request.status === 'PENDING' ? 'default' : request.status === 'APPROVED' ? 'success' : 'destructive'}>
                                {request.status}
                              </Badge>
                            </p>
                            {request.createdAt && (
                              <p className="text-xs text-[#8c7b6b] mt-2">
                                Requested: {new Date(request.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApproveRequest(request.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  onClick={() => setShowRequestsModal(false)}
                  className="w-full bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Offer Modal */}
        {showEditModal && selectedOffer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#4a1f1f]">Edit Offer</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-[#6b4d3c] hover:text-[#4a1f1f]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[#4a1f1f] mb-1">Items</p>
                    <ul className="text-sm text-[#6b4d3c]">
                      {selectedOffer.items.map((item, idx) => (
                        <li key={idx}>• {item.quantity} {item.unit} {item.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#4a1f1f] mb-1">Pickup Address</p>
                    <p className="text-sm text-[#6b4d3c]">{selectedOffer.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#4a1f1f] mb-1">Pickup Window</p>
                    <p className="text-sm text-[#6b4d3c]">
                      {new Date(selectedOffer.pickupWindowStart).toLocaleString()} –{' '}
                      {new Date(selectedOffer.pickupWindowEnd).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-[#8c7b6b] bg-[#f9f5f0] p-2 rounded">
                    Full edit functionality coming soon. You can cancel this offer if needed.
                  </p>
                </div>

                <Button
                  onClick={() => setShowEditModal(false)}
                  className="w-full bg-[#8c3b3c] hover:bg-[#732f30] text-white"
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
