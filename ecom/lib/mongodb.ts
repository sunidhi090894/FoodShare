import { MongoClient, Db, Collection } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db('foodshare')

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getCollection(name: string): Promise<Collection> {
  const { db } = await connectToDatabase()
  return db.collection(name)
}

// Initialize collections and indexes
export async function initializeDatabase() {
  const { db } = await connectToDatabase()

  // Create collections with validation
  const collections = ['users', 'organizations', 'surplus_offers', 'matches', 'deliveries', 'impact_metrics', 'notifications']
  
  for (const collection of collections) {
    try {
      await db.createCollection(collection)
    } catch (error: any) {
      if (error.codeName !== 'NamespaceExists') {
        throw error
      }
    }
  }

  // Create indexes for better query performance
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('users').createIndex({ role: 1 })
  await db.collection('organizations').createIndex({ userId: 1 })
  await db.collection('surplus_offers').createIndex({ organizationId: 1 })
  await db.collection('surplus_offers').createIndex({ status: 1 })
  await db.collection('surplus_offers').createIndex({ createdAt: -1 })
  await db.collection('matches').createIndex({ surplusId: 1 })
  await db.collection('matches').createIndex({ recipientId: 1 })
  await db.collection('matches').createIndex({ status: 1 })
  await db.collection('deliveries').createIndex({ matchId: 1 })
  await db.collection('deliveries').createIndex({ volunteerId: 1 })
  await db.collection('impact_metrics').createIndex({ userId: 1 })
  await db.collection('notifications').createIndex({ userId: 1, read: 1 })
}
