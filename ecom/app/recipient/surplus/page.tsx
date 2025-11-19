'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProtectedRoute } from '@/hooks/use-protected-route'

import { MapPin, Clock, Store, Loader2 } from 'lucide-react'

interface OrganizationSummary {
  name: string
  city?: string
  address?: string
}

interface SurplusOffer {
  id: string
  items: { name: string; quantity: number; unit: string }[]
  pickupWindowStart: string
  pickupWindowEnd: string
  pickupAddress: string
  expiryDateTime: string
  organization?: OrganizationSummary
}

export default function RecipientSurplusPage() {
  useProtectedRoute('RECIPIENT')
  // TODO: Replace with actual user context if needed
  const [offers, setOffers] = useState<SurplusOffer[]>([])
  const [cityFilter, setCityFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    // TODO: Add authentication/user context if needed
    // Example: fetch organization city if user context is available
  }, [])

  useEffect(() => {
    // TODO: Add authentication/user context if needed
    const fetchOffers = async () => {
      setLoading(true)
      setError('')
      try {
        const params = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : ''
        const res = await fetch(`/api/surplus/available${params}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load surplus offers')
        }
        const data = await res.json()
        setOffers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load surplus offers'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchOffers()
  }, [cityFilter])

  const summaryText = (items: SurplusOffer['items']) => {
    if (!items?.length) return 'Multiple items'
    const [first, ...rest] = items
    return `${first.quantity} ${first.unit} · ${first.name}${rest.length ? ` (+${rest.length})` : ''}`
  }

  const handleRequest = async (offerId: string) => {
    // TODO: Add authentication/user context if needed
    setRequestingId(offerId)
    setFeedback('')
    setError('')

    try {
      const res = await fetch(`/api/surplus/${offerId}/request`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to request surplus')
      }

      setFeedback('Request sent! We will notify you once the donor approves.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to request surplus'
      setError(message)
    } finally {
      setRequestingId(null)
    }
  }

  const headerCity = useMemo(() => cityFilter || 'All Cities', [cityFilter])

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Recipient Marketplace</p>
            <h1 className="text-3xl font-bold">Surplus Near {headerCity}</h1>
            <p className="text-muted-foreground">
              Browse active food donations from trusted partners. Request what fits your program&apos;s needs.
            </p>
          </div>
          <Button asChild>
            <Link href="/recipient/requests">View My Requests</Link>
          </Button>
        </div>

        <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Filter by city</label>
            <input
              type="text"
              className="rounded-md border border-border bg-background px-3 py-2"
              placeholder="e.g. New York"
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {offers.length} offer{offers.length === 1 ? '' : 's'} {cityFilter ? `in ${cityFilter}` : 'nationwide'}.
          </p>
        </Card>

        {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <Card className="p-12 text-center border border-border">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Fetching surplus offers...</p>
            </div>
          </Card>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center border border-border">
            <p className="text-muted-foreground">No open offers match your filters right now. Try another city or check back soon.</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {offers.map((offer) => (
              <Card key={offer.id} className="p-5 border border-border flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="w-4 h-4" />
                  <span>{offer.organization?.name || 'Anonymous Donor'}</span>
                  {offer.organization?.city && (
                    <Badge variant="secondary">{offer.organization.city}</Badge>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{summaryText(offer.items)}</h2>
                  <p className="text-sm text-muted-foreground">{offer.pickupAddress}</p>
                </div>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pickup: {new Date(offer.pickupWindowStart).toLocaleString()} –{' '}
                    {new Date(offer.pickupWindowEnd).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Expires {new Date(offer.expiryDateTime).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleRequest(offer.id)}
                  disabled={requestingId === offer.id}
                >
                  {requestingId === offer.id ? 'Sending Request...' : 'Request this Surplus'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
