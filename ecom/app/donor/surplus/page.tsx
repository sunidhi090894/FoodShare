'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useProtectedRoute } from '@/hooks/use-protected-route'

interface SurplusItem {
  name: string
  quantity: number
  unit: string
  category?: string
}

interface SurplusOffer {
  id: string
  items: SurplusItem[]
  status: string
  pickupWindowStart: string
  pickupWindowEnd: string
  createdAt: string
  expiryDateTime: string
  pickupAddress: string
}

const STATUS_FILTERS = ['ALL', 'OPEN', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED'] as const

export default function DonorSurplusListPage() {
  useProtectedRoute('DONOR')
  const { firebaseUser } = useAuth()
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL')
  const [offers, setOffers] = useState<SurplusOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!firebaseUser) return
    const fetchOffers = async () => {
      setLoading(true)
      setError('')
      try {
        const token = await firebaseUser.getIdToken()
        const params = filter === 'ALL' ? '' : `?status=${filter}`
        const res = await fetch(`/api/surplus/my${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load offers')
        }
        const data = await res.json()
        setOffers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchOffers()
  }, [firebaseUser, filter])

  const groupedOffers = useMemo(() => offers, [offers])

  const cancelOffer = async (offerId: string) => {
    if (!firebaseUser) return
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch(`/api/surplus/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to cancel offer')
      }
      setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, status: 'CANCELLED' } : offer)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel offer'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Surplus Offers</p>
            <h1 className="text-3xl font-bold">Manage Your Surplus Offers</h1>
            <p className="text-muted-foreground">Track pickup windows, statuses, and create new offers as needed.</p>
          </div>
          <Button asChild>
            <Link href="/donor/surplus/new">Create Offer</Link>
          </Button>
        </div>

        <Card className="p-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              variant={status === filter ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="px-4"
            >
              {status}
            </Button>
          ))}
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <Card className="p-6 text-center text-muted-foreground">Loading offers...</Card>
        ) : groupedOffers.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No offers found.</Card>
        ) : (
          <div className="grid gap-4">
            {groupedOffers.map((offer) => (
              <Card key={offer.id} className="p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">Offer #{offer.id.slice(-6)}</h2>
                      <span
                        className={`px-3 py-1 text-xs rounded-full border ${
                          offer.status === 'CANCELLED'
                            ? 'border-red-200 text-red-700 bg-red-50'
                            : offer.status === 'EXPIRED'
                              ? 'border-amber-200 text-amber-700 bg-amber-50'
                              : offer.status === 'MATCHED'
                                ? 'border-blue-200 text-blue-700 bg-blue-50'
                                : offer.status === 'FULFILLED'
                                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                  : 'border-primary/40 text-primary bg-primary/10'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pickup: {new Date(offer.pickupWindowStart).toLocaleString()} –{' '}
                      {new Date(offer.pickupWindowEnd).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Expires: {new Date(offer.expiryDateTime).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Address: {offer.pickupAddress}</p>
                  </div>
                  {offer.status === 'OPEN' && (
                    <Button variant="outline" onClick={() => cancelOffer(offer.id)}>
                      Cancel Offer
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {offer.items.map((item, idx) => (
                      <span key={`${offer.id}-${idx}`} className="px-3 py-1 text-xs rounded-full bg-muted text-foreground">
                        {item.quantity} {item.unit} · {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
