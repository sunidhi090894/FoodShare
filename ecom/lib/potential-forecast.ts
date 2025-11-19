import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'

export interface PotentialSurplusForecast {
  _id: ObjectId
  organizationId: ObjectId
  date: string // YYYY-MM-DD
  predictedSurplusKg: number
  createdAt: Date
}

export async function upsertForecast(organizationId: ObjectId, date: string, predictedSurplusKg: number) {
  const collection = await getCollection<PotentialSurplusForecast>('potential_surplus_forecasts')
  await collection.updateOne(
    { organizationId, date },
    {
      $set: {
        predictedSurplusKg,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

export async function listUpcomingForecasts(organizationId: ObjectId, fromDate: string) {
  const collection = await getCollection<PotentialSurplusForecast>('potential_surplus_forecasts')
  return collection
    .find({
      organizationId,
      date: { $gte: fromDate },
    })
    .sort({ date: 1 })
    .toArray()
}
