import 'dotenv/config';
import './network.js';
import { MongoClient, BSON } from 'mongodb';
const { EJSON } = BSON;
import { readFile } from 'node:fs/promises';
if (!process.env.MONGODB_URI) throw Error('Set MONGODB_URI in .env first.');
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const collection = client
    .db(process.env.MONGODB_DB || 'dbRestaurants')
    .collection(process.env.MONGODB_COLLECTION || 'restaurants');
  await collection.createIndex({ restaurant_id: 1 }, { unique: true });
  const records = EJSON.parse(
    await readFile(new URL('./data/restaurants.json', import.meta.url), 'utf8'),
  );
  const result = await collection.bulkWrite(
    records.map((r) => ({
      updateOne: {
        filter: { restaurant_id: r.restaurant_id },
        update: { $setOnInsert: r },
        upsert: true,
      },
    })),
  );
  console.log(`Imported ${result.upsertedCount} new records; existing records preserved.`);
} finally {
  await client.close();
}
