// ecom/lib/auth.ts

import { getCollection } from './mongodb'
import crypto from 'crypto'
import { ObjectId } from 'mongodb' // Ensure ObjectId is imported for the new logic
import { coerceUserRole } from './users'

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function registerUser(email: string, password: string, role: string, name: string) {
  const users = await getCollection('users')
  
  const existingUser = await users.findOne({ email })
  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = hashPassword(password)
  const normalizedRole = coerceUserRole(role, 'DONOR') ?? 'DONOR'
  const result = await users.insertOne({
    email,
    password: hashedPassword,
    name,
    role: normalizedRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
    verified: false,
    authMethod: 'email_password' // <--- ADDED authMethod
  })

  return { id: result.insertedId, email, name, role }
}

// --- NEW EXPORTED FUNCTION ---
export async function registerOrLoginSocialUser(email: string, name: string, role: string, firebaseId: string) {
  const users = await getCollection('users')
  const normalizedRole = coerceUserRole(role, 'DONOR') ?? 'DONOR'

  let user = await users.findOne({ email })

  if (user) {
    // If user exists, link Firebase ID if not already linked
    if (user.authMethod !== 'google' || user.firebaseId !== firebaseId) {
      await users.updateOne(
        { _id: user._id },
        { $set: { authMethod: 'google', firebaseId, updatedAt: new Date(), role: user.role || normalizedRole } }
      )
      user = await users.findOne({ _id: user._id })
    }
  } else {
    // If user doesn't exist, register them as a Google user
    const result = await users.insertOne({
      email,
      name,
      role: normalizedRole, 
      firebaseId,
      authMethod: 'google', // <--- ADDED authMethod
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      verified: false
    })
    user = await users.findOne({ _id: result.insertedId })
  }

  if (!user) {
     throw new Error('Failed to retrieve user data after social login.')
  }

  return { id: user._id, email: user.email, name: user.name, role: user.role }
}
// --- END NEW EXPORTED FUNCTION ---

export async function loginUser(email: string, password: string) {
  const users = await getCollection('users')
  const user = await users.findOne({ email })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // <--- MODIFIED TO CHECK FOR AUTH METHOD
  if (user.authMethod === 'google') {
    throw new Error('This account is registered via Google. Please use Google Sign-In.')
  }
  // END MODIFICATION --->

  const hashedPassword = hashPassword(password)
  if (user.password !== hashedPassword) {
    throw new Error('Invalid credentials')
  }

  return { id: user._id, email: user.email, name: user.name, role: user.role }
}

export async function getUserById(id: string) {
  const users = await getCollection('users')
  // Use the imported ObjectId
  return await users.findOne({ _id: new ObjectId(id) })
}
