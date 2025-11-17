// ecom/app/login/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Leaf, Mail, Lock, AlertCircle, Chrome } from 'lucide-react' // Chrome for Google Sign-in
import { signInWithGoogle, isFirebaseConfigured } from '@/lib/firebase' // Import the Firebase sign-in helper and config flag

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // --- NEW: Google Sign-In Handler ---
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Default role to 'donor' for sign-up, or use the existing user's role if logging in.
      const user = await signInWithGoogle('donor') 
      
      const routes: { [key: string]: string } = {
        donor: '/donor',
        recipient: '/recipient',
        volunteer: '/volunteer',
        admin: '/admin'
      }
      
      router.push(routes[user.role] || '/dashboard') 
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed.')
      setIsLoading(false)
    }
  }
  // --- END NEW FUNCTION ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      const user = await res.json()
      
      // Route to appropriate dashboard based on role
      const routes: { [key: string]: string } = {
        donor: '/donor',
        recipient: '/recipient',
        volunteer: '/volunteer',
        admin: '/admin'
      }
      
      router.push(routes[user.role] || '/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    // FIX: Replaced 'bg-gradient-to-b' with 'bg-linear-to-b'
    <div className="min-h-screen bg-linear-to-b from-background to-muted/50 flex flex-col">
      <nav className="border-b border-border bg-background/95 backdrop-blur px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">FoodShare</span>
          </Link>
          <Link href="/signup" className="text-foreground/70 hover:text-foreground transition">
            Don't have an account? Sign Up
          </Link>
        </div>
      </nav>

      <div className="flex-1 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-foreground/70">Sign in to your FoodShare account</p>
          </div>

          <Card className="p-6 border border-border">
            {/* NEW: Google Sign-In Button (only when Firebase is configured) */}
            {isFirebaseConfigured ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full mb-6"
                disabled={isLoading}
              >
                <Chrome className="w-5 h-5 mr-2" />
                Sign in with Google
              </Button>
            ) : (
              <Button type="button" variant="outline" className="w-full mb-6" disabled>
                <Chrome className="w-5 h-5 mr-2" />
                Google sign-in unavailable
              </Button>
            )}
            {/* END NEW BUTTON */}
            
            {/* Horizontal Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-sm text-foreground/70">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                {/* FIX: Replaced 'flex-shrink-0' with 'shrink-0' */}
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> 
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-foreground/70">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}