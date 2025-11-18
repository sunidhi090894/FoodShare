'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Building2, AlertCircle } from 'lucide-react'

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'donor'
  const [role, setRole] = useState<string>(initialRole)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const getRouteForRole = (userRole?: string | null, isNewSignup = false) => {
    const normalized = userRole?.toLowerCase()
    if (normalized === 'donor' && isNewSignup) {
      return '/donor/organization'
    }

    switch (normalized) {
      case 'donor':
        return '/donor'
      case 'recipient':
        return '/recipient'
      case 'volunteer':
        return '/volunteer'
      case 'admin':
        return '/admin'
      default:
        return '/dashboard'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Signup failed')
        setIsLoading(false)
        return
      }

      await res.json()
      router.push('/login?welcome=1')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }
  return (
    <>
      {/* Role Selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">I'm a:</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'donor', label: 'Donor', icon: Building2 },
            { id: 'recipient', label: 'Recipient', icon: User },
            { id: 'volunteer', label: 'Volunteer', icon: User },
            { id: 'admin', label: 'Admin', icon: User }
          ].map(r => {
            const Icon = r.icon
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                  role === r.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground/70 hover:border-foreground/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Signup Form */}
      <Card className="p-6 border border-border">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-foreground/40" />
              <Input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="pl-10 bg-input border-border"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-foreground/40" />
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 bg-input border-border"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-foreground/40" />
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 bg-input border-border"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-xs text-foreground/60 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </Card>

      <p className="text-center text-sm text-foreground/70">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in here
        </Link>
      </p>
    </>
  )
}
