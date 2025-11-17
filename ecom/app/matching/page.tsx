'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Users, Zap, LogOut, Menu, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface Match {
  recipient: { _id: string; name: string; address: string; latitude: number; longitude: number }
  score: number
}

interface SurplusWithMatches {
  _id: string
  itemType: string
  quantity: number
  unit: string
  matches: Match[]
  loading: boolean
}

export default function MatchingPage() {
  const [surplusOffers, setSurplusOffers] = useState<SurplusWithMatches[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)

  useEffect(() => {
    fetchSurplusAndMatches()
  }, [])

  const fetchSurplusAndMatches = async () => {
    try {
      const res = await fetch('/api/surplus')
      if (res.ok) {
        const data = await res.json()
        // For each surplus, find matches
        const withMatches = await Promise.all(
          data.map(async (surplus: any) => {
            try {
              const matchRes = await fetch('/api/matching-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surplusId: surplus._id })
              })
              const matches = await matchRes.json()
              return { ...surplus, matches, loading: false }
            } catch {
              return { ...surplus, matches: [], loading: false }
            }
          })
        )
        setSurplusOffers(withMatches)
      }
    } catch (error) {
      console.log('[v0] Error fetching surplus:', error)
    }
  }

  const confirmMatch = async (surplusId: string, recipientId: string) => {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surplusId,
          recipientId,
          quantity: 1
        })
      })
      if (res.ok) {
        setSelectedMatch(null)
        fetchSurplusAndMatches()
      }
    } catch (error) {
      console.log('[v0] Error confirming match:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-muted/30 fixed h-screen overflow-y-auto`}>
        <div className="p-6">
          <h2 className="font-bold text-lg mb-8">Matching Engine</h2>
          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-3 text-foreground font-medium">
              <Zap className="w-4 h-4" /> Smart Matches
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <CheckCircle className="w-4 h-4" /> Confirmed
            </a>
            <a href="#" className="flex items-center gap-3 text-foreground/70 hover:text-foreground">
              <MapPin className="w-4 h-4" /> Routes
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : ''} transition-all duration-300`}>
        <header className="border-b border-border bg-background p-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Smart Matching System</h1>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </header>

        <main className="p-8 max-w-7xl">
          <div className="mb-8 p-6 bg-blue-50/50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">How Smart Matching Works</h3>
            <p className="text-sm text-blue-800">Our AI algorithm considers distance, expiry timing, and quantity to find the best matches between donors and recipients.</p>
          </div>

          {/* Surplus Offers with Matches */}
          <div className="space-y-6">
            {surplusOffers.length === 0 ? (
              <Card className="p-12 text-center border border-border">
                <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70">No available surplus to match</p>
              </Card>
            ) : (
              surplusOffers.map(surplus => (
                <Card key={surplus._id} className="p-6 border border-border">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{surplus.itemType}</h3>
                    <p className="text-foreground/70">{surplus.quantity} {surplus.unit} available</p>
                  </div>

                  {/* Top Matches */}
                  <h4 className="font-semibold text-foreground mb-4">AI-Recommended Matches</h4>
                  {surplus.loading ? (
                    <p className="text-foreground/70">Finding best matches...</p>
                  ) : surplus.matches.length === 0 ? (
                    <p className="text-foreground/70 mb-4">No matches found in your area</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {surplus.matches.slice(0, 3).map((match: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg hover:shadow-lg transition cursor-pointer"
                          onClick={() => setSelectedMatch({ surplus, match })}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-foreground">{match.recipient.name}</h5>
                              <p className="text-sm text-foreground/70">{match.recipient.address}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{match.score}%</div>
                              <div className="text-xs text-foreground/60">Match Score</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              confirmMatch(surplus._id, match.recipient._id)
                            }}
                            className="w-full"
                          >
                            Confirm Match
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Match Details Modal */}
          {selectedMatch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-8 border border-border">
                <h2 className="text-2xl font-bold mb-6">Match Details</h2>
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-muted/30 rounded">
                    <p className="text-sm text-foreground/70">Surplus</p>
                    <p className="font-semibold text-foreground">{selectedMatch.surplus.itemType}</p>
                    <p className="text-sm text-foreground/70">{selectedMatch.surplus.quantity} {selectedMatch.surplus.unit}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded">
                    <p className="text-sm text-foreground/70">Recipient</p>
                    <p className="font-semibold text-foreground">{selectedMatch.match.recipient.name}</p>
                    <p className="text-sm text-foreground/70">{selectedMatch.match.recipient.address}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded border border-primary">
                    <p className="text-sm text-foreground/70">Match Score</p>
                    <p className="text-2xl font-bold text-primary">{selectedMatch.match.score}%</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => confirmMatch(selectedMatch.surplus._id, selectedMatch.match.recipient._id)}
                    className="flex-1"
                  >
                    Confirm Match
                  </Button>
                  <Button onClick={() => setSelectedMatch(null)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
