'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/users'

export function useProtectedRoute(requiredRoles: UserRole | UserRole[], redirectTo = '/login') {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated by attempting to fetch their profile
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) {
          router.replace(redirectTo)
          return
        }
        
        const user = await res.json()
        
        const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
        if (!allowedRoles.includes(user.role)) {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        router.replace(redirectTo)
      }
    }

    checkAuth()
  }, [requiredRoles, redirectTo, router])
}
