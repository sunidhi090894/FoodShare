// ecom/lib/firebase.ts

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth'

// Read Firebase configuration from environment variables (client-safe vars)
const requiredEnv = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missing = requiredEnv.filter((k) => !process.env[k as keyof typeof process.env])

let app: FirebaseApp | undefined
let auth: Auth | undefined
let googleProvider: GoogleAuthProvider | undefined
export const isFirebaseConfigured = missing.length === 0

if (!isFirebaseConfigured) {
  // Do not initialize Firebase on the server or when env vars are missing.
  // Exported functions will throw a clear error if used without configuration.
  console.warn(`Firebase is not configured. Missing env: ${missing.join(', ')}`)
} else if (typeof window !== 'undefined') {
  // Only initialize Firebase in the browser environment when configuration is present
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
  } catch (err: any) {
    // Provide clearer runtime message for invalid keys or initialization issues
    console.error('Firebase initialization error:', err?.message || err)
    // Null out to indicate initialization failed
    app = undefined
    auth = undefined
    googleProvider = undefined
  }
}

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Handles Google Sign-in/Sign-up flow, calling the backend API to manage MongoDB user state.
 * @param role The user role to register with if they are a new user.
 * @returns The user object from the backend API (contains MongoDB ID and role for routing).
 */
export const signInWithGoogle = async (role: string = 'donor'): Promise<BackendUser> => {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.'
    )
  }

  if (!auth || !googleProvider) {
    throw new Error('Firebase failed to initialize. Check console for initialization errors.')
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Call your Next.js API route to handle MongoDB registration/login
    const apiRes = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        firebaseId: user.uid,
        role: role,
      }),
    })

    if (!apiRes.ok) {
      const errorData = await apiRes.json()
      // Throw a specific error caught by the UI
      throw new Error(errorData.error || 'Backend login failed to set session.')
    }
    
    const backendUser: BackendUser = await apiRes.json()
    return backendUser
    
  } catch (error: any) {
    console.error('Firebase or Backend Login Error:', error)
    // Re-throw the error to ensure the async function is not missing a return value on this path
    throw new Error(error.message || 'Google Sign-in failed. Check console for details.')
  }
}

export { auth }