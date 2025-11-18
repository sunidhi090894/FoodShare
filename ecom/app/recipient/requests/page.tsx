'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Clock, Store, CheckCircle2, Loader2 } from 'lucide-react'

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED'

interface RequestResponse {
  id: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  surplus?: {
    id: string
    items: { name: string; quantity: number; unit: string }[]
    pickupWindowStart: string
    pickupWindowEnd: string
    pickupAddress: string
    organization?: { name: string }
  }
}

const statusCopy: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  FULFILLED: { label: 'Fulfilled', variant: 'secondary' },
}

export default function RecipientRequestsPage() {
  useProtectedRoute('RECIPIENT')
  const { firebaseUser } = useAuth()
  const [requests, setRequests] = useState<RequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!firebaseUser) return

    const fetchRequests = async () => {
      setLoading(true)
      setError('')
      try {
        const token = await firebaseUser.getIdToken()
        const res = await fetch('/api/requests/mine', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load requests')
        }

        const data = await res.json()
        setRequests(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load requests'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [firebaseUser])

  const summaryText = (request: RequestResponse) => {
    const item = request.surplus?.items?.[0]
    if (!item) return 'Surplus bundle'
    const extra = (request.surplus?.items?.length || 0) > 1 ? ` (+${(request.surplus?.items?.length || 1) - 1})` : ''
    return `${item.quantity} ${item.unit} · ${item.name}${extra}`
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Recipient Portal</p>
            <h1 className="text-3xl font-bold">My Requests</h1>
            <p className="text-muted-foreground">Track the status of every surplus request you&apos;ve sent.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/recipient/surplus">Browse More Surplus</Link>
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <Card className="p-10 text-center border border-border">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading your requests...</p>
            </div>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="p-10 text-center border border-border">
            <p className="text-muted-foreground">
              No requests yet. Head over to{' '}
              <Link href="/recipient/surplus" className="text-primary underline">
                the surplus board
              </Link>{' '}
              to claim available food.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => {
              const status = statusCopy[request.status]
              return (
                <Card key={request.id} className="p-5 border border-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Store className="w-4 h-4" />
                      <span>{request.surplus?.organization?.name || 'Donor organization'}</span>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{summaryText(request)}</h2>
                    <p className="text-sm text-muted-foreground">{request.surplus?.pickupAddress}</p>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Requested {new Date(request.createdAt).toLocaleString()}
                    </p>
                    {request.surplus && (
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Pickup: {new Date(request.surplus.pickupWindowStart).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
