import { connectToDatabase } from '@/lib/mongodb'
import { getCollection } from '@/lib/mongodb'
import { upsertForecast } from '@/lib/potential-forecast'
import { createNotification } from '@/lib/notifications'
import { ObjectId } from 'mongodb'

const WEEKEND_DAYS = [5, 6] // Friday, Saturday

async function runForecastJob() {
  await connectToDatabase()
  const organizations = await getCollection('organizations')
  const cursor = organizations.find()
  const today = new Date()
  const inSevenDays = new Date(today)
  inSevenDays.setDate(today.getDate() + 7)

  for await (const org of cursor) {
    if (!org._id || !org.createdByUserId) continue

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const day = date.getDay()
      if (WEEKEND_DAYS.includes(day)) {
        const dateKey = date.toISOString().slice(0, 10)
        const predictedSurplusKg = org.impactTotals?.weightKg
          ? Math.max(20, Math.round(org.impactTotals.weightKg * 0.15))
          : 50

        await upsertForecast(org._id, dateKey, predictedSurplusKg)

        await createNotification({
          userId: new ObjectId(org.createdByUserId),
          title: 'Surplus reminder',
          message: `You usually have ${predictedSurplusKg}kg surplus around ${date.toLocaleDateString()}. Want to draft a post?`,
          type: 'REQUEST_RECEIVED',
        })
      }
    }
  }
}

runForecastJob().catch((err) => {
  console.error('Forecast reminder job failed', err)
  process.exit(1)
})
