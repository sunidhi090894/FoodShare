'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useProtectedRoute } from '@/hooks/use-protected-route'

interface ItemFormState {
  name: string
  quantity: string
  unit: string
  category: string
  dietaryTags: string
  allergenTags: string
}

export default function NewSurplusOfferPage() {
  useProtectedRoute('DONOR')
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [items, setItems] = useState<ItemFormState[]>([
    { name: '', quantity: '', unit: 'kg', category: '', dietaryTags: '', allergenTags: '' },
  ])
  const [pickupWindowStart, setPickupWindowStart] = useState('')
  const [pickupWindowEnd, setPickupWindowEnd] = useState('')
  const [expiryDateTime, setExpiryDateTime] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [totalWeight, setTotalWeight] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateItem = (index: number, field: keyof ItemFormState, value: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', quantity: '', unit: 'kg', category: '', dietaryTags: '', allergenTags: '' }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!firebaseUser) return
    setIsSubmitting(true)
    setError('')

    try {
      const token = await firebaseUser.getIdToken()
      const payload = {
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
          category: item.category || undefined,
          dietaryTags: item.dietaryTags ? item.dietaryTags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
          allergenTags: item.allergenTags ? item.allergenTags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        })),
        totalWeightKg: totalWeight ? Number(totalWeight) : undefined,
        pickupWindowStart,
        pickupWindowEnd,
        pickupAddress,
        expiryDateTime,
      }

      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to create surplus offer')
      }

      router.push('/donor/surplus')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Surplus Offer</p>
          <h1 className="text-3xl font-bold">Create New Surplus Offer</h1>
          <p className="text-muted-foreground">
            Share exactly what&apos;s available so recipients and volunteers can coordinate pickups quickly.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Items</h2>
                <Button type="button" variant="outline" onClick={addItem}>
                  Add Item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input required value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        required
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Unit</label>
                      <Input required value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input value={item.category} onChange={(e) => updateItem(index, 'category', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Dietary Tags (comma separated)</label>
                      <Input value={item.dietaryTags} onChange={(e) => updateItem(index, 'dietaryTags', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Allergen Tags (comma separated)</label>
                      <Input value={item.allergenTags} onChange={(e) => updateItem(index, 'allergenTags', e.target.value)} />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">Pickup Window Start</label>
                <Input type="datetime-local" required value={pickupWindowStart} onChange={(e) => setPickupWindowStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Pickup Window End</label>
                <Input type="datetime-local" required value={pickupWindowEnd} onChange={(e) => setPickupWindowEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">Pickup Address</label>
                <Input required value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">
                  Defaults to your organization&apos;s address. Update if pickup is elsewhere.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Weight (kg)</label>
                <Input type="number" min="0" value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Food Expiry Date &amp; Time</label>
              <Input type="datetime-local" required value={expiryDateTime} onChange={(e) => setExpiryDateTime(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/donor/surplus')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Publish Offer'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
