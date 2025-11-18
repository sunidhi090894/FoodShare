'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Store, Loader2, Truck } from 'lucide-react'

type PickupStatus = 'ASSIGNED' | 'ACCEPTED' | 'ON_ROUTE' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'

interface PickupTask {
  id: string
  status: PickupStatus
  surplus?: {
    id: string
    items: { name: string; quantity: number; unit: string }[]
    pickupWindowStart: string
    pickupWindowEnd: string
    pickupAddress: string
  }
  donorOrg?: { name: string; address: string }
  recipientOrg?: { name: string; address: string }
}

const ACTIONS: Partial<Record<PickupStatus, { label: string; next: PickupStatus }>> = {
  ASSIGNED: { label: 'Accept Task', next: 'ACCEPTED' },
  ACCEPTED: { label: 'Start Pickup', next: 'ON_ROUTE' },
  ON_ROUTE: { label: 'Picked Up', next: 'PICKED_UP' },
  PICKED_UP: { label: 'Delivered', next: 'DELIVERED' },
}

const STATUS_COPY: Record<PickupStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' }> = {
  ASSIGNED: { label: 'Assigned', variant: 'warning' },
  ACCEPTED: { label: 'Accepted', variant: 'default' },
  ON_ROUTE: { label: 'On Route', variant: 'secondary' },
  PICKED_UP: { label: 'Picked Up', variant: 'secondary' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export default function VolunteerTasksPage() {
  useProtectedRoute('VOLUNTEER')
  const { firebaseUser } = useAuth()
  const [tasks, setTasks] = useState<PickupTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deliveryForms, setDeliveryForms] = useState<Record<string, { photoUrl: string; weight: string; recipient: string }>>(
    {}
  )

  useEffect(() => {
    if (!firebaseUser) return

    const fetchTasks = async () => {
      setLoading(true)
      setError('')
      try {
        const token = await firebaseUser.getIdToken()
        const res = await fetch('/api/pickups/my', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load tasks')
        }
        const data = await res.json()
        setTasks(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load tasks'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [firebaseUser])

  const groupedTasks = useMemo(() => {
    return {
      active: tasks.filter((task) => ['ASSIGNED', 'ACCEPTED', 'ON_ROUTE', 'PICKED_UP'].includes(task.status)),
      completed: tasks.filter((task) => task.status === 'DELIVERED'),
      cancelled: tasks.filter((task) => task.status === 'CANCELLED'),
    }
  }, [tasks])

  const updateStatus = async (taskId: string, nextStatus: PickupStatus) => {
    if (!firebaseUser) return
    if (nextStatus === 'DELIVERED') {
      const form = deliveryForms[taskId]
      const weight = form?.weight ? parseFloat(form.weight) : NaN
      if (!form || Number.isNaN(weight) || weight <= 0) {
        setError('Please provide the delivered weight before confirming.')
        return
      }
    }
    setUpdating(taskId)
    setError('')
    try {
      const token = await firebaseUser.getIdToken()
      const payload: Record<string, unknown> = { status: nextStatus }
      if (nextStatus === 'DELIVERED') {
        const form = deliveryForms[taskId]
        payload.deliveredWeightKg = parseFloat(form?.weight || '0')
        if (form?.photoUrl) payload.photoUrl = form.photoUrl
        if (form?.recipient) payload.recipientSignature = form.recipient
      }
      const res = await fetch(`/api/pickups/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to update task')
      }

      const updatedTask = await res.json()
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)))
      if (nextStatus === 'DELIVERED') {
        setDeliveryForms((prev) => {
          const clone = { ...prev }
          delete clone[taskId]
          return clone
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task'
      setError(message)
    } finally {
      setUpdating(null)
    }
  }

  const renderTask = (task: PickupTask) => {
    const action = ACTIONS[task.status]
    const statusMeta = STATUS_COPY[task.status]
    const firstItem = task.surplus?.items?.[0]

    return (
      <Card key={task.id} className="p-5 border border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <Truck className="w-4 h-4" />
            <span>Task #{task.id.slice(-6)}</span>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {firstItem ? `${firstItem.quantity} ${firstItem.unit} · ${firstItem.name}` : 'Food Pickup'}
          </h3>
          <p className="text-sm text-muted-foreground">{task.surplus?.pickupAddress}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            {task.donorOrg?.name || 'Donor'}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {task.recipientOrg?.name || 'Recipient'}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pickup window: {task.surplus ? `${new Date(task.surplus.pickupWindowStart).toLocaleString()} – ${new Date(task.surplus.pickupWindowEnd).toLocaleString()}` : 'TBD'}
          </p>
        </div>
        {action && (
          <div className="space-y-3">
            {action.next === 'DELIVERED' && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Delivered weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={deliveryForms[task.id]?.weight || ''}
                    onChange={(event) =>
                      setDeliveryForms((prev) => ({
                        ...prev,
                        [task.id]: {
                          photoUrl: prev[task.id]?.photoUrl || '',
                          weight: event.target.value,
                          recipient: prev[task.id]?.recipient || '',
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Photo URL</label>
                  <input
                    type="url"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={deliveryForms[task.id]?.photoUrl || ''}
                    onChange={(event) =>
                      setDeliveryForms((prev) => ({
                        ...prev,
                        [task.id]: {
                          photoUrl: event.target.value,
                          weight: prev[task.id]?.weight || '',
                          recipient: prev[task.id]?.recipient || '',
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Recipient Name / Signature</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={deliveryForms[task.id]?.recipient || ''}
                    onChange={(event) =>
                      setDeliveryForms((prev) => ({
                        ...prev,
                        [task.id]: {
                          photoUrl: prev[task.id]?.photoUrl || '',
                          weight: prev[task.id]?.weight || '',
                          recipient: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
            <Button onClick={() => updateStatus(task.id, action.next)} disabled={updating === task.id}>
              {updating === task.id ? 'Updating…' : action.label}
            </Button>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Volunteer Tasks</p>
          <h1 className="text-3xl font-bold">Today’s pickups</h1>
          <p className="text-muted-foreground">Accept assignments, follow the pickup order, and mark each stage so donors and recipients stay updated.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <Card className="p-10 text-center border border-border">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading your tasks…</p>
            </div>
          </Card>
        ) : groupedTasks.active.length === 0 ? (
          <Card className="p-10 text-center border border-border">
            <p className="text-muted-foreground">No active tasks. Hang tight for your next assignment!</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groupedTasks.active.map(renderTask)}
          </div>
        )}

        {groupedTasks.completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Completed</h2>
            <div className="grid gap-3">{groupedTasks.completed.map(renderTask)}</div>
          </div>
        )}

        {groupedTasks.cancelled.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Cancelled</h2>
            <div className="grid gap-3">{groupedTasks.cancelled.map(renderTask)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
