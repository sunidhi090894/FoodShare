import { getCollection } from './mongodb'
import crypto from 'crypto'

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
  const result = await users.insertOne({
    email,
    password: hashedPassword,
    name,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
    verified: false
  })

  return { id: result.insertedId, email, name, role }
}

export async function loginUser(email: string, password: string) {
  const users = await getCollection('users')
  const user = await users.findOne({ email })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const hashedPassword = hashPassword(password)
  if (user.password !== hashedPassword) {
    throw new Error('Invalid credentials')
  }

  return { id: user._id, email: user.email, name: user.name, role: user.role }
}

export async function getUserById(id: string) {
  const users = await getCollection('users')
  const { ObjectId } = await import('mongodb')
  return await users.findOne({ _id: new ObjectId(id) })
}
