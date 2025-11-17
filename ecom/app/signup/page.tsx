'use client'

import { Suspense } from 'react'
import { Leaf } from 'lucide-react'
import Link from 'next/link'
import SignupForm from './signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex flex-col">
      <nav className="border-b border-border bg-background/95 backdrop-blur px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">FoodShare</span>
          </Link>
          <Link href="/login" className="text-foreground/70 hover:text-foreground transition">
            Already have an account? Sign In
          </Link>
        </div>
      </nav>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Get Started</h1>
            <p className="text-foreground/70">Join FoodShare and make a difference</p>
          </div>

          <Suspense fallback={<div className="h-96" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
